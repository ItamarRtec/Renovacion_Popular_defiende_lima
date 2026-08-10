import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { consultarMesaPorDni } from "@/lib/onpe-consulta";
import { clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import type { RegistroOrigen } from "@/lib/supabase/database.types";

export const maxDuration = 60;

type RequestBody = {
  nombres?: string;
  apellidos?: string;
  dni?: string;
  telefono?: string;
  email?: string;
  origen?: string;
  consentimiento?: boolean;
  turnstileToken?: string;
};

const ORIGENES: readonly RegistroOrigen[] = [
  "defiende_lima",
  "renovacion_popular",
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (v: unknown) => String(v ?? "").trim();

/**
 * Alta de inscripción (server-side).
 * Tras validar, consulta el robot ONPE con el DNI para rellenar mesa/ubigeo
 * (si ONPE_CONSULTA_URL está configurada). Soft-fail si el robot no responde.
 */
export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const ip = clientIp(request);

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json(
      {
        error:
          "Verificación anti-robot fallida. Recarga e inténtalo de nuevo.",
      },
      { status: 403 },
    );
  }

  const nombres = clean(body.nombres);
  const apellidos = clean(body.apellidos);
  const dni = clean(body.dni);
  const telefono = clean(body.telefono).replace(/\D/g, "");
  const email = clean(body.email).toLowerCase();
  const origen = clean(body.origen) as RegistroOrigen;

  const errors: Record<string, string> = {};
  if (nombres.length < 2) errors.nombres = "Ingresa tus nombres.";
  if (apellidos.length < 2) errors.apellidos = "Ingresa tus apellidos.";
  if (!/^\d{8}$/.test(dni)) errors.dni = "El DNI debe tener 8 dígitos.";
  if (telefono.length < 9) errors.telefono = "Ingresa un celular válido.";
  if (!EMAIL_RE.test(email)) errors.email = "Ingresa un correo válido.";
  if (!ORIGENES.includes(origen)) errors.origen = "Origen inválido.";
  if (body.consentimiento !== true)
    errors.consentimiento = "Debes aceptar el tratamiento de tus datos.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Revisa los datos del formulario.", errors },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "El registro no está configurado. Falta SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const { data: permitido } = await admin.rpc("rate_limit_hit", {
    p_clave: `reg:${ip}`,
    p_max: 60,
    p_ventana_secs: 3600,
    p_lock_secs: 900,
  });
  if (permitido === false) {
    return NextResponse.json(
      { error: "Demasiados envíos desde tu red. Espera unos minutos." },
      { status: 429 },
    );
  }

  // Consulta ONPE (robot). Si falla o no está configurado, seguimos con nulls.
  const mesa = await consultarMesaPorDni(dni);

  const { error: insertError } = await admin.from("registros").insert({
    rol: "personero",
    nombres,
    apellidos,
    dni,
    telefono,
    email,
    region: mesa?.region ?? null,
    provincia: mesa?.provincia ?? null,
    distrito: mesa?.distrito ?? null,
    afiliado_rp: null,
    experiencia_personero: false,
    centro_votacion: mesa?.centro_votacion ?? null,
    numero_mesa: mesa?.numero_mesa ?? null,
    origen,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true });
    }
    console.error(insertError);
    return NextResponse.json(
      { error: "No pudimos guardar tu inscripción. Intenta de nuevo." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    mesa: mesa
      ? {
          numero_mesa: mesa.numero_mesa,
          centro_votacion: mesa.centro_votacion,
          region: mesa.region,
          provincia: mesa.provincia,
          distrito: mesa.distrito,
        }
      : null,
  });
}
