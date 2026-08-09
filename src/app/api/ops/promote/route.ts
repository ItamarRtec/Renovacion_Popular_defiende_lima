import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlataformaRol } from "@/lib/supabase/database.types";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type RequestBody = {
  secret?: string;
  dni?: string;
  rol?: string;
};

const ROLES: readonly PlataformaRol[] = [
  "personero",
  "coordinador",
  "administrador",
];

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still run a compare to avoid leaking length via timing on equal-size only.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Promoción secreta de roles (bootstrap / ops).
 * Requiere ADMIN_PROMOTE_SECRET + SUPABASE_SERVICE_ROLE_KEY.
 * No enlazar desde la UI pública.
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

  const dni = String(body.dni ?? "").trim();
  const rol = String(body.rol ?? "").trim() as PlataformaRol;

  if (!/^\d{8}$/.test(dni)) {
    return NextResponse.json(
      { error: "Ingresa un DNI válido de 8 dígitos." },
      { status: 400 },
    );
  }

  if (!ROLES.includes(rol)) {
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
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

  const { data: row, error: findError } = await admin
    .from("registros")
    .select("id, nombres, apellidos, dni, plataforma_rol")
    .eq("dni", dni)
    .maybeSingle();

  if (findError) {
    console.error(findError);
    return NextResponse.json(
      { error: "No se pudo buscar el registro." },
      { status: 500 },
    );
  }

  if (!row) {
    return NextResponse.json(
      { error: "No hay inscripción con ese DNI." },
      { status: 404 },
    );
  }

  if (row.plataforma_rol === rol) {
    return NextResponse.json({
      ok: true,
      registro: {
        id: row.id,
        nombres: row.nombres,
        apellidos: row.apellidos,
        dni: row.dni,
        plataforma_rol: row.plataforma_rol,
      },
      message: "El rol ya estaba asignado.",
    });
  }

  const { data: updated, error: updateError } = await admin
    .from("registros")
    .update({ plataforma_rol: rol })
    .eq("id", row.id)
    .select("id, nombres, apellidos, dni, plataforma_rol")
    .single();

  if (updateError || !updated) {
    console.error(updateError);
    return NextResponse.json(
      { error: "No se pudo actualizar el rol." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    registro: updated,
    message: `Rol actualizado a ${rol}.`,
  });
}
