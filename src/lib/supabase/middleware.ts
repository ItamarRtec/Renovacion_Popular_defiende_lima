import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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

  const path = request.nextUrl.pathname;
  const isPlataforma =
    path === "/plataforma" || path.startsWith("/plataforma/");
  const isCoordinacion =
    path === "/coordinacion" || path.startsWith("/coordinacion/");
  // /admin1010 es ops secreto (clave env), no exige sesión de plataforma.
  const isAdmin =
    (path === "/admin" || path.startsWith("/admin/")) &&
    path !== "/admin1010" &&
    !path.startsWith("/admin1010/");
  const needsAuth = isPlataforma || isCoordinacion || isAdmin;

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

    // Con el acceso cerrado, un no-admin debe poder ver /entrar (mensaje de
    // cerrado) sin que lo reboten a su home (que a su vez lo devolvería aquí).
    if (rol !== "administrador") {
      const { data: abierto } = await supabase.rpc("acceso_publico_abierto");
      if (abierto === false) {
        return supabaseResponse;
      }
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      rol === "administrador"
        ? "/admin"
        : rol === "coordinador"
          ? "/coordinacion"
          : "/plataforma";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
