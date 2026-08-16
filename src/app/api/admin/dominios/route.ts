import { NextResponse, type NextRequest } from "next/server";
import { requireAdminDbFromRequest } from "@/lib/admin-session";
import type { RegistroOrigen } from "@/lib/supabase/database.types";

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdminDbFromRequest(request);
    const body = (await request.json()) as {
      dominio?: string;
      origen?: RegistroOrigen;
      notas?: string | null;
    };
    const { error } = await supabase.from("dominios_acceso").insert({
      dominio: String(body.dominio ?? "").trim().toLowerCase(),
      origen: body.origen ?? "renovacion_popular",
      notas: body.notas ?? null,
      activo: true,
    });
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Ese dominio ya está registrado." },
          { status: 409 },
        );
      }
      console.error(error);
      return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase } = await requireAdminDbFromRequest(request);
    const body = (await request.json()) as {
      id?: string;
      activo?: boolean;
      origen?: RegistroOrigen;
    };
    if (!body.id) {
      return NextResponse.json({ error: "Falta id." }, { status: 400 });
    }
    const patch: { activo?: boolean; origen?: RegistroOrigen } = {};
    if (typeof body.activo === "boolean") patch.activo = body.activo;
    if (body.origen) patch.origen = body.origen;
    const { error } = await supabase
      .from("dominios_acceso")
      .update(patch)
      .eq("id", body.id);
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase } = await requireAdminDbFromRequest(request);
    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "Falta id." }, { status: 400 });
    }
    const { error } = await supabase
      .from("dominios_acceso")
      .delete()
      .eq("id", body.id);
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
}
