import { NextResponse, type NextRequest } from "next/server";
import { requireAdminDbFromRequest } from "@/lib/admin-session";
import {
  isCoordinadorDistrital,
  isCoordinadorLocal,
} from "@/lib/roles";

export async function PATCH(request: NextRequest) {
  try {
    const { supabase } = await requireAdminDbFromRequest(request);
    const body = (await request.json()) as {
      registroId?: string;
      personeroId?: string;
      coordinadorId?: string | null;
    };
    const registroId = body.registroId || body.personeroId;
    if (!registroId) {
      return NextResponse.json({ error: "Falta el registro." }, { status: 400 });
    }

    const superiorId = body.coordinadorId || null;
    if (superiorId === registroId) {
      return NextResponse.json(
        { error: "No puedes asignar a la misma persona." },
        { status: 400 },
      );
    }

    const { data: target, error: targetError } = await supabase
      .from("registros")
      .select("id, plataforma_rol")
      .eq("id", registroId)
      .maybeSingle();

    if (targetError || !target) {
      return NextResponse.json({ error: "Registro no encontrado." }, { status: 404 });
    }

    if (superiorId) {
      const { data: superior, error: superiorError } = await supabase
        .from("registros")
        .select("id, plataforma_rol")
        .eq("id", superiorId)
        .maybeSingle();

      if (superiorError || !superior) {
        return NextResponse.json(
          { error: "Superior no encontrado." },
          { status: 404 },
        );
      }

      if (
        target.plataforma_rol === "personero" &&
        !isCoordinadorLocal(superior.plataforma_rol)
      ) {
        return NextResponse.json(
          { error: "Un personero solo puede reportar a un coordinador de local." },
          { status: 400 },
        );
      }

      if (
        isCoordinadorLocal(target.plataforma_rol) &&
        !isCoordinadorDistrital(superior.plataforma_rol)
      ) {
        return NextResponse.json(
          { error: "Un coordinador de local solo reporta a un coordinador de distrito." },
          { status: 400 },
        );
      }

      if (isCoordinadorDistrital(target.plataforma_rol)) {
        return NextResponse.json(
          { error: "El coordinador de distrito reporta al centro de control." },
          { status: 400 },
        );
      }
    }

    const { error } = await supabase
      .from("registros")
      .update({
        coordinador_id: superiorId,
      })
      .eq("id", registroId);
    if (error) {
      console.error(error);
      return NextResponse.json({ error: "No se pudo asignar." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
}
