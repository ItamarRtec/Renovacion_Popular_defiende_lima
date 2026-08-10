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
}) {
  const nombre = `${opts.nombres} ${opts.apellidos}`.trim();
  return [
    `Hola Rafael, soy ${nombre} (DNI ${opts.dni}).`,
    "Me registré como personero de Renovación Popular.",
    "Quiero mi asignación de mesa y el video de capacitación.",
  ].join(" ");
}

export const REGISTRO_EXITO_STORAGE_KEY = "rp_registro_exito";

export type RegistroExitoDraft = {
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
};
