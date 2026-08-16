export type CredencialData = {
  nombres: string;
  apellidos: string;
  dni: string;
  numero_mesa?: string | null;
  centro_votacion?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  rol_mesa?: "titular" | "suplente" | null;
  emitidaEl?: string | Date | null;
};

export function personeroLegal() {
  return {
    nombre:
      process.env.NEXT_PUBLIC_PERSONERO_LEGAL_NOMBRE?.trim() ||
      "Renovación Popular",
    dni: process.env.NEXT_PUBLIC_PERSONERO_LEGAL_DNI?.trim() || "",
    jee: process.env.NEXT_PUBLIC_PERSONERO_LEGAL_JEE?.trim() || "Lima",
    calidad: "Titular",
  };
}

export function fechaEmisionEs(date: string | Date | null | undefined): string {
  const d = date ? new Date(date) : new Date();
  const valid = Number.isNaN(d.getTime()) ? new Date() : d;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(valid);
}

export function ubicacionCredencial(data: CredencialData): string {
  const parts = [data.distrito, data.provincia || "Lima"].filter(Boolean);
  const unique = [...new Set(parts.map((p) => p!.trim()).filter(Boolean))];
  return unique.join(", ") || "Lima";
}

export function nombreCompleto(data: CredencialData): string {
  return `${data.nombres} ${data.apellidos}`.trim();
}
