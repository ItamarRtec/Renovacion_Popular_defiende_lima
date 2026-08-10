/**
 * WhatsApp de asignación (Rafael López Aliga / Defiende Lima).
 * Formato E.164 sin "+": p. ej. 51987654321
 */
export function whatsappAsignacionE164() {
  const raw = (process.env.NEXT_PUBLIC_WHATSAPP_RAFAEL ?? "").replace(/\D/g, "");
  if (!raw) return null;
  // Si solo pasan 9 dígitos (Perú), anteponer 51.
  if (raw.length === 9) return `51${raw}`;
  return raw;
}

export function buildWhatsAppUrl(phoneE164: string, text: string) {
  const params = new URLSearchParams({ text });
  return `https://wa.me/${phoneE164}?${params.toString()}`;
}

export function mensajePersoneroWhatsApp(opts: {
  nombres: string;
  apellidos: string;
  dni: string;
  numero_mesa?: string | null;
  centro_votacion?: string | null;
  distrito?: string | null;
}) {
  const nombre = `${opts.nombres} ${opts.apellidos}`.trim();
  const lines = [
    `Hola Rafael, soy ${nombre} (DNI ${opts.dni}).`,
    "Me registré como personero de Renovación Popular.",
  ];
  if (opts.numero_mesa) {
    lines.push(`Según ONPE, mi mesa es ${opts.numero_mesa}.`);
  }
  if (opts.centro_votacion) {
    lines.push(`Centro: ${opts.centro_votacion}.`);
  } else if (opts.distrito) {
    lines.push(`Distrito: ${opts.distrito}.`);
  }
  lines.push("Quiero confirmar mi asignación y el video de capacitación.");
  return lines.join(" ");
}

export const REGISTRO_EXITO_STORAGE_KEY = "rp_registro_exito";

export type RegistroExitoDraft = {
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  numero_mesa?: string | null;
  centro_votacion?: string | null;
  distrito?: string | null;
};
