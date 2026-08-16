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

/** Compara mesas ignorando ceros a la izquierda (00123 = 123). */
export function mesaKey(numero: string | null | undefined): string {
  const raw = numero?.trim() ?? "";
  if (!raw) return "";
  if (!/^\d+$/.test(raw)) return raw;
  return raw.replace(/^0+/, "") || "0";
}

/** Guarda la mesa como en ONPE (6 dígitos). */
export function normalizeNumeroMesa(
  raw: string | null | undefined,
): string {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  if (/^\d+$/.test(t)) return t.padStart(6, "0");
  return t;
}

export type MesaColgarOpcion = {
  key: string;
  numero: string;
  personero: string;
  suplente: boolean;
};

export function mesasParaColgar(
  personeros: {
    nombres: string;
    apellidos: string;
    numero_mesa?: string | null;
    rol_mesa?: "titular" | "suplente" | null;
  }[],
): MesaColgarOpcion[] {
  const byKey = new Map<string, MesaColgarOpcion>();
  for (const p of personeros) {
    const numero = p.numero_mesa?.trim() ?? "";
    const key = mesaKey(numero);
    if (!key) continue;
    const suplente = p.rol_mesa === "suplente";
    const actual = byKey.get(key);
    if (actual && (actual.suplente === false || suplente)) continue;
    byKey.set(key, {
      key,
      numero,
      personero: `${p.apellidos}, ${p.nombres}`.trim(),
      suplente,
    });
  }
  return [...byKey.values()].sort((a, b) => {
    const na = Number(a.key);
    const nb = Number(b.key);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return a.numero.localeCompare(b.numero, "es");
  });
}
