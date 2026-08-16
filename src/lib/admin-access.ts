import type { NextRequest } from "next/server";

/**
 * Admin UI stays behind /admin1010 (cookie).
 * Allowed on loopback, Vercel, or ALLOW_ADMIN=1.
 */
export function isAdminHostAllowed(request: NextRequest): boolean {
  if (process.env.ALLOW_ADMIN === "1") return true;
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") {
    return true;
  }

  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

export function isAdminSurfacePath(pathname: string): boolean {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
  if (pathname === "/admin1010" || pathname.startsWith("/admin1010/")) {
    return true;
  }
  if (pathname === "/api/ops" || pathname.startsWith("/api/ops/")) return true;
  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
    return true;
  }
  return false;
}
