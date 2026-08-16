import { NextResponse, type NextRequest } from "next/server";
import { verifyCheckInToken } from "@/lib/checkin-token";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CheckInBody = {
  token?: string;
  registroId?: string;
  metodo?: "qr" | "manual";
};

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limited = rateLimit(`asistencia-checkin:${ip}`, 40, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento." },
      { status: 429 },
    );
  }

  let body: CheckInBody;
  try {
    body = (await request.json()) as CheckInBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const metodo = body.metodo === "manual" ? "manual" : "qr";
  let registroId = body.registroId?.trim() || "";

  if (metodo === "qr") {
    const token = body.token?.trim() ?? "";
    if (!token) {
      return NextResponse.json({ error: "Falta el QR." }, { status: 400 });
    }
    const verified = verifyCheckInToken(token);
    if (!verified) {
      return NextResponse.json(
        { error: "QR inválido o vencido. Pide al personero que lo regenere." },
        { status: 400 },
      );
    }
    registroId = verified.registroId;
  } else if (!registroId) {
    return NextResponse.json(
      { error: "Falta el personero (DNI / id)." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("registrar_asistencia", {
    p_registro_id: registroId,
    p_metodo: metodo,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("fuera de tu alcance")) {
      return NextResponse.json(
        { error: "Este personero no está en tu territorio." },
        { status: 403 },
      );
    }
    if (msg.includes("solo coordinadores")) {
      return NextResponse.json(
        { error: "Solo coordinadores pueden registrar asistencia." },
        { status: 403 },
      );
    }
    if (msg.includes("no es personero")) {
      return NextResponse.json(
        { error: "El código no corresponde a un personero." },
        { status: 400 },
      );
    }
    if (msg.includes("no hay evento activo")) {
      return NextResponse.json(
        { error: "No hay un evento abierto. Pide al admin que cree un ensayo." },
        { status: 403 },
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo registrar la asistencia." },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
