"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Chevron } from "@/components/icons/chevron";
import { Turnstile, turnstileConfigured } from "@/components/turnstile";
import type { RegistroOrigen } from "@/lib/supabase/database.types";
import {
  REGISTRO_EXITO_STORAGE_KEY,
  registroExitoQuery,
  type RegistroExitoDraft,
} from "@/lib/whatsapp";

type RegistroFormLabels = {
  nombres?: string;
  apellidos?: string;
  dni?: string;
  telefono?: string;
  email?: string;
};

type RegistroFormProps = {
  origen?: RegistroOrigen;
  homeHref?: string;
  /** Si se define, tras un alta OK navega aquí (RP: /unirme/listo). */
  successHref?: string;
  ctaLabel?: string;
  ctaPendingLabel?: string;
  footerNote?: string;
  labels?: RegistroFormLabels;
  placeholders?: RegistroFormLabels;
};

type MesaResult = {
  numero_mesa?: string | null;
  centro_votacion?: string | null;
  distrito?: string | null;
};

type RolMesaResult = "titular" | "suplente";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readTrimmed(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function MesaLoadingOverlay() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mesa-loading-title"
    >
      <div className="dl-panel w-full max-w-sm px-6 py-8 text-center shadow-[0_20px_50px_rgb(0_0_0_/_0.25)]">
        <div
          aria-hidden
          className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#1077A1]/25 border-t-[#1077A1]"
        />
        <h2
          id="mesa-loading-title"
          className="dl-title mt-5 text-xl tracking-tight"
        >
          Determinando su mesa
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Consultamos el padrón electoral con su DNI. Esto puede tomar unos
          segundos.
        </p>
      </div>
    </div>
  );
}

export function RegistroForm({
  origen = "defiende_lima",
  homeHref = "/",
  successHref,
  ctaLabel = "Confirmar inscripción",
  ctaPendingLabel = "Determinando su mesa…",
  footerNote,
  labels,
  placeholders,
}: RegistroFormProps) {
  const router = useRouter();
  const [consentimiento, setConsentimiento] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submittedMesa, setSubmittedMesa] = useState<MesaResult | null>(null);
  const [submittedDni, setSubmittedDni] = useState<string | null>(null);
  const [submittedRolMesa, setSubmittedRolMesa] =
    useState<RolMesaResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captchaRequired = turnstileConfigured();
  const fieldLabels = {
    nombres: labels?.nombres ?? "Nombres",
    apellidos: labels?.apellidos ?? "Apellidos",
    dni: labels?.dni ?? "DNI",
    telefono: labels?.telefono ?? "Celular",
    email: labels?.email ?? "Correo electrónico",
  };
  const fieldPlaceholders = {
    nombres: placeholders?.nombres ?? "María Elena",
    apellidos: placeholders?.apellidos ?? "Quispe Rojas",
    dni: placeholders?.dni ?? "12345678",
    telefono: placeholders?.telefono ?? "999 888 777",
    email: placeholders?.email ?? "tu@correo.com",
  };

  function resetCaptcha() {
    setCaptchaToken(null);
    setCaptchaNonce((n) => n + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const nombres = readTrimmed(form, "nombres");
    const apellidos = readTrimmed(form, "apellidos");
    const dni = readTrimmed(form, "dni");
    const telefono = readTrimmed(form, "telefono");
    const email = readTrimmed(form, "email").toLowerCase();

    // Validación de cliente (el servidor revalida igualmente).
    if (nombres.length < 2) return setError("Ingresa tus nombres.");
    if (apellidos.length < 2) return setError("Ingresa tus apellidos.");
    if (!/^\d{8}$/.test(dni)) return setError("El DNI debe tener 8 dígitos.");
    if (telefono.replace(/\D/g, "").length < 9)
      return setError("Ingresa un celular válido (9 dígitos).");
    if (!EMAIL_RE.test(email)) return setError("Ingresa un correo válido.");
    if (!consentimiento)
      return setError("Debes aceptar el tratamiento de tus datos para continuar.");
    if (captchaRequired && !captchaToken)
      return setError("Completa la verificación anti-robot.");

    setSubmitting(true);
    try {
      const response = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombres,
          apellidos,
          dni,
          telefono,
          email,
          origen,
          consentimiento,
          turnstileToken: captchaToken,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        mesa?: MesaResult | null;
        rol_mesa?: RolMesaResult;
      };

      if (!response.ok || !payload.ok) {
        resetCaptcha();
        setError(
          payload.error ?? "No pudimos guardar tu inscripción. Intenta de nuevo.",
        );
        return;
      }

      if (successHref) {
        const draft: RegistroExitoDraft = {
          nombres,
          apellidos,
          dni,
          telefono,
          numero_mesa: payload.mesa?.numero_mesa ?? null,
          centro_votacion: payload.mesa?.centro_votacion ?? null,
          distrito: payload.mesa?.distrito ?? null,
          rol_mesa: payload.rol_mesa ?? "titular",
        };
        try {
          sessionStorage.setItem(
            REGISTRO_EXITO_STORAGE_KEY,
            JSON.stringify(draft),
          );
        } catch {
          // private mode / quota — la URL de listo lleva respaldo de mesa
        }
        router.push(`${successHref}${registroExitoQuery(draft)}`);
        return;
      }

      setSubmittedDni(dni);
      setSubmittedMesa(payload.mesa ?? null);
      setSubmittedRolMesa(payload.rol_mesa ?? "titular");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      resetCaptcha();
      setError("No pudimos guardar tu inscripción. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    const mesa = submittedMesa?.numero_mesa?.trim();
    const esSuplente = submittedRolMesa === "suplente";
    return (
      <div className="dl-panel mx-auto max-w-md px-6 py-10 text-center">
        <p className="dl-kicker">Inscripción recibida</p>
        <h2 className="dl-title mt-3 text-2xl">Gracias por unirte</h2>
        {esSuplente ? (
          <p className="mx-auto mt-3 text-sm leading-relaxed text-muted">
            Su mesa ya tiene personero titular. Quedó en la{" "}
            <strong>lista de suplentes</strong>. Lo contactaremos con una nueva
            mesa en el mismo centro de votación
            {submittedMesa?.centro_votacion
              ? ` (${submittedMesa.centro_votacion})`
              : ""}
            .
          </p>
        ) : mesa ? (
          <p className="mx-auto mt-3 text-sm leading-relaxed text-muted">
            Usted es personero de la mesa{" "}
            <strong className="font-[family-name:var(--font-data)] text-[#1077A1]">
              {mesa}
            </strong>
            {submittedDni ? (
              <>
                {" "}
                · DNI{" "}
                <strong className="font-[family-name:var(--font-data)]">
                  {submittedDni}
                </strong>
              </>
            ) : null}
            .
          </p>
        ) : (
          <p className="mx-auto mt-3 text-sm leading-relaxed text-muted">
            Su mesa será asignada en breve. Recibirá un mensaje con ella.
          </p>
        )}
        <p className="mx-auto mt-3 text-sm leading-relaxed text-muted">
          Mientras tanto, espere a que <strong>Rafael López Aliaga</strong> se
          comunique con usted.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link className="dl-btn dl-btn-primary" href={homeHref}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {submitting ? <MesaLoadingOverlay /> : null}
      <form
        className="mx-auto w-full max-w-md space-y-5"
        noValidate
        onSubmit={handleSubmit}
      >
        <div>
          <label className="dl-label" htmlFor="nombres">
            {fieldLabels.nombres}
          </label>
          <input
            autoComplete="given-name"
            className="dl-input"
            disabled={submitting}
            id="nombres"
            name="nombres"
            placeholder={fieldPlaceholders.nombres}
            required
            type="text"
          />
        </div>

        <div>
          <label className="dl-label" htmlFor="apellidos">
            {fieldLabels.apellidos}
          </label>
          <input
            autoComplete="family-name"
            className="dl-input"
            disabled={submitting}
            id="apellidos"
            name="apellidos"
            placeholder={fieldPlaceholders.apellidos}
            required
            type="text"
          />
        </div>

        <div>
          <label className="dl-label" htmlFor="dni">
            {fieldLabels.dni}
          </label>
          <input
            autoComplete="off"
            className="dl-input font-[family-name:var(--font-data)]"
            disabled={submitting}
            id="dni"
            inputMode="numeric"
            maxLength={8}
            minLength={8}
            name="dni"
            pattern="[0-9]{8}"
            placeholder={fieldPlaceholders.dni}
            required
            type="text"
          />
        </div>

        <div>
          <label className="dl-label" htmlFor="telefono">
            {fieldLabels.telefono}
          </label>
          <input
            autoComplete="tel"
            className="dl-input font-[family-name:var(--font-data)]"
            disabled={submitting}
            id="telefono"
            inputMode="tel"
            name="telefono"
            placeholder={fieldPlaceholders.telefono}
            required
            type="tel"
          />
        </div>

        <div>
          <label className="dl-label" htmlFor="email">
            {fieldLabels.email}
          </label>
          <input
            autoComplete="email"
            className="dl-input"
            disabled={submitting}
            id="email"
            name="email"
            placeholder={fieldPlaceholders.email}
            required
            type="email"
          />
        </div>

        <label className="flex items-start gap-3 text-xs leading-relaxed text-zinc-500">
          <input
            checked={consentimiento}
            className="mt-0.5 h-4 w-4 shrink-0"
            disabled={submitting}
            onChange={(event) => setConsentimiento(event.target.checked)}
            type="checkbox"
          />
          <span>
            Acepto el tratamiento de mis datos personales para esta iniciativa
            ciudadana —capacitación, asignación y contacto— conforme a la{" "}
            <Link
              className="underline underline-offset-2"
              href="/privacidad"
              target="_blank"
            >
              política de privacidad
            </Link>
            . Puedo ejercer mis derechos (acceso, rectificación, cancelación,
            oposición) cuando lo desee.
          </span>
        </label>

        {captchaRequired ? (
          <Turnstile key={captchaNonce} onToken={setCaptchaToken} />
        ) : null}

        {error ? (
          <p
            className="rounded-[var(--radius-md)] border border-danger-500/40 bg-danger-100/40 px-4 py-3 text-sm text-danger-500"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          className="dl-btn dl-btn-primary w-full"
          disabled={
            submitting ||
            !consentimiento ||
            (captchaRequired && !captchaToken)
          }
          type="submit"
        >
          {submitting ? ctaPendingLabel : ctaLabel}
          {!submitting ? <Chevron /> : null}
        </button>

        {footerNote ? (
          <p className="text-center text-xs leading-relaxed text-muted">
            {footerNote}
          </p>
        ) : null}
      </form>
    </>
  );
}
