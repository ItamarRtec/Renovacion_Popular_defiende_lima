import type { PlataformaRol } from "@/lib/supabase/database.types";

/** Las tres credenciales de campo. Centro de control no imprime credencial. */
export type CredencialTipo =
  | "personero"
  | "coordinador_local"
  | "coordinador_distrital";

export const ROLES_PROMOCION: readonly PlataformaRol[] = [
  "personero",
  "coordinador_local",
  "coordinador_distrital",
  "administrador",
];

export function isCoordinacionRole(
  rol: string | null | undefined,
): boolean {
  return (
    rol === "coordinador" ||
    rol === "coordinador_local" ||
    rol === "coordinador_distrital"
  );
}

export function isCoordinadorLocal(
  rol: string | null | undefined,
): boolean {
  return rol === "coordinador_local" || rol === "coordinador";
}

export function isCoordinadorDistrital(
  rol: string | null | undefined,
): boolean {
  return rol === "coordinador_distrital";
}

export function isAdminRole(rol: string | null | undefined): boolean {
  return rol === "administrador";
}

export function isStaffRole(rol: string | null | undefined): boolean {
  return isCoordinacionRole(rol) || isAdminRole(rol);
}

export function canLoginWithEmailDni(
  rol: string | null | undefined,
): boolean {
  return rol === "personero" || isCoordinacionRole(rol);
}

export function credencialTipoFromRol(
  rol: string | null | undefined,
): CredencialTipo | null {
  if (isAdminRole(rol)) return null;
  if (isCoordinadorDistrital(rol)) return "coordinador_distrital";
  if (isCoordinadorLocal(rol)) return "coordinador_local";
  return "personero";
}

const ROL_ALIASES: Record<string, PlataformaRol> = {
  personero: "personero",
  coordinador: "coordinador_local",
  coordinador_local: "coordinador_local",
  "coordinador de local": "coordinador_local",
  cl: "coordinador_local",
  coordinador_distrital: "coordinador_distrital",
  "coordinador de distrito": "coordinador_distrital",
  "coordinador distrital": "coordinador_distrital",
  cd: "coordinador_distrital",
  administrador: "administrador",
  admin: "administrador",
  "centro de control": "administrador",
};

export function normalizeRolPromocion(
  raw: string | null | undefined,
): PlataformaRol | null {
  const key = raw?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
  if (!key) return null;
  return ROL_ALIASES[key] ?? null;
}

export function labelRol(rol: string | null | undefined): string {
  switch (rol) {
    case "personero":
      return "Personero";
    case "coordinador":
    case "coordinador_local":
      return "Coordinador de local";
    case "coordinador_distrital":
      return "Coordinador de distrito";
    case "administrador":
      return "Centro de control";
    default:
      return rol ?? "—";
  }
}
