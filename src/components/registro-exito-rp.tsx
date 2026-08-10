"use client";

import Image from "next/image";
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
      : "Hola Rafael, me registré como personero de Renovación Popular. Quiero confirmar mi asignación y el video de capacitación.";
    return buildWhatsAppUrl(phone, text);
  }, [draft, phone]);

  const tieneMesa = Boolean(draft?.numero_mesa);

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto mb-4 h-28 w-28">
        <Image
          src="/brands/renovacion-popular/porki.png"
          alt=""
          width={224}
          height={224}
          className="h-full w-full object-contain"
          priority
        />
      </div>
      <p className="dl-kicker">Inscripción completa</p>
      <h1 className="dl-title mt-3 text-[clamp(2rem,5vw,2.75rem)]">
        Eso es todo, amigos
      </h1>
      <p className="mx-auto mt-4 text-base leading-relaxed text-muted">
        {draft ? (
          <>
            Gracias, <strong>{draft.nombres}</strong>. Ya eres personero de{" "}
            <strong>Renovación Popular</strong>
            {draft.dni ? (
              <>
                {" "}
                · DNI{" "}
                <strong className="font-[family-name:var(--font-data)]">
                  {draft.dni}
                </strong>
              </>
            ) : null}
            .
          </>
        ) : (
          <>
            Ya eres personero de <strong>Renovación Popular</strong>.
          </>
        )}
      </p>

      {tieneMesa ? (
        <div className="dl-panel mx-auto mt-6 px-5 py-4 text-left">
          <p className="dl-kicker">Su mesa</p>
          <p className="mt-2 text-base leading-relaxed text-[#0b2a36]">
            Usted es personero de la mesa{" "}
            <strong className="text-2xl font-semibold tracking-tight text-[#1077A1] font-[family-name:var(--font-data)]">
              {draft!.numero_mesa}
            </strong>
            {draft?.dni ? (
              <>
                {" "}
                · DNI{" "}
                <strong className="font-[family-name:var(--font-data)]">
                  {draft.dni}
                </strong>
              </>
            ) : null}
            .
          </p>
          {draft?.centro_votacion ? (
            <p className="mt-2 text-sm text-muted">{draft.centro_votacion}</p>
          ) : null}
          {draft?.distrito ? (
            <p className="mt-1 text-sm text-muted">{draft.distrito}</p>
          ) : null}
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Dato del padrón electoral. Confírmalo con Rafael por WhatsApp.
          </p>
        </div>
      ) : (
        <div className="dl-panel mx-auto mt-6 px-5 py-4 text-left">
          <p className="dl-kicker">Asignación pendiente</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Su mesa será asignada en breve. Recibirá un mensaje con ella y los
            siguientes pasos. Mientras tanto, puede escribirle a Rafael López
            Aliga por WhatsApp.
          </p>
        </div>
      )}

      <div className="mt-10 flex flex-col items-stretch gap-3">
        {waHref ? (
          <a
            className="dl-btn dl-btn-primary w-full"
            href={waHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            {tieneMesa ? "Confirmar por WhatsApp" : "Escribir por WhatsApp"}
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
