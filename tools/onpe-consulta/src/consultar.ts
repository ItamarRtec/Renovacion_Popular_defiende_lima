import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { z } from "zod";

/**
 * Consulta de lugar de votación en la ONPE por DNI (verificación interna,
 * módulo aislado del frontend ciudadano).
 *
 * La página https://consultaelectoral.onpe.gob.pe/inicio tiene anti-bot
 * (Cloudflare). Abrimos con Playwright (Chromium real) para superar el
 * challenge y, dentro del contexto de la página (mismo origen + cookies),
 * llamamos a la API interna.
 *
 * Flujo (inferido del bundle de la app Angular):
 *   1) POST /v1/api/busqueda/dni  body { numeroDocumento }
 *      -> { success:true, data:{ token } }  (DNI existe)
 *      -> { success:false, titulo:"DNI no encontrado" }  (no existe)
 *   2) POST /v1/api/consulta/definitiva  Authorization: Bearer <token>
 *      -> { success:true, data:{ localVotacion, mesaSufragio, direccion, ... } }
 *      -> { success:false, message:"Consulta Definitiva no habilitada." }
 *   3) POST /v1/api/consulta/provisional  Authorization: Bearer <token>
 *      -> { success:true, data:{ mesaSufragio, ubigeo, cargo, listaMiembros, ... } }
 *
 * Nota: la página sirve hoy las Elecciones Regionales y Municipales 2026 (ERM 2026) con
 * `APP.PUBLICACION_DEFINITIVA=false`, por lo que solo la consulta PROVISIONAL está
 * habilitada. El "centro de votación" (nombre del local, que viene de la DEFINITIVA
 * vía `localVotacion`) puede no estar disponible todavía. El "número de mesa"
 * (`mesaSufragio`) sí está disponible desde la provisional. Cuando la ONPE habilite la
 * definitiva, los campos del local se llenarán automáticamente.
 */

export const ONPE_URL = "https://consultaelectoral.onpe.gob.pe/inicio";
const API_BASE = "https://consultaelectoral.onpe.gob.pe/v1/api";
const EP_BUSQUEDA = `${API_BASE}/busqueda/dni`;
const EP_DEFINITIVA = `${API_BASE}/consulta/definitiva`;
const EP_PROVISIONAL = `${API_BASE}/consulta/provisional`;

export const DniSchema = z
  .string()
  .trim()
  .regex(/^\d{8}$/, "El DNI debe tener exactamente 8 dígitos numéricos");

export type Dni = z.infer<typeof DniSchema>;

type OnpeResp<T> = {
  success?: boolean | null;
  message?: string | null;
  titulo?: string | null;
  data?: T | null;
} & Record<string, unknown>;

type DatoDefinitivo = {
  dni?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  localVotacion?: string | null;
  mesaSufragio?: string | null;
  direccion?: string | null;
  centroPoblado?: string | null;
  ubigeo?: string | null;
  pabellon?: string | null;
  piso?: string | null;
  aula?: string | null;
  referencia?: string | null;
  cargo?: string | null;
};

type DatoProvisional = {
  dni?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  cargo?: string | null;
  miembroMesa?: string | null;
  mesaSufragio?: string | null;
  centroPoblado?: string | null;
  ubigeo?: string | null;
  oficio?: string | null;
  listaMiembros?: Array<{
    dni?: string | null;
    nombres?: string | null;
    apellidoPaterno?: string | null;
    apellidoMaterno?: string | null;
    cargo?: string | null;
  }> | null;
};

export type MiembroMesa = {
  dni: string | null;
  nombres: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  cargo: string | null;
};

export type ConsultaResultado = {
  encontrado: boolean;
  dni: string;
  centroVotacion: string | null;
  numeroMesa: string | null;
  direccion: string | null;
  centroPoblado: string | null;
  ubigeo: string | null;
  pabellon: string | null;
  piso: string | null;
  aula: string | null;
  referencia: string | null;
  nombres: string | null;
  apellidos: string | null;
  cargo: string | null;
  definitivaHabilitada: boolean;
  provisionalHabilitada: boolean;
  mensajeDefinitiva: string | null;
  miembrosMesa: MiembroMesa[];
  fuente: "datoDefinitivo" | "datoProvisional" | null;
  mensaje: string | null;
  raw: {
    busqueda: OnpeResp<{ token?: string }> | null;
    definitiva: OnpeResp<DatoDefinitivo> | null;
    provisional: OnpeResp<DatoProvisional> | null;
  } | null;
};

export class ConsultaError extends Error {
  constructor(
    message: string,
    public code:
      | "DNI_INVALIDO"
      | "NO_ENCONTRADO"
      | "ANTIBOT_BLOQUEO"
      | "TIMEOUT"
      | "RED"
      | "DESCONOCIDO",
  ) {
    super(message);
    this.name = "ConsultaError";
  }
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function stripHtml(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  return s.replace(/<[^>]*>/g, "").trim() || null;
}

function mapearMiembros(lista: DatoProvisional["listaMiembros"]): MiembroMesa[] {
  if (!Array.isArray(lista)) return [];
  return lista.map((m) => ({
    dni: str(m?.dni),
    nombres: str(m?.nombres),
    apellidoPaterno: str(m?.apellidoPaterno),
    apellidoMaterno: str(m?.apellidoMaterno),
    cargo: str(m?.cargo),
  }));
}

function mapearResultado(
  dni: string,
  busqueda: OnpeResp<{ token?: string }> | null,
  definitiva: OnpeResp<DatoDefinitivo> | null,
  provisional: OnpeResp<DatoProvisional> | null,
): ConsultaResultado {
  const base: ConsultaResultado = {
    encontrado: false,
    dni,
    centroVotacion: null,
    numeroMesa: null,
    direccion: null,
    centroPoblado: null,
    ubigeo: null,
    pabellon: null,
    piso: null,
    aula: null,
    referencia: null,
    nombres: null,
    apellidos: null,
    cargo: null,
    definitivaHabilitada: definitiva?.success === true,
    provisionalHabilitada: provisional?.success === true,
    mensajeDefinitiva: stripHtml(definitiva?.message) ?? null,
    miembrosMesa: [],
    fuente: null,
    mensaje: stripHtml(busqueda?.message) ?? null,
    raw: { busqueda, definitiva, provisional },
  };

  const datoDef = definitiva?.success === true ? definitiva.data : null;
  const datoProv = provisional?.success === true ? provisional.data : null;
  if (!datoDef && !datoProv) return base;

  base.encontrado = true;
  base.fuente = datoDef ? "datoDefinitivo" : "datoProvisional";

  if (datoDef) {
    base.centroVotacion = str(datoDef.localVotacion);
    base.direccion = str(datoDef.direccion);
    base.centroPoblado = str(datoDef.centroPoblado);
    base.ubigeo = str(datoDef.ubigeo);
    base.pabellon = str(datoDef.pabellon);
    base.piso = str(datoDef.piso);
    base.aula = str(datoDef.aula);
    base.referencia = str(datoDef.referencia);
    base.nombres = str(datoDef.nombres);
    base.apellidos = str(datoDef.apellidos);
    base.cargo = str(datoDef.cargo);
    base.numeroMesa = str(datoDef.mesaSufragio);
  }
  if (datoProv) {
    if (!base.numeroMesa) base.numeroMesa = str(datoProv.mesaSufragio);
    if (!base.ubigeo) base.ubigeo = str(datoProv.ubigeo);
    if (!base.centroPoblado) base.centroPoblado = str(datoProv.centroPoblado);
    if (!base.nombres) base.nombres = str(datoProv.nombres);
    if (!base.apellidos) base.apellidos = str(datoProv.apellidos);
    if (!base.cargo) base.cargo = str(datoProv.cargo);
    base.miembrosMesa = mapearMiembros(datoProv.listaMiembros);
  }
  return base;
}

type FetchResult = { status: number; text: string; error?: string };

/** Playwright proxy config (Chromium no acepta user:pass inline en la URL). */
type ProxyConfig = { server: string; username?: string; password?: string };

/**
 * Parsea PROXY_URL (http://user:pass@host:port o http://host:port).
 * Vacío / ausente → sin proxy (solo válido en desarrollo local).
 */
export function parseProxyUrl(raw: string | undefined): ProxyConfig | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ConsultaError(
      "PROXY_URL inválida. Usa http://user:pass@host:port",
      "DESCONOCIDO",
    );
  }
  if (!url.hostname || !url.port) {
    throw new ConsultaError(
      "PROXY_URL debe incluir host y puerto (ej. http://user:pass@host:12321).",
      "DESCONOCIDO",
    );
  }
  const server = `${url.protocol}//${url.hostname}:${url.port}`;
  const username = url.username ? decodeURIComponent(url.username) : undefined;
  const password = url.password ? decodeURIComponent(url.password) : undefined;
  return {
    server,
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
  };
}

const DNI_INPUT =
  'input[formcontrolname="numeroDocumento"], input[placeholder="Número de DNI"]';
const FORM_WAIT_MS = 90_000;

async function pageDiagnostics(page: Page): Promise<string> {
  const title = await page.title().catch(() => "");
  const href = page.url();
  return `title=${JSON.stringify(title)} url=${JSON.stringify(href)}`;
}

export class OnpeConsultor {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private readonly headless: boolean;
  private readonly proxy: ProxyConfig | null;

  constructor(opts: { headless?: boolean; proxyUrl?: string } = {}) {
    this.headless = opts.headless ?? true;
    this.proxy = parseProxyUrl(
      opts.proxyUrl ?? process.env.PROXY_URL ?? process.env.HTTPS_PROXY,
    );
  }

  private async ensureBrowser(): Promise<BrowserContext> {
    if (!this.browser || !this.browser.isConnected()) {
      const args = ["--disable-blink-features=AutomationControlled"];
      // En contenedor (Docker/Fly) Chromium corre como root y necesita
      // --no-sandbox. Se activa vía env para no tocar el comportamiento local.
      if (process.env.PLAYWRIGHT_NO_SANDBOX === "1") {
        args.push("--no-sandbox", "--disable-setuid-sandbox");
      }
      this.browser = await chromium.launch({
        headless: this.headless,
        args,
        ...(this.proxy ? { proxy: this.proxy } : {}),
      });
      this.context = await this.browser.newContext({
        locale: "es-PE",
        timezoneId: "America/Lima",
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        viewport: { width: 1365, height: 900 },
      });
      if (this.proxy) {
        console.log(`Playwright proxy: ${this.proxy.server}`);
      }
    }
    return this.context!;
  }

  private async abrirPagina(): Promise<Page> {
    const context = await this.ensureBrowser();
    const page = await context.newPage();
    await page.goto(ONPE_URL, { waitUntil: "domcontentloaded", timeout: 90_000 });

    const input = page.locator(DNI_INPUT);
    const deadline = Date.now() + FORM_WAIT_MS;

    // Cloudflare JS challenge: esperar a que desaparezca "Just a moment"
    // o a que aparezca el input de DNI (lo que ocurra primero).
    while (Date.now() < deadline) {
      if (await input.first().isVisible().catch(() => false)) {
        return page;
      }
      const title = await page.title().catch(() => "");
      const stillChallenging = /just a moment|checking|verific|robot|attention required/i.test(
        title,
      );
      if (!stillChallenging) {
        // Título ya no es challenge: dar un poco más por si el Angular monta tarde.
        try {
          await input.first().waitFor({
            state: "visible",
            timeout: Math.min(20_000, Math.max(1_000, deadline - Date.now())),
          });
          return page;
        } catch {
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 1_500));
    }

    const diag = await pageDiagnostics(page);
    const title = await page.title().catch(() => "");
    if (/just a moment|robot|verific|checking|attention required/i.test(title) || title === "") {
      throw new ConsultaError(
        `La ONPE bloqueó el acceso (challenge anti-bot). ${diag}` +
          (this.proxy ? "" : " Sin PROXY_URL (IP datacenter suele fallar en Fly)."),
        "ANTIBOT_BLOQUEO",
      );
    }
    throw new ConsultaError(
      `No se pudo cargar el formulario de la ONPE. ${diag}`,
      "TIMEOUT",
    );
  }

  private async fetchInPage(
    page: Page,
    url: string,
    init: { method: string; body?: string; token?: string | null },
  ): Promise<FetchResult> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (init.token) headers["Authorization"] = `Bearer ${init.token}`;
    const bodyArg = init.body ? `, body: ${JSON.stringify(init.body)}` : "";
    const script = `(async () => {
      try {
        const r = await fetch(${JSON.stringify(url)}, {
          method: ${JSON.stringify(init.method)},
          headers: ${JSON.stringify(headers)}${bodyArg},
        });
        return JSON.stringify({ status: r.status, text: await r.text() });
      } catch (e) {
        return JSON.stringify({ status: 0, text: '', error: String(e && e.message || e) });
      }
    })()`;
    const result = await page.evaluate(script);
    return JSON.parse(result as string) as FetchResult;
  }

  private parseResp<T>(fr: FetchResult): OnpeResp<T> | null {
    if (fr.error) {
      throw new ConsultaError(`Error de red al consultar la ONPE: ${fr.error}`, "RED");
    }
    if (fr.status >= 400) {
      throw new ConsultaError(
        `La ONPE respondió con estado HTTP ${fr.status}.`,
        fr.status === 403 ? "ANTIBOT_BLOQUEO" : "DESCONOCIDO",
      );
    }
    if (fr.text.trim() === "") return null;
    try {
      return JSON.parse(fr.text) as OnpeResp<T>;
    } catch {
      throw new ConsultaError("Respuesta de la ONPE no es JSON válido.", "DESCONOCIDO");
    }
  }

  async consultarDni(input: string): Promise<ConsultaResultado> {
    const parsed = DniSchema.safeParse(input);
    if (!parsed.success) {
      throw new ConsultaError(
        parsed.error.issues[0]?.message ?? "DNI inválido",
        "DNI_INVALIDO",
      );
    }
    const dni = parsed.data;

    const page = await this.abrirPagina();
    try {
      const busquedaFr = await this.fetchInPage(page, EP_BUSQUEDA, {
        method: "POST",
        body: JSON.stringify({ numeroDocumento: dni }),
      });
      const busqueda = this.parseResp<{ token?: string }>(busquedaFr);
      if (!busqueda || busqueda.success !== true) {
        return mapearResultado(dni, busqueda, null, null);
      }
      const token = busqueda.data?.token ?? null;
      if (!token) return mapearResultado(dni, busqueda, null, null);

      const [definitivaFr, provisionalFr] = await Promise.all([
        this.fetchInPage(page, EP_DEFINITIVA, { method: "POST", body: "{}", token }),
        this.fetchInPage(page, EP_PROVISIONAL, { method: "POST", body: "{}", token }),
      ]);
      const definitiva = this.parseResp<DatoDefinitivo>(definitivaFr);
      const provisional = this.parseResp<DatoProvisional>(provisionalFr);
      return mapearResultado(dni, busqueda, definitiva, provisional);
    } finally {
      await page.close().catch(() => {});
    }
  }

  async close(): Promise<void> {
    await this.context?.close().catch(() => {});
    await this.browser?.close().catch(() => {});
    this.browser = null;
    this.context = null;
  }
}

export async function consultarDni(
  dni: string,
  opts: { headless?: boolean; proxyUrl?: string } = {},
): Promise<ConsultaResultado> {
  const consultor = new OnpeConsultor(opts);
  try {
    return await consultor.consultarDni(dni);
  } finally {
    await consultor.close();
  }
}
