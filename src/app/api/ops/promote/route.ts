import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  labelRol,
  normalizeRolPromocion,
  ROLES_PROMOCION,
} from "@/lib/roles";
import type { PlataformaRol } from "@/lib/supabase/database.types";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type FilaBody = { dni?: string; rol?: string | null };
type RequestBody = {
  secret?: string;
  dni?: string;
  rol?: string;
  filas?: FilaBody[];
};

type PromoteRow = {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  plataforma_rol: PlataformaRol;
};

type FilaResultado = {
  dni: string;
  ok: boolean;
  message: string;
  registro?: PromoteRow;
};

const MAX_FILAS = 400;

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

function resolveRol(
  raw: string | null | undefined,
  fallback: PlataformaRol | null,
): PlataformaRol | null {
  const fromRaw = normalizeRolPromocion(raw ?? "");
  if (fromRaw) return fromRaw;
  if (raw?.trim()) return null;
  return fallback;
}

async function promoteOne(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  dni: string,
  rol: PlataformaRol,
): Promise<FilaResultado> {
  const { data: row, error: findError } = await admin
    .from("registros")
    .select("id, nombres, apellidos, dni, plataforma_rol")
    .eq("dni", dni)
    .maybeSingle();

  if (findError) {
    console.error(findError);
    return { dni, ok: false, message: "No se pudo buscar el registro." };
  }

  if (!row) {
    return { dni, ok: false, message: "No hay inscripción con ese DNI." };
  }

  if (row.plataforma_rol === rol || (rol === "coordinador_local" && row.plataforma_rol === "coordinador")) {
    return {
      dni,
      ok: true,
      message: "El rol ya estaba asignado.",
      registro: row,
    };
  }

  const rolesAProbar: PlataformaRol[] =
    rol === "coordinador_local" ? ["coordinador_local", "coordinador"] : [rol];

  let updated: PromoteRow | null = null;
  let updateError: { code?: string; message?: string } | null = null;
  for (const valor of rolesAProbar) {
    const result = await admin
      .from("registros")
      .update({ plataforma_rol: valor })
      .eq("id", row.id)
      .select("id, nombres, apellidos, dni, plataforma_rol")
      .single();
    if (!result.error && result.data) {
      updated = result.data;
      updateError = null;
      break;
    }
    updateError = result.error;
  }

  if (updateError || !updated) {
    console.error(updateError);
    const enumFaltante =
      updateError?.code === "22P02" ||
      /coordinador_local|coordinador_distrital/.test(updateError?.message ?? "");
    return {
      dni,
      ok: false,
      message: enumFaltante
        ? "La base aún no tiene el rol. Corre en Supabase: alter type plataforma_rol add value 'coordinador_local';"
        : "No se pudo actualizar el rol.",
    };
  }

  return {
    dni,
    ok: true,
    message: `Rol actualizado a ${labelRol(rol)}.`,
    registro: updated,
  };
}

/**
 * Promoción secreta de roles (uno o lote CSV).
 * Requiere ADMIN_PROMOTE_SECRET + SUPABASE_SERVICE_ROLE_KEY.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit(`ops-promote:${ip}`, 8, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento." },
      { status: 429 },
    );
  }

  const expectedSecret = process.env.ADMIN_PROMOTE_SECRET?.trim() ?? "";
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "Promoción no configurada. Falta ADMIN_PROMOTE_SECRET." },
      { status: 503 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const secret = String(body.secret ?? "");
  if (!secretsMatch(secret, expectedSecret)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const fallbackRol = resolveRol(body.rol, null);
  const filasIn = Array.isArray(body.filas)
    ? body.filas
    : body.dni
      ? [{ dni: body.dni, rol: body.rol }]
      : [];

  if (filasIn.length === 0) {
    return NextResponse.json({ error: "Falta el DNI o el CSV." }, { status: 400 });
  }
  if (filasIn.length > MAX_FILAS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_FILAS} filas por carga.` },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Promoción no configurada. Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.",
      },
      { status: 503 },
    );
  }

  const resultados: FilaResultado[] = [];
  for (const fila of filasIn) {
    const dni = String(fila.dni ?? "").replace(/\D/g, "");
    if (!/^\d{8}$/.test(dni)) {
      resultados.push({
        dni: dni || String(fila.dni ?? ""),
        ok: false,
        message: "DNI inválido (8 dígitos).",
      });
      continue;
    }
    const rol = resolveRol(fila.rol, fallbackRol);
    if (!rol || !ROLES_PROMOCION.includes(rol)) {
      resultados.push({
        dni,
        ok: false,
        message: "Rol inválido.",
      });
      continue;
    }
    resultados.push(await promoteOne(admin, dni, rol));
  }

  const okCount = resultados.filter((r) => r.ok).length;
  const failCount = resultados.length - okCount;
  const primero = resultados[0];

  if (filasIn.length === 1 && primero) {
    if (!primero.ok) {
      const status = primero.message.includes("inscripción") ? 404 : 400;
      return NextResponse.json({ error: primero.message }, { status });
    }
    return NextResponse.json({
      ok: true,
      registro: primero.registro,
      message: primero.message,
    });
  }

  return NextResponse.json({
    ok: failCount === 0,
    message: `${okCount} actualizados · ${failCount} con error.`,
    resultados,
  });
}
