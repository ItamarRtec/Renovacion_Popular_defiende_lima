"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Chevron } from "@/components/icons/chevron";
import {
  buildWhatsAppUrl,
  clearRegistroExitoDraft,
  mensajePersoneroWhatsApp,
  readRegistroExitoDraft,
  whatsappAsignacionE164,
  type RegistroExitoDraft,
} from "@/lib/whatsapp";

type RegistroExitoRpProps = {
  homeHref: string;
};

function draftFromSearchParams(
  params: URLSearchParams,
): Partial<RegistroExitoDraft> | null {
  const numero_mesa = params.get("mesa")?.trim() || null;
  const rol = params.get("rol")?.trim();
  const distrito = params.get("distrito")?.trim() || null;
  const centro_votacion = params.get("local")?.trim() || null;
  if (!numero_mesa && rol !== "suplente") return null;
  return {
    numero_mesa,
    centro_votacion,
    distrito,
    rol_mesa: rol === "suplente" || rol === "titular" ? rol : null,
  };
}

function mergeDraft(
  stored: RegistroExitoDraft | null,
  fromUrl: Partial<RegistroExitoDraft> | null,
): RegistroExitoDraft | null {
  if (!stored && !fromUrl) return null;
  if (!stored) {
    return {
      nombres: "",
      apellidos: "",
      dni: "",
      telefono: "",
      numero_mesa: fromUrl?.numero_mesa ?? null,
      centro_votacion: fromUrl?.centro_votacion ?? null,
      distrito: fromUrl?.distrito ?? null,
      rol_mesa: fromUrl?.rol_mesa ?? null,
    };
  }
  return {
    ...stored,
    numero_mesa: stored.numero_mesa || fromUrl?.numero_mesa || null,
    centro_votacion:
      stored.centro_votacion || fromUrl?.centro_votacion || null,
    distrito: stored.distrito || fromUrl?.distrito || null,
    rol_mesa: stored.rol_mesa || fromUrl?.rol_mesa || null,
  };
}

export function RegistroExitoRp({ homeHref }: RegistroExitoRpProps) {
  const searchParams = useSearchParams();
  const [draft] = useState<RegistroExitoDraft | null>(() =>
    mergeDraft(readRegistroExitoDraft(), draftFromSearchParams(searchParams)),
  );

  const phone = whatsappAsignacionE164();
  const waHref = useMemo(() => {
    if (!phone) return null;
    const text =
      draft && draft.nombres && draft.dni
        ? mensajePersoneroWhatsApp(draft)
        : "Hola Rafael, me registré como personero de Renovación Popular. Quiero confirmar mi asignación y el video de capacitación.";
    return buildWhatsAppUrl(phone, text);
  }, [draft, phone]);

  const esSuplente = draft?.rol_mesa === "suplente";
  const tieneMesaTitular = Boolean(draft?.numero_mesa) && !esSuplente;
  const tieneNombre = Boolean(draft?.nombres);

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto mb-2 flex flex-col items-center">
        <h1
          className="rp-porki-bubble mb-3"
          aria-label="Porki dice: Eso es todo amigos."
        >
          Eso es todo amigos.
        </h1>
        <div className="h-28 w-28">
          <Image
            src="/brands/renovacion-popular/porki.png"
            alt="Porki"
            width={224}
            height={224}
            className="h-full w-full object-contain"
            priority
          />
        </div>
      </div>
      <p className="dl-kicker mt-4">Inscripción completa</p>
      <p className="mx-auto mt-4 text-base leading-relaxed text-muted">
        {tieneNombre ? (
          <>
            Gracias, <strong>{draft!.nombres}</strong>. Ya eres personero de{" "}
            <strong>Renovación Popular</strong>.
          </>
        ) : (
          <>
            Ya eres personero de <strong>Renovación Popular</strong>.
          </>
        )}
      </p>

      {esSuplente ? (
        <div className="rp-mesa-card mx-auto mt-6">
          <div className="rp-mesa-card__head">
            <p className="dl-kicker">Lista de suplentes</p>
          </div>
          <div className="px-5 pb-5 pt-1 text-left">
            <p className="text-sm leading-relaxed text-muted">
              Su mesa ONPE ya tiene personero titular. Quedó en la{" "}
              <strong className="text-white">lista de suplentes</strong>. Lo
              contactaremos con una nueva mesa en el{" "}
              <strong className="text-white">mismo centro de votación</strong>{" "}
              donde usted vota.
            </p>
          </div>
          <dl className="rp-mesa-card__rows">
            {draft?.numero_mesa ? (
              <div className="rp-mesa-card__row">
                <dt className="rp-mesa-card__label">Mesa ONPE</dt>
                <dd className="rp-mesa-card__value rp-mesa-card__value--data">
                  {draft.numero_mesa}
                </dd>
              </div>
            ) : null}
            {draft?.distrito ? (
              <div className="rp-mesa-card__row">
                <dt className="rp-mesa-card__label">Distrito</dt>
                <dd className="rp-mesa-card__value">
                  {draft.distrito}
                  {!draft.distrito.includes("Lima") ? ", Lima" : ""}
                </dd>
              </div>
            ) : null}
            {draft?.centro_votacion ? (
              <div className="rp-mesa-card__row">
                <dt className="rp-mesa-card__label">Local</dt>
                <dd className="rp-mesa-card__value">{draft.centro_votacion}</dd>
              </div>
            ) : null}
            {draft?.dni ? (
              <div className="rp-mesa-card__row">
                <dt className="rp-mesa-card__label">DNI</dt>
                <dd className="rp-mesa-card__value rp-mesa-card__value--data">
                  {draft.dni}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : tieneMesaTitular ? (
        <div className="rp-mesa-card mx-auto mt-6">
          <div className="rp-mesa-card__head">
            <p className="dl-kicker">Su mesa</p>
          </div>
          <div className="rp-mesa-card__mesa">
            <p className="rp-mesa-card__number">{draft!.numero_mesa}</p>
          </div>
          <dl className="rp-mesa-card__rows">
            {draft?.distrito ? (
              <div className="rp-mesa-card__row">
                <dt className="rp-mesa-card__label">Distrito</dt>
                <dd className="rp-mesa-card__value">
                  {draft.distrito}
                  {!draft.distrito.includes("Lima") ? ", Lima" : ""}
                </dd>
              </div>
            ) : null}
            {draft?.centro_votacion ? (
              <div className="rp-mesa-card__row">
                <dt className="rp-mesa-card__label">Local</dt>
                <dd className="rp-mesa-card__value">{draft.centro_votacion}</dd>
              </div>
            ) : null}
            {draft?.dni ? (
              <div className="rp-mesa-card__row">
                <dt className="rp-mesa-card__label">DNI</dt>
                <dd className="rp-mesa-card__value rp-mesa-card__value--data">
                  {draft.dni}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : (
        <div className="dl-panel mx-auto mt-6 px-5 py-5 text-left">
          <p className="dl-kicker">Asignación pendiente</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Su mesa será asignada en breve. Recibirá un mensaje con ella.
          </p>
        </div>
      )}

      <p className="mx-auto mt-6 text-sm leading-relaxed text-muted">
        Mientras tanto, espere a que <strong>Rafael López Aliaga</strong> se
        comunique con usted.
      </p>

      <div className="mt-10 flex flex-col items-stretch gap-3">
        <Link
          className="dl-btn dl-btn-primary w-full"
          href={homeHref}
          onClick={() => clearRegistroExitoDraft()}
        >
          Volver al inicio
        </Link>
        {waHref ? (
          <a
            className="dl-btn dl-btn-secondary w-full"
            href={waHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            Escribir por WhatsApp
            <Chevron />
          </a>
        ) : null}
      </div>
    </div>
  );
}
