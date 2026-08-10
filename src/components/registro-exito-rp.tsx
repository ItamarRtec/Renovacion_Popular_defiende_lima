"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Chevron } from "@/components/icons/chevron";
import {
  REGISTRO_EXITO_STORAGE_KEY,
  buildWhatsAppUrl,
  mensajePersoneroWhatsApp,
  whatsappAsignacionE164,
  type RegistroExitoDraft,
} from "@/lib/whatsapp";

type RegistroExitoRpProps = {
  homeHref: string;
};

function readDraftOnce(): RegistroExitoDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(REGISTRO_EXITO_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(REGISTRO_EXITO_STORAGE_KEY);
    const parsed = JSON.parse(raw) as RegistroExitoDraft;
    if (parsed?.nombres && parsed?.apellidos && parsed?.dni) return parsed;
  } catch {
    // ignore
  }
  return null;
}

export function RegistroExitoRp({ homeHref }: RegistroExitoRpProps) {
  const [draft] = useState<RegistroExitoDraft | null>(readDraftOnce);

  const phone = whatsappAsignacionE164();
  const waHref = useMemo(() => {
    if (!phone) return null;
    const text = draft
      ? mensajePersoneroWhatsApp(draft)
      : "Hola Rafael, me registré como personero de Renovación Popular. Quiero mi asignación de mesa y el video de capacitación.";
    return buildWhatsAppUrl(phone, text);
  }, [draft, phone]);

  return (
    <div className="mx-auto max-w-md text-center">
      <p className="dl-kicker">Inscripción completa</p>
      <h1 className="dl-title mt-3 text-[clamp(2rem,5vw,2.75rem)]">
        ¡Felicitaciones!
      </h1>
      <p className="mx-auto mt-4 text-base leading-relaxed text-muted">
        {draft ? (
          <>
            Gracias, <strong>{draft.nombres}</strong>. Ya eres personero de{" "}
            <strong>Renovación Popular</strong>.
          </>
        ) : (
          <>
            Ya eres personero de <strong>Renovación Popular</strong>.
          </>
        )}
      </p>
      <p className="mx-auto mt-3 text-sm leading-relaxed text-muted">
        El siguiente paso es escribir a Rafael López Aliga por WhatsApp. En su
        primera respuesta te asignará tu mesa y te enviará el video de
        capacitación.
      </p>

      <div className="mt-10 flex flex-col items-stretch gap-3">
        {waHref ? (
          <a
            className="dl-btn dl-btn-primary w-full"
            href={waHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            Escribir por WhatsApp
            <Chevron />
          </a>
        ) : (
          <p
            className="rounded-[var(--radius-md)] border border-danger-500/40 bg-danger-100/40 px-4 py-3 text-sm text-danger-500"
            role="status"
          >
            Falta configurar el número de WhatsApp
            (NEXT_PUBLIC_WHATSAPP_RAFAEL).
          </p>
        )}
        <Link className="dl-btn dl-btn-secondary w-full" href={homeHref}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
