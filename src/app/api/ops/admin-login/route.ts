import { NextResponse } from "next/server";
import {
  adminSessionCookieOptions,
  authenticateAdministrador,
  createAdminSessionToken,
} from "@/lib/admin-session";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type Body = { user?: string; password?: string };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Login al panel admin (/admin1010) contra tabla public.administradores.
 * Primera vez: si la tabla está vacía, crea el admin desde ADMIN_GATE_* env.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit(`admin-gate:${ip}`, 12, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento." },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const user = String(body.user ?? "");
  const password = String(body.password ?? "");

  try {
    const session = await authenticateAdministrador(user, password);
    if (!session) {
      await sleep(700);
      return NextResponse.json(
        { error: "Credenciales incorrectas." },
        { status: 401 },
      );
    }

    const token = createAdminSessionToken(session);
    const response = NextResponse.json({ ok: true, redirect: "/admin" });
    const cookie = adminSessionCookieOptions(token);
    response.cookies.set(cookie);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "BOOTSTRAP_ENV_MISSING") {
      return NextResponse.json(
        {
          error:
            "No hay administradores. Configura ADMIN_GATE_USER y ADMIN_GATE_PASSWORD en .env.local.",
        },
        { status: 503 },
      );
    }
    console.error(err);
    return NextResponse.json(
      {
        error:
          "No se pudo iniciar sesión. ¿Aplicaste la migración administradores?",
      },
      { status: 500 },
    );
  }
}
