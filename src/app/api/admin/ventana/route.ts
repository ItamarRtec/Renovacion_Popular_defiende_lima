import { NextResponse, type NextRequest } from "next/server";
import { requireAdminDbFromRequest } from "@/lib/admin-session";

export async function PATCH(request: NextRequest) {
  try {
    const { supabase } = await requireAdminDbFromRequest(request);
    const body = (await request.json()) as {
      activa?: boolean;
      abre_at?: string | null;
      cierra_at?: string | null;
    };
    const { error } = await supabase
      .from("ventana_acceso")
      .update({
        activa: body.activa,
        abre_at: body.abre_at ?? null,
        cierra_at: body.cierra_at ?? null,
      })
      .eq("id", 1);
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
}
