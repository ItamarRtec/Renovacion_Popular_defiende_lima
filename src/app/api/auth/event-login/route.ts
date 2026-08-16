import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/auth-paths";
import { clientIp } from "@/lib/rate-limit";
import { canLoginWithEmailDni } from "@/lib/roles";
import { verifyTurnstile } from "@/lib/turnstile";

type RequestBody = { email?: string; clave?: string; turnstileToken?: string };

// Throttle por IP contando SOLO fallos reales (no bloquea a quien acierta).
// El control primario anti-automatización es el CAPTCHA (Turnstile).
const IP_FAIL_MAX = 20; // fallos por IP en la ventana
const WINDOW_SECS = 600; // 10 min
const LOCK_SECS = 600; // 10 min de enfriamiento (suave, no 30)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function rejectSlow(status: number, body: Record<string, unknown>) {
  await sleep(600); // retraso fijo ante fallo: frena barridos y evita timing
  return NextResponse.json(body, { status });
}

/**
 * Acceso de personeros y coordinadores: correo (usuario) + clave (= DNI).
 *
 * Defensa:
 *  - CAPTCHA (Turnstile) como control primario anti-automatización.
 *  - Personeros y coordinadores entran siempre. El evento solo acota el QR.
 *  - Throttle por IP CONFIABLE (Vercel) contando SOLO fallos reales.
 *  - Mensaje genérico + retraso ante fallo (no revela si el correo existe).
 *  - Administradores no entran por esta vía (usan /admin1010). La clave nunca se guarda en Auth.
 */
export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const clave = String(body.clave ?? "").trim();
  const ip = clientIp(request);

  // 1) CAPTCHA primero (barato de rechazar, corta la automatización).
  const captchaOk = await verifyTurnstile(body.turnstileToken, ip);
  if (!captchaOk) {
    return NextResponse.json(
      { error: "Verificación anti-robot fallida. Recarga e inténtalo de nuevo." },
      { status: 403 },
    );
  }

  if (email.includes("%") || email.includes("_") || email.includes("\\")) {
    return rejectSlow(401, { error: "Correo o clave incorrectos." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Ingresa el correo con el que te registraste." },
      { status: 400 },
    );
  }
  if (!/^\d{8}$/.test(clave)) {
    return rejectSlow(401, { error: "Correo o clave incorrectos." });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Acceso no configurado." },
      { status: 500 },
    );
  }

  // 2) ¿La IP está en enfriamiento por fallos previos? (consulta sin incrementar)
  const { data: bloqueada } = await admin.rpc("rate_limit_state", {
    p_clave: `ip:${ip}`,
  });
  if (bloqueada === true) {
    return rejectSlow(429, {
      error: "Demasiados intentos fallidos desde tu red. Espera unos minutos.",
    });
  }

  async function contarFallo() {
    // Cuenta el fallo SOLO por IP (nunca por correo → sin lockout dirigido).
    await admin!.rpc("rate_limit_hit", {
      p_clave: `ip:${ip}`,
      p_max: IP_FAIL_MAX,
      p_ventana_secs: WINDOW_SECS,
      p_lock_secs: LOCK_SECS,
    });
  }

  try {
    const { data: reg, error: regError } = await admin
      .from("registros")
      .select("id, email, dni, plataforma_rol")
      .eq("email", email)
      .maybeSingle();

    if (regError) {
      console.error(regError);
      return NextResponse.json(
        { error: "No pudimos validar el acceso. Intenta de nuevo." },
        { status: 500 },
      );
    }

    // Credencial incorrecta: cuenta el fallo (por IP) y responde genérico.
    if (!reg || reg.dni !== clave) {
      await contarFallo();
      return rejectSlow(401, { error: "Correo o clave incorrectos." });
    }

    if (!canLoginWithEmailDni(reg.plataforma_rol)) {
      await contarFallo();
      return rejectSlow(401, { error: "Correo o clave incorrectos." });
    }

    // Éxito: NO se incrementa el contador (quien acierta no se penaliza).
    const { error: createError } = await admin.auth.admin.createUser({
      email: reg.email,
      email_confirm: true,
      password: crypto.randomUUID() + crypto.randomUUID(),
    });
    if (createError && !/already/i.test(createError.message)) {
      console.error(createError);
    }

    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: reg.email,
      });
    const tokenHash = linkData?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      console.error(linkError);
      return NextResponse.json(
        { error: "No pudimos iniciar sesión. Intenta de nuevo." },
        { status: 500 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (verifyError) {
      console.error(verifyError);
      return NextResponse.json(
        { error: "No pudimos iniciar sesión. Intenta de nuevo." },
        { status: 500 },
      );
    }

    const { data: linked } = await supabase.rpc("link_registro_user");
    const rol = linked?.plataforma_rol ?? "personero";

    return NextResponse.json({ ok: true, redirect: homePathForRole(rol) });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "No pudimos validar el acceso. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
