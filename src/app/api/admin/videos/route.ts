import { NextResponse, type NextRequest } from "next/server";
import { requireAdminDbFromRequest } from "@/lib/admin-session";

/** CRUD videos — sesión cookie admin. */
export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdminDbFromRequest(request);
    const body = (await request.json()) as {
      titulo?: string;
      descripcion?: string;
      url?: string;
      orden?: number;
    };
    const { error } = await supabase.from("videos").insert({
      titulo: String(body.titulo ?? "").trim(),
      descripcion: String(body.descripcion ?? "").trim(),
      url: String(body.url ?? "").trim(),
      orden: Number(body.orden ?? 0),
      activo: true,
    });
    if (error) {
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
    const body = (await request.json()) as { id?: string; activo?: boolean };
    if (!body.id) {
      return NextResponse.json({ error: "Falta id." }, { status: 400 });
    }
    const { error } = await supabase
      .from("videos")
      .update({ activo: Boolean(body.activo) })
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
    const { error } = await supabase.from("videos").delete().eq("id", body.id);
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
}
