import type { CredencialTipo } from "@/lib/roles";
import { credencialTipoFromRol } from "@/lib/roles";

export type CredencialData = {
  tipo?: CredencialTipo;
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

export type CredencialCopy = {
  cargo: string;
  otorgamiento: string;
  nombreLabel: string;
  boxLabel: string;
  lugarTitulo: string;
  showLocal: boolean;
  colgarOtraMesa: string | null;
  footer: string;
};

const COPY: Record<CredencialTipo, CredencialCopy> = {
  personero: {
    cargo: "PERSONERO DE MESA DE SUFRAGIO",
    otorgamiento: "PERSONERO DE MESA DE SUFRAGIO",
    nombreLabel: "Nombres y Apellidos del Personero",
    boxLabel: "Mesa Nro.",
    lugarTitulo: "Centro de votación en la que se acredita al personero",
    showLocal: true,
    colgarOtraMesa: null,
    footer:
      "Esta credencial acredita al titular como personero de mesa de Renovación Popular para las Elecciones Municipales 2026 (domingo 4 de octubre de 2026). El código QR identifica al personero para el registro de asistencia en el local de votación.",
  },
  coordinador_local: {
    cargo: "COORDINADOR DE LOCAL DE VOTACIÓN",
    otorgamiento: "COORDINADOR DE LOCAL DE VOTACIÓN",
    nombreLabel: "Nombres y Apellidos del Coordinador",
    boxLabel: "Local de votación",
    lugarTitulo: "Local de votación en el que se acredita al coordinador",
    showLocal: true,
    colgarOtraMesa:
      "Autorizado a colgar de otra mesa de sufragio del mismo local de votación y a recabar sus actas cuando falte el personero.",
    footer:
      "Esta credencial acredita al titular como coordinador de local de votación de Renovación Popular para las Elecciones Municipales 2026 (domingo 4 de octubre de 2026). El código QR identifica al coordinador de local. Puede colgar de otra mesa del mismo local.",
  },
  coordinador_distrital: {
    cargo: "COORDINADOR DISTRITAL",
    otorgamiento: "COORDINADOR DISTRITAL",
    nombreLabel: "Nombres y Apellidos del Coordinador",
    boxLabel: "Distrito",
    lugarTitulo: "Distrito en el que se acredita al coordinador",
    showLocal: false,
    colgarOtraMesa:
      "Autorizado a colgar de otra mesa de sufragio de su distrito y a recabar sus actas cuando falte el personero o el coordinador de local.",
    footer:
      "Esta credencial acredita al titular como coordinador distrital de Renovación Popular para las Elecciones Municipales 2026 (domingo 4 de octubre de 2026). El código QR identifica al coordinador de distrito. Puede colgar de otra mesa de su distrito.",
  },
};

export function credencialTipo(data: CredencialData): CredencialTipo {
  return data.tipo ?? "personero";
}

export function credencialCopy(data: CredencialData): CredencialCopy {
  return COPY[credencialTipo(data)];
}

export function credencialBoxValue(data: CredencialData): string {
  const tipo = credencialTipo(data);
  if (tipo === "personero") {
    return data.numero_mesa?.trim() || "Por asignar";
  }
  if (tipo === "coordinador_local") {
    return data.centro_votacion?.trim() || "Por confirmar";
  }
  return data.distrito?.trim() || "Por asignar";
}

export function credencialFromRegistro(registro: {
  nombres: string;
  apellidos: string;
  dni: string;
  numero_mesa?: string | null;
  centro_votacion?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  rol_mesa?: "titular" | "suplente" | null;
  created_at?: string;
  plataforma_rol?: string | null;
}): CredencialData | null {
  const tipo = credencialTipoFromRol(registro.plataforma_rol);
  if (!tipo) return null;
  return {
    tipo,
    nombres: registro.nombres,
    apellidos: registro.apellidos,
    dni: registro.dni,
    numero_mesa: registro.numero_mesa,
    centro_votacion: registro.centro_votacion,
    provincia: registro.provincia,
    distrito: registro.distrito,
    rol_mesa: registro.rol_mesa,
    emitidaEl: registro.created_at,
  };
}

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

export function tituloCredencial(data: CredencialData): string {
  const tipo = credencialTipo(data);
  if (tipo === "coordinador_local") return "Tu credencial de coordinador de local";
  if (tipo === "coordinador_distrital") {
    return "Tu credencial de coordinador de distrito";
  }
  return "Tu credencial de personero";
}
