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

/** Abre el selector de contacto (invitar amigo, sin número fijo). */
export function buildWhatsAppShareUrl(text: string) {
  const params = new URLSearchParams({ text });
  return `https://wa.me/?${params.toString()}`;
}

export const LOCAL_VOTACION_NOTA =
  "Tu local de votación se conocerá la primera semana de septiembre — te llegará por WhatsApp.";

export function mensajePersoneroWhatsApp(opts: {
  nombres: string;
  apellidos: string;
  dni: string;
  numero_mesa?: string | null;
  centro_votacion?: string | null;
  distrito?: string | null;
  rol_mesa?: "titular" | "suplente" | null;
}) {
  const nombre = `${opts.nombres} ${opts.apellidos}`.trim();
  const lines = [
    `Hola Rafael, soy ${nombre} (DNI ${opts.dni}).`,
    "Me registré como personero de Renovación Popular.",
  ];
  if (opts.rol_mesa === "suplente") {
    lines.push(
      "Quedé en lista de suplentes porque mi mesa ONPE ya tenía personero.",
    );
    if (opts.centro_votacion) {
      lines.push(
        `Quiero una mesa en el mismo centro (${opts.centro_votacion}).`,
      );
    } else {
      lines.push("Quiero una mesa en el mismo centro de votación.");
    }
  } else if (opts.numero_mesa) {
    lines.push(`Según ONPE, mi mesa es ${opts.numero_mesa}.`);
    if (opts.centro_votacion) {
      lines.push(`Centro: ${opts.centro_votacion}.`);
    } else if (opts.distrito) {
      lines.push(`Distrito: ${opts.distrito}.`);
    }
  }
  lines.push(
    "El local de votación se confirma la primera semana de septiembre por WhatsApp.",
  );
  lines.push("Quiero confirmar mi asignación y el video de capacitación.");
  return lines.join(" ");
}

export function mensajeInvitarAmigoWhatsApp(registerUrl: string) {
  return [
    "Oye, únete como personero de Renovación Popular.",
    "Si votas en Lima necesito tu apoyo",
    `Regístrate aquí: ${registerUrl}`,
  ].join(" ");
}

export const REGISTRO_EXITO_STORAGE_KEY = "rp_registro_exito";

export type RegistroExitoDraft = {
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  id?: string | null;
  qrToken?: string | null;
  numero_mesa?: string | null;
  centro_votacion?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  rol_mesa?: "titular" | "suplente" | null;
};

export function readRegistroExitoDraft(): RegistroExitoDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(REGISTRO_EXITO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegistroExitoDraft;
    if (parsed?.nombres && parsed?.apellidos && parsed?.dni) return parsed;
  } catch {
    // ignore
  }
  return null;
}

export function clearRegistroExitoDraft() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(REGISTRO_EXITO_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Query string de respaldo para /unirme/listo (solo mesa/ubicación, sin PII). */
export function registroExitoQuery(draft: RegistroExitoDraft): string {
  const params = new URLSearchParams();
  if (draft.numero_mesa) params.set("mesa", draft.numero_mesa);
  if (draft.distrito) params.set("distrito", draft.distrito);
  if (draft.centro_votacion) params.set("local", draft.centro_votacion);
  if (draft.rol_mesa) params.set("rol", draft.rol_mesa);
  const q = params.toString();
  return q ? `?${q}` : "";
}
