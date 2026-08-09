import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import type { RegistroOrigen } from "@/lib/supabase/database.types";

type RequestBody = {
  nombres?: string;
  apellidos?: string;
  dni?: string;
  telefono?: string;
  email?: string;
  region?: string;
  provincia?: string;
  distrito?: string;
  afiliado_rp?: boolean | null;
  experiencia_personero?: boolean;
  centro_votacion?: string;
  numero_mesa?: string;
  origen?: string;
  consentimiento?: boolean;
  turnstileToken?: string;
};

const ORIGENES: readonly RegistroOrigen[] = ["defiende_lima", "renovacion_popular"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (v: unknown) => String(v ?? "").trim();

/**
 * Alta de inscripción (server-side). Verifica CAPTCHA, valida, aplica
 * rate-limit e inserta con service role. Responde SIEMPRE genérico ante
 * duplicado (no revela quién ya está inscrito → sin oráculo de afiliación).
 */
export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const ip = clientIp(request);

  // 1) CAPTCHA (si está configurado; si no, se omite en dev).
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json(
      { error: "Verificación anti-robot fallida. Recarga e inténtalo de nuevo." },
      { status: 403 },
    );
  }

  // 2) Validación (autoritativa en el servidor).
  const nombres = clean(body.nombres);
  const apellidos = clean(body.apellidos);
  const dni = clean(body.dni);
  const telefono = clean(body.telefono).replace(/\D/g, "");
  const email = clean(body.email).toLowerCase();
  const region = clean(body.region);
  const provincia = clean(body.provincia);
  const distrito = clean(body.distrito);
  const centro_votacion = clean(body.centro_votacion);
  const numero_mesa = clean(body.numero_mesa);
  const origen = clean(body.origen) as RegistroOrigen;

  const errors: Record<string, string> = {};
  if (nombres.length < 2) errors.nombres = "Ingresa tus nombres.";
  if (apellidos.length < 2) errors.apellidos = "Ingresa tus apellidos.";
  if (!/^\d{8}$/.test(dni)) errors.dni = "El DNI debe tener 8 dígitos.";
  if (telefono.length < 9) errors.telefono = "Ingresa un celular válido.";
  if (!EMAIL_RE.test(email)) errors.email = "Ingresa un correo válido.";
  if (region.length < 2) errors.region = "Selecciona tu región.";
  if (provincia.length < 2) errors.provincia = "Selecciona tu provincia.";
  if (distrito.length < 2) errors.distrito = "Selecciona tu distrito.";
  if (typeof body.experiencia_personero !== "boolean")
    errors.experiencia_personero = "Indica tu experiencia como personero.";
  if (!ORIGENES.includes(origen)) errors.origen = "Origen inválido.";
  if (origen === "renovacion_popular" && typeof body.afiliado_rp !== "boolean")
    errors.afiliado_rp = "Indica si eres afiliado a Renovación Popular.";
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
      { error: "El registro no está configurado. Falta SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  // 3) Anti-abuso por IP (Turnstile es el control primario).
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

  // 4) Insertar solo columnas seguras (nunca plataforma_rol/estado/user_id/…).
  const { error: insertError } = await admin.from("registros").insert({
    rol: "personero",
    nombres,
    apellidos,
    dni,
    telefono,
    email,
    region,
    provincia,
    distrito,
    afiliado_rp:
      origen === "renovacion_popular" ? Boolean(body.afiliado_rp) : null,
    experiencia_personero: Boolean(body.experiencia_personero),
    centro_votacion: centro_votacion || null,
    numero_mesa: numero_mesa || null,
    origen,
  });

  if (insertError) {
    // Duplicado (DNI o email): respuesta GENÉRICA, sin revelar afiliación.
    if (insertError.code === "23505") {
      return NextResponse.json({ ok: true });
    }
    console.error(insertError);
    return NextResponse.json(
      { error: "No pudimos guardar tu inscripción. Intenta de nuevo." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
