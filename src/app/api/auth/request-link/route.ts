import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type RequestBody = {
  dni?: string;
  email?: string;
};

/**
 * Acceso seguro por magic-link (OTP) — administradores y coordinadores.
 *
 * Verifica en el servidor (service role) que DNI+email coinciden con una
 * inscripción y prepara la cuenta. Respuesta siempre genérica. El cliente
 * luego llama signInWithOtp({ shouldCreateUser: false }).
 *
 * Los personeros usan /api/auth/event-login (correo + DNI). Esta vía OTP
 * también funciona para personeros como respaldo.
 */
export async function POST(request: Request) {
  // Anti-abuso best-effort por IP (ver nota en lib/rate-limit).
  const ip = clientIp(request);
  const limited = rateLimit(`request-link:${ip}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento e inténtalo de nuevo." },
      { status: 429 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const dni = String(body.dni ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!/^\d{8}$/.test(dni)) {
    return NextResponse.json(
      { error: "Ingresa un DNI válido de 8 dígitos." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Ingresa el email con el que te registraste." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    // La verificación de inscripción requiere leer `registros` (sin acceso
    // anon), lo que exige la service role en el servidor.
    return NextResponse.json(
      {
        error:
          "Acceso no configurado. Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.",
      },
      { status: 500 },
    );
  }

  try {
    // ¿Existe una inscripción con este DNI y email? (lectura privilegiada)
    const { data: match, error: matchError } = await admin
      .from("registros")
      .select("id")
      .eq("dni", dni)
      .eq("email", email) // exact; email en minúsculas. Evita comodines de LIKE.
      .maybeSingle();

    if (matchError) {
      console.error(matchError);
      return NextResponse.json(
        { error: "No pudimos procesar el acceso. Intenta de nuevo." },
        { status: 500 },
      );
    }

    // Solo si coincide, garantizamos la cuenta de auth (sin filtrar el
    // resultado al cliente). Si no coincide, no creamos nada: el
    // signInWithOtp del cliente con shouldCreateUser:false no enviará enlace.
    if (match) {
      const { error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        password: crypto.randomUUID() + crypto.randomUUID(),
      });
      // "already registered" es el caso normal (cuenta ya existente).
      if (createError && !/already/i.test(createError.message)) {
        console.error(createError);
      }
    }

    // Respuesta genérica siempre: no revela si el par DNI+email existe.
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "No pudimos procesar el acceso. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
