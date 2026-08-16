import type { AdminDb } from "@/lib/admin-session";
import { isCoordinadorDistrital, isCoordinadorLocal } from "@/lib/roles";

export type AdminBalanceStats = {
  mesasCubiertas: number;
  mesasObjetivo: number | null;
  mesasRestantes: number | null;
  personeros: number;
  coordinadores: number;
  coordinadoresLocales: number;
  coordinadoresDistritales: number;
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
    .neq("plataforma_rol", "administrador");

  if (error) {
    console.error(error);
    throw new Error("No se pudo cargar el balance administrativo.");
  }

  const rows = data ?? [];
  const mesasTitulares = new Set<string>();
  let personeros = 0;
  let coordinadoresLocales = 0;
  let coordinadoresDistritales = 0;
  let suplentesPersoneros = 0;
  let personerosSinMesa = 0;

  for (const row of rows) {
    if (isCoordinadorDistrital(row.plataforma_rol)) {
      coordinadoresDistritales += 1;
      continue;
    }
    if (isCoordinadorLocal(row.plataforma_rol)) {
      coordinadoresLocales += 1;
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
    coordinadores: coordinadoresLocales + coordinadoresDistritales,
    coordinadoresLocales,
    coordinadoresDistritales,
    suplentesPersoneros,
    suplentesCoordinadores: 0,
    personerosSinMesa,
    totalRegistros: rows.length,
  };
}
