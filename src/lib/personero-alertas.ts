import { mesaKey } from "@/lib/actas";
import type { RegistroRow } from "@/lib/supabase/database.types";

export type ActaRef = {
  registro_id: string;
  tipo: string;
  numero_mesa: string | null;
};

export const ALERTA_CODIGOS = [
  "sin_mesa",
  "videos",
  "sin_local",
  "sin_instalacion",
  "sin_escrutinio",
  "rechazado",
] as const;

export type AlertaCodigo = (typeof ALERTA_CODIGOS)[number];

export const ALERTA_LABEL: Record<AlertaCodigo, string> = {
  sin_mesa: "Sin mesa asignada",
  videos: "Faltan videos de capacitación",
  sin_local: "No llegó al local",
  sin_instalacion: "Falta el acta de instalación",
  sin_escrutinio: "Falta el acta de escrutinio",
  rechazado: "El registro fue rechazado",
};

export function personeroTieneActa(
  actas: ActaRef[],
  personeroId: string,
  numeroMesa: string | null | undefined,
  tipo: "instalacion_sufragio" | "escrutinio",
): boolean {
  const mesa = mesaKey(numeroMesa);
  return actas.some(
    (a) =>
      a.tipo === tipo &&
      (a.registro_id === personeroId ||
        (mesa !== "" && mesaKey(a.numero_mesa) === mesa)),
  );
}

export function codigosAlertaDe(opts: {
  personero: Pick<RegistroRow, "id" | "numero_mesa" | "estado">;
  actas: ActaRef[];
  videosVistos: number;
  totalVideos: number;
  llegoAlLocal: boolean;
}): AlertaCodigo[] {
  const { personero, actas, videosVistos, totalVideos, llegoAlLocal } = opts;
  const codigos: AlertaCodigo[] = [];
  if (!personero.numero_mesa?.trim()) codigos.push("sin_mesa");
  if (totalVideos > 0 && videosVistos < totalVideos) codigos.push("videos");
  if (!llegoAlLocal) codigos.push("sin_local");
  if (
    !personeroTieneActa(
      actas,
      personero.id,
      personero.numero_mesa,
      "instalacion_sufragio",
    )
  ) {
    codigos.push("sin_instalacion");
  }
  if (
    !personeroTieneActa(
      actas,
      personero.id,
      personero.numero_mesa,
      "escrutinio",
    )
  ) {
    codigos.push("sin_escrutinio");
  }
  if (personero.estado === "rechazado") codigos.push("rechazado");
  return codigos;
}

export function textosAlerta(
  codigos: AlertaCodigo[],
  videosVistos: number,
  totalVideos: number,
): string[] {
  return codigos.map((codigo) => {
    if (codigo === "videos") {
      return `Faltan videos de capacitación (${videosVistos} de ${totalVideos}).`;
    }
    return ALERTA_LABEL[codigo] + ".";
  });
}

export function resumenAlertas(
  porPersonero: AlertaCodigo[][],
): { personeros: number; porCodigo: { codigo: AlertaCodigo; count: number }[] } {
  const personeros = porPersonero.filter((row) => row.length > 0).length;
  const counts = new Map<AlertaCodigo, number>();
  for (const row of porPersonero) {
    for (const codigo of row) {
      counts.set(codigo, (counts.get(codigo) ?? 0) + 1);
    }
  }
  const porCodigo = ALERTA_CODIGOS.filter((codigo) => (counts.get(codigo) ?? 0) > 0).map(
    (codigo) => ({ codigo, count: counts.get(codigo) ?? 0 }),
  );
  return { personeros, porCodigo };
}
