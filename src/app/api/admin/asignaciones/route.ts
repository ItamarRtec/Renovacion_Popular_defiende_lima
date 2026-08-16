import { NextResponse, type NextRequest } from "next/server";
import { requireAdminDbFromRequest } from "@/lib/admin-session";

export async function PATCH(request: NextRequest) {
  try {
    const { supabase } = await requireAdminDbFromRequest(request);
    const body = (await request.json()) as {
      personeroId?: string;
      coordinadorId?: string | null;
    };
    if (!body.personeroId) {
      return NextResponse.json({ error: "Falta personero." }, { status: 400 });
    }
    const { error } = await supabase
      .from("registros")
      .update({
        coordinador_id: body.coordinadorId || null,
      })
      .eq("id", body.personeroId);
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "No se pudo asignar." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
}
