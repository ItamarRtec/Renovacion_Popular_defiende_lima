import { timingSafeEqual } from "node:crypto";
import express from "express";
import { z } from "zod";
import { OnpeConsultor, ConsultaError, DniSchema, type ConsultaResultado } from "./consultar.js";

/**
 * Servidor HTTP mínimo que expone la consulta de la ONPE para integración
 * desde el frontend de Defiende Lima. Mantiene una sola instancia de
 * Playwright abierta y la reutiliza entre peticiones (mucho más rápido que
 * arrancar el navegador en cada consulta).
 *
 *   POST /consultar   { "dni": "12345678" }
 *   -> 200 { encontrado, dni, centroVotacion, numeroMesa, ... }
 *   -> 400 DNI inválido
 *   -> 404 no encontrado
 *   -> 502 bloqueo anti-bot / error de la ONPE
 *
 *   GET  /health      -> 200 { ok: true }
 *
 * Seguridad: escucha solo en localhost por defecto (no exponer a internet).
 * Proteger con un token (CONSULTA_TOKEN) si se expone fuera del host local.
 */

const PORT = Number(process.env.PORT ?? "8787");
const HOST = process.env.HOST ?? "127.0.0.1";
const TOKEN = (process.env.CONSULTA_TOKEN ?? "").trim();

const LOOPBACK = new Set(["127.0.0.1", "::1", "localhost"]);
const isLoopback = LOOPBACK.has(HOST);

// Fail-closed: si se expone fuera de loopback, exigir un token. No arrancar
// un oráculo de PID/mesa/miembros abierto a la red.
if (!isLoopback && !TOKEN) {
  console.error(
    `HOST=${HOST} no es loopback y CONSULTA_TOKEN no está definido. ` +
      `Define CONSULTA_TOKEN (o usa HOST=127.0.0.1). Abortando.`,
  );
  process.exit(1);
}

const BodySchema = z.object({ dni: DniSchema });

const consultor = new OnpeConsultor({ headless: true });

/** Comparación en tiempo constante para el token. */
function tokenMatches(provided: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(TOKEN);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function auth(req: express.Request): boolean {
  // Solo se permite sin token en loopback. Fuera de loopback ya exigimos
  // token al arrancar, así que aquí siempre se valida.
  if (!TOKEN) return isLoopback;
  return tokenMatches((req.header("x-consulta-token") ?? "").trim());
}

// Rate limiting best-effort en memoria por IP (evita barridos masivos).
const RL_LIMIT = Number(process.env.CONSULTA_RL_LIMIT ?? "20");
const RL_WINDOW_MS = 60_000;
const rlBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rlBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rlBuckets.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return false;
  }
  if (bucket.count >= RL_LIMIT) return true;
  bucket.count += 1;
  return false;
}

const app = express();
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/consultar", async (req, res) => {
  if (!auth(req)) {
    res.status(401).json({ error: "no autorizado" });
    return;
  }
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  if (rateLimited(ip)) {
    res.status(429).json({ error: "demasiadas consultas, reintenta luego" });
    return;
  }
  const parsed = BodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "DNI inválido",
      detalle: parsed.error.issues[0]?.message ?? "formato incorrecto",
    });
    return;
  }
  try {
    const resultado: ConsultaResultado = await consultor.consultarDni(parsed.data.dni);
    // No reenviar el volcado crudo de la ONPE (PII de terceros / sobre-exposición).
    const { raw: _raw, ...safe } = resultado;
    if (!resultado.encontrado) {
      res.status(404).json(safe);
    } else {
      res.json(safe);
    }
  } catch (err) {
    if (err instanceof ConsultaError) {
      const status =
        err.code === "DNI_INVALIDO" ? 400 :
        err.code === "NO_ENCONTRADO" ? 404 :
        err.code === "ANTIBOT_BLOQUEO" ? 502 :
        err.code === "TIMEOUT" ? 504 : 502;
      res.status(status).json({ error: err.message, code: err.code });
    } else {
      console.error(err);
      res.status(500).json({ error: "error interno" });
    }
  }
});

function shutdown() {
  console.log("\nCerrando navegador y servidor…");
  consultor.close().finally(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

app.listen(PORT, HOST, () => {
  console.log(`onpe-consulta escuchando en http://${HOST}:${PORT}`);
  console.log(`  POST /consultar  { "dni": "12345678" }`);
  console.log(`  GET  /health`);
  if (TOKEN) console.log("  Auth: header x-consulta-token activado");
  if (process.env.PROXY_URL?.trim() || process.env.HTTPS_PROXY?.trim()) {
    console.log("  Proxy: PROXY_URL/HTTPS_PROXY configurado (egress residencial)");
  } else if (!isLoopback) {
    console.warn(
      "  Aviso: sin PROXY_URL — Cloudflare suele bloquear IPs de datacenter (Fly).",
    );
  }
});
