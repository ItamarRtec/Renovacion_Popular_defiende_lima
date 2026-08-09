import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // Defensa CSRF: solo aceptar el POST desde el propio origen.
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  if (origin && origin !== url.origin) {
    return NextResponse.json({ error: "origen no permitido" }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/entrar", request.url), {
    status: 303,
  });
}
