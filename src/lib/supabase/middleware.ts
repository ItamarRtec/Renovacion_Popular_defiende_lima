import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isAdminHostAllowed,
  isAdminSurfacePath,
} from "@/lib/admin-access";
import { isStaffRole } from "@/lib/roles";
import {
  ADMIN_SESSION_COOKIE,
  parseAdminSessionToken,
} from "@/lib/admin-session";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const path = request.nextUrl.pathname;
  const adminAllowed = isAdminHostAllowed(request);

  // Admin + ops: fuera de hosts permitidos → 404 HTML (no archivo vacío).
  if (isAdminSurfacePath(path) && !adminAllowed) {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const isAdminPanel =
    (path === "/admin" || path.startsWith("/admin/")) &&
    path !== "/admin1010" &&
    !path.startsWith("/admin1010/");
  const isAdminLogin = path === "/admin1010" || path.startsWith("/admin1010/");
  const isAdminApi =
    (path === "/api/admin" || path.startsWith("/api/admin/")) &&
    path !== "/api/admin/logout";
  const adminSession = parseAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if ((isAdminPanel || isAdminApi) && !adminSession) {
    if (isAdminApi) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin1010";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminLogin && adminSession) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPlataforma =
    path === "/plataforma" || path.startsWith("/plataforma/");
  const isCoordinacion =
    path === "/coordinacion" || path.startsWith("/coordinacion/");
  // /admin usa cookie propia (administradores), no sesión Supabase de registros.
  const needsAuth = isPlataforma || isCoordinacion;

  if (needsAuth && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/entrar";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (path === "/entrar" && user) {
    const { data: registro } = await supabase
      .from("registros")
      .select("plataforma_rol")
      .eq("user_id", user.id)
      .maybeSingle();

    const rol = registro?.plataforma_rol ?? "personero";

    const redirectUrl = request.nextUrl.clone();
    // Administradores de registros ya no usan /admin (panel propio en /admin1010).
    redirectUrl.pathname = isStaffRole(rol) ? "/coordinacion" : "/plataforma";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
