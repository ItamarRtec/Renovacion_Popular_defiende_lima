"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CredencialAcciones } from "@/components/credencial-acciones";
import { Chevron } from "@/components/icons/chevron";
import {
  buildWhatsAppShareUrl,
  buildWhatsAppUrl,
  clearRegistroExitoDraft,
  LOCAL_VOTACION_NOTA,
  mensajeInvitarAmigoWhatsApp,
  mensajePersoneroWhatsApp,
  readRegistroExitoDraft,
  whatsappAsignacionE164,
  type RegistroExitoDraft,
} from "@/lib/whatsapp";

type RegistroExitoRpProps = {
  homeHref: string;
  /** Absolute /unirme URL for WhatsApp invite (from server host). */
  registerUrl: string;
  mostrarCredencial?: boolean;
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
      provincia: fromUrl?.provincia ?? null,
      distrito: fromUrl?.distrito ?? null,
      rol_mesa: fromUrl?.rol_mesa ?? null,
    };
  }
  return {
    ...stored,
    numero_mesa: stored.numero_mesa || fromUrl?.numero_mesa || null,
    centro_votacion:
      stored.centro_votacion || fromUrl?.centro_votacion || null,
    provincia: stored.provincia || fromUrl?.provincia || null,
    distrito: stored.distrito || fromUrl?.distrito || null,
    rol_mesa: stored.rol_mesa || fromUrl?.rol_mesa || null,
  };
}

export function RegistroExitoRp({
  homeHref,
  registerUrl,
  mostrarCredencial = false,
}: RegistroExitoRpProps) {
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

  const inviteHref = buildWhatsAppShareUrl(
    mensajeInvitarAmigoWhatsApp(registerUrl),
  );

  const esSuplente = draft?.rol_mesa === "suplente";
  const tieneMesaTitular = Boolean(draft?.numero_mesa) && !esSuplente;
  const tieneNombre = Boolean(draft?.nombres);
  const puedeCredencial =
    mostrarCredencial && Boolean(draft?.nombres && draft?.dni);

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="no-print mx-auto mb-2 flex max-w-md flex-col items-center">
        <h1
          className="rp-porki-bubble mb-3"
          aria-label="Rafael dice: Eso es todo amigos."
        >
          Eso es todo amigos.
        </h1>
        <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-[#1077A1]/30 shadow-[0_10px_28px_rgb(16_119_161_/_0.2)]">
          <Image
            src="/brands/renovacion-popular/rafael-face.png"
            alt="Rafael López Aliaga"
            width={224}
            height={224}
            className="h-full w-full object-cover object-[50%_42%]"
            priority
          />
        </div>
      </div>
      <p className="dl-kicker no-print mt-4">Inscripción completa</p>
      <p className="no-print mx-auto mt-4 max-w-md text-base leading-relaxed text-muted">
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
        <div className="rp-mesa-card no-print mx-auto mt-6 max-w-md">
          <div className="rp-mesa-card__head">
            <p className="dl-kicker">Lista de suplentes</p>
          </div>
          <div className="px-5 pb-5 pt-1 text-left">
            <p className="text-sm leading-relaxed text-muted">
              Tu mesa ONPE ya tiene personero titular. Quedaste en la{" "}
              <strong className="text-white">lista de suplentes</strong>. Te
              contactaremos con una nueva mesa en el{" "}
              <strong className="text-white">mismo centro de votación</strong>{" "}
              donde votas.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {LOCAL_VOTACION_NOTA}
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
        <div className="rp-mesa-card no-print mx-auto mt-6 max-w-md">
          <div className="rp-mesa-card__head">
            <p className="dl-kicker">Tu mesa</p>
          </div>
          <div className="rp-mesa-card__mesa">
            <p className="rp-mesa-card__number">{draft!.numero_mesa}</p>
          </div>
          <p className="border-b border-[rgb(16_119_161_/_0.12)] px-5 py-3 text-left text-sm leading-relaxed text-muted">
            {LOCAL_VOTACION_NOTA}
          </p>
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
        <div className="dl-panel no-print mx-auto mt-6 max-w-md px-5 py-5 text-left">
          <p className="dl-kicker">Asignación pendiente</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Tu mesa será asignada por ONPE. En cuanto lo sea nos contactaremos
            contigo.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {LOCAL_VOTACION_NOTA}
          </p>
        </div>
      )}

      <p className="no-print mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted">
        Pronto nos contactaremos contigo.
      </p>

      {puedeCredencial ? (
        <div className="mt-10 text-left">
          <p className="no-print dl-kicker text-center">Tu credencial</p>
          <p className="no-print mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-muted">
            Descárgala ahora. El QR es el mismo que usarán los coordinadores
            para registrar tu asistencia. Si cierras esta página, vuelve a
            bajarla desde tu plataforma.
          </p>
          <div className="mt-6">
            <CredencialAcciones
              data={{
                nombres: draft!.nombres,
                apellidos: draft!.apellidos,
                dni: draft!.dni,
                numero_mesa: draft!.numero_mesa,
                centro_votacion: draft!.centro_votacion,
                provincia: draft!.provincia,
                distrito: draft!.distrito,
                rol_mesa: draft!.rol_mesa,
              }}
              qrToken={draft!.qrToken}
            />
          </div>
        </div>
      ) : null}

      <div className="no-print mx-auto mt-10 flex max-w-md flex-col items-stretch gap-3">
        <a
          className="dl-btn dl-btn-primary w-full"
          href={inviteHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          Invita a un amigo por WhatsApp
          <Chevron />
        </a>
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
        <Link
          className="dl-btn dl-btn-secondary w-full"
          href={homeHref}
          onClick={() => clearRegistroExitoDraft()}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
