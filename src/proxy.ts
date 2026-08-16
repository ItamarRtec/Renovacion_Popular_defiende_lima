import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/plataforma/:path*",
    "/coordinacion/:path*",
    "/admin/:path*",
    "/admin1010",
    "/admin1010/:path*",
    "/api/ops/:path*",
    "/api/admin/:path*",
    "/entrar",
    "/auth/callback",
  ],
};
