import ubigeo from "@/lib/ubigeo-peru.json";

export const REGIONES = ubigeo.regiones as string[];

export const PROVINCIAS_POR_REGION = ubigeo.provinciasPorRegion as Record<
  string,
  string[]
>;

/** Clave: `${region}|${provincia}` */
export const DISTRITOS_POR_PROVINCIA = ubigeo.distritosPorProvincia as Record<
  string,
  string[]
>;

export function provinciaKey(region: string, provincia: string) {
  return `${region}|${provincia}`;
}

export function distritosDe(region: string, provincia: string) {
  return DISTRITOS_POR_PROVINCIA[provinciaKey(region, provincia)] ?? [];
}
