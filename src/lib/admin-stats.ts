import type { AdminDb } from "@/lib/admin-session";

export type AdminBalanceStats = {
  mesasCubiertas: number;
  mesasObjetivo: number | null;
  mesasRestantes: number | null;
  personeros: number;
  coordinadores: number;
  suplentesPersoneros: number;
  suplentesCoordinadores: number;
  personerosSinMesa: number;
  totalRegistros: number;
};

function hasMesa(numero: string | null | undefined) {
  return Boolean(numero?.trim());
}

function parseObjetivo(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export async function getAdminBalanceStats(
  supabase: AdminDb,
): Promise<AdminBalanceStats> {
  const { data, error } = await supabase
    .from("registros")
    .select("plataforma_rol, rol_mesa, numero_mesa")
    .in("plataforma_rol", ["personero", "coordinador"]);

  if (error) {
    console.error(error);
    throw new Error("No se pudo cargar el balance administrativo.");
  }

  const rows = data ?? [];
  const mesasTitulares = new Set<string>();
  let personeros = 0;
  let coordinadores = 0;
  let suplentesPersoneros = 0;
  let personerosSinMesa = 0;

  for (const row of rows) {
    if (row.plataforma_rol === "coordinador") {
      coordinadores += 1;
      continue;
    }
    if (row.rol_mesa === "suplente") {
      suplentesPersoneros += 1;
      continue;
    }
    personeros += 1;
    if (!hasMesa(row.numero_mesa)) personerosSinMesa += 1;
    else mesasTitulares.add(row.numero_mesa!.trim());
  }

  const mesasCubiertas = mesasTitulares.size;
  const mesasObjetivo = parseObjetivo(process.env.ADMIN_MESAS_OBJETIVO);
  const mesasRestantes =
    mesasObjetivo === null ? null : Math.max(0, mesasObjetivo - mesasCubiertas);

  return {
    mesasCubiertas,
    mesasObjetivo,
    mesasRestantes,
    personeros,
    coordinadores,
    suplentesPersoneros,
    suplentesCoordinadores: 0,
    personerosSinMesa,
    totalRegistros: rows.length,
  };
}
