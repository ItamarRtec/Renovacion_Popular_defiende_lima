import { NextResponse, type NextRequest } from "next/server";
import { requireAdminDbFromRequest } from "@/lib/admin-session";

export async function PATCH(request: NextRequest) {
  try {
    const { supabase } = await requireAdminDbFromRequest(request);
    const body = (await request.json()) as { activo?: boolean };
    if (typeof body.activo !== "boolean") {
      return NextResponse.json({ error: "Falta activo." }, { status: 400 });
    }
    const { error } = await supabase.from("plataforma_flags").upsert({
      id: 1,
      dia_d: body.activo,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "No se pudo actualizar." },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
}
