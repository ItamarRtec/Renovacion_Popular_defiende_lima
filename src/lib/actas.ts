export const ACTA_TIPOS = [
  "instalacion_sufragio",
  "escrutinio",
] as const;

export type ActaTipo = (typeof ACTA_TIPOS)[number];

export const ACTA_TIPO_LABEL: Record<ActaTipo, string> = {
  instalacion_sufragio: "Acta de instalación y sufragio",
  escrutinio: "Acta de escrutinio",
};

export function isActaTipo(value: string | null | undefined): value is ActaTipo {
  return value === "instalacion_sufragio" || value === "escrutinio";
}
