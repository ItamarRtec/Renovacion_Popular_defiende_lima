import { NextResponse, type NextRequest } from "next/server";
import { requireAdminDbFromRequest } from "@/lib/admin-session";
import type { EventoTipo } from "@/lib/supabase/database.types";

function parseTipo(raw: unknown): EventoTipo | null {
  return raw === "ensayo" || raw === "eleccion" ? raw : null;
}

function parseIso(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return null;
  if (typeof raw !== "string") return undefined;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdminDbFromRequest(request);
    const body = (await request.json()) as {
      nombre?: string;
      tipo?: string;
      abre_at?: string | null;
      cierra_at?: string | null;
      activo?: boolean;
    };

    const nombre = String(body.nombre ?? "").trim();
    const tipo = parseTipo(body.tipo) ?? "ensayo";
    const abre_at = parseIso(body.abre_at);
    const cierra_at = parseIso(body.cierra_at);

    if (nombre.length < 2 || nombre.length > 80) {
      return NextResponse.json(
        { error: "El nombre debe tener entre 2 y 80 caracteres." },
        { status: 400 },
      );
    }
    if (abre_at === undefined || cierra_at === undefined) {
      return NextResponse.json(
        { error: "Fechas inválidas." },
        { status: 400 },
      );
    }
    if (abre_at && cierra_at && new Date(abre_at) >= new Date(cierra_at)) {
      return NextResponse.json(
        { error: "La hora de cierre debe ser posterior a la de apertura." },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("eventos").insert({
      nombre,
      tipo,
      abre_at: abre_at ?? null,
      cierra_at: cierra_at ?? null,
      activo: body.activo !== false,
    });
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "No se pudo crear el evento." }, { status: 500 });
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
      abre_at?: string | null;
      cierra_at?: string | null;
    };
    if (!body.id) {
      return NextResponse.json({ error: "Falta id." }, { status: 400 });
    }

    const patch: {
      activo?: boolean;
      abre_at?: string | null;
      cierra_at?: string | null;
    } = {};
    if (typeof body.activo === "boolean") patch.activo = body.activo;
    if (body.abre_at !== undefined) {
      const abre = parseIso(body.abre_at);
      if (abre === undefined) {
        return NextResponse.json({ error: "Fecha de apertura inválida." }, { status: 400 });
      }
      patch.abre_at = abre;
    }
    if (body.cierra_at !== undefined) {
      const cierra = parseIso(body.cierra_at);
      if (cierra === undefined) {
        return NextResponse.json({ error: "Fecha de cierre inválida." }, { status: 400 });
      }
      patch.cierra_at = cierra;
    }

    const { error } = await supabase.from("eventos").update(patch).eq("id", body.id);
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

    const { count } = await supabase
      .from("asistencias")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", body.id);

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: "Este evento ya tiene check-ins. Desactívalo en vez de borrarlo." },
        { status: 409 },
      );
    }

    const { error } = await supabase.from("eventos").delete().eq("id", body.id);
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
}
