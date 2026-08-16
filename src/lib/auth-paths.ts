import { isCoordinacionRole } from "@/lib/roles";
import type { PlataformaRol } from "@/lib/supabase/database.types";

/** Pure helper — safe to import from client components. */
export function homePathForRole(rol: PlataformaRol | null | undefined): string {
  if (rol === "administrador") return "/admin";
  if (isCoordinacionRole(rol)) return "/coordinacion";
  return "/plataforma";
}

/**
 * Valida el parámetro `next` de redirección. Solo acepta rutas internas
 * de una sola barra: rechaza URLs absolutas y protocol-relative
 * (`//evil.com`, `/\evil.com`), que burlarían un simple startsWith('/').
 */
export function safeNextPath(
  next: string | null | undefined,
): string | null {
  if (!next || !next.startsWith("/")) return null;
  if (next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}
