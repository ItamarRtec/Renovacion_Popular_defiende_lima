import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { consultarMesaPorDni } from "@/lib/onpe-consulta";
import { clientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import type {
  RegistroOrigen,
  RolMesa,
} from "@/lib/supabase/database.types";

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

/** Normaliza mesa ONPE (espacios / ceros a la izquierda) para comparar. */
function normalizeNumeroMesa(raw: string | null | undefined): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) return t.padStart(6, "0");
  return t;
}

/** Variantes de mesa para encontrar filas ya guardadas sin pad uniforme. */
function numeroMesaVariants(numeroMesa: string): string[] {
  const variants = new Set<string>([numeroMesa]);
  if (/^\d+$/.test(numeroMesa)) {
    const stripped = numeroMesa.replace(/^0+/, "") || "0";
    variants.add(stripped);
    variants.add(stripped.padStart(6, "0"));
  }
  return [...variants];
}

/**
 * Alta de inscripción (server-side).
 * Tras validar, consulta el robot ONPE con el DNI para rellenar mesa/ubigeo
 * (si ONPE_CONSULTA_URL está configurada). Soft-fail si el robot no responde.
 * Si la mesa ONPE ya tiene un personero del mismo origen, el alta queda como suplente.
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

  const { data: dniExistente, error: dniLookupError } = await admin
    .from("registros")
    .select("id")
    .eq("dni", dni)
    .maybeSingle();

  if (dniLookupError) {
    console.error(dniLookupError);
    return NextResponse.json(
      { error: "No pudimos validar tu DNI. Intenta de nuevo." },
      { status: 500 },
    );
  }

  if (dniExistente) {
    return NextResponse.json(
      { error: "El DNI está registrado.", errors: { dni: "El DNI está registrado." } },
      { status: 409 },
    );
  }

  // Consulta ONPE (robot). Si falla o no está configurado, seguimos con nulls.
  const mesa = await consultarMesaPorDni(dni);
  const numeroMesa = normalizeNumeroMesa(mesa?.numero_mesa);

  let rolMesa: RolMesa = "titular";
  if (numeroMesa) {
    // Cualquier personero previo con la misma mesa (mismo origen) → suplente.
    const { data: ocupantes, error: mesaLookupError } = await admin
      .from("registros")
      .select("id")
      .eq("origen", origen)
      .in("numero_mesa", numeroMesaVariants(numeroMesa))
      .limit(1);

    if (mesaLookupError) {
      console.error("mesa ocupada lookup", mesaLookupError);
      return NextResponse.json(
        { error: "No pudimos validar su mesa. Intenta de nuevo." },
        { status: 500 },
      );
    }

    if (ocupantes && ocupantes.length > 0) {
      rolMesa = "suplente";
      console.info("registro suplente", { dni, numeroMesa, origen });
    }
  }

  const { data: inserted, error: insertError } = await admin
    .from("registros")
    .insert({
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
      numero_mesa: numeroMesa,
      rol_mesa: rolMesa,
      origen,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const detail = `${insertError.message} ${insertError.details ?? ""}`.toLowerCase();
      if (detail.includes("dni")) {
        return NextResponse.json(
          {
            error: "El DNI está registrado.",
            errors: { dni: "El DNI está registrado." },
          },
          { status: 409 },
        );
      }
      if (detail.includes("email")) {
        return NextResponse.json(
          {
            error: "Este correo ya está registrado.",
            errors: { email: "Este correo ya está registrado." },
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Ya existe una inscripción con estos datos." },
        { status: 409 },
      );
    }
    console.error(insertError);
    return NextResponse.json(
      { error: "No pudimos guardar tu inscripción. Intenta de nuevo." },
      { status: 500 },
    );
  }

  // Carrera: si dos titulares entraron a la vez, el más antiguo se queda;
  // demotamos solo la fila recién creada.
  if (rolMesa === "titular" && numeroMesa && inserted?.id) {
    const { data: titulares } = await admin
      .from("registros")
      .select("id")
      .eq("origen", origen)
      .in("numero_mesa", numeroMesaVariants(numeroMesa))
      .eq("rol_mesa", "titular")
      .order("created_at", { ascending: true });

    const primero = titulares?.[0]?.id;
    if (primero && primero !== inserted.id) {
      const { error: demoteError } = await admin
        .from("registros")
        .update({ rol_mesa: "suplente" })
        .eq("id", inserted.id);
      if (demoteError) {
        console.error(demoteError);
      } else {
        rolMesa = "suplente";
      }
    }
  }

  return NextResponse.json({
    ok: true,
    rol_mesa: rolMesa,
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
