"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Chevron } from "@/components/icons/chevron";
import { Turnstile, turnstileConfigured } from "@/components/turnstile";
import type { RegistroOrigen } from "@/lib/supabase/database.types";
import {
  PROVINCIAS_POR_REGION,
  REGIONES,
  distritosDe,
} from "@/lib/ubicacion";

type RegistroFormProps = {
  origen?: RegistroOrigen;
  homeHref?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readTrimmed(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export function RegistroForm({
  origen = "defiende_lima",
  homeHref = "/",
}: RegistroFormProps) {
  const isRp = origen === "renovacion_popular";
  const [region, setRegion] = useState("");
  const [provincia, setProvincia] = useState("");
  const [distrito, setDistrito] = useState("");
  const [afiliadoRp, setAfiliadoRp] = useState<"si" | "no" | "">("");
  const [experienciaPersonero, setExperienciaPersonero] = useState<
    "si" | "no" | ""
  >("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captchaRequired = turnstileConfigured();

  const provincias = useMemo(
    () => (region ? (PROVINCIAS_POR_REGION[region] ?? []) : []),
    [region],
  );
  const distritos = useMemo(
    () => (region && provincia ? distritosDe(region, provincia) : []),
    [region, provincia],
  );

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
    const centro_votacion = readTrimmed(form, "centro_votacion");
    const numero_mesa = readTrimmed(form, "numero_mesa");

    const experiencia =
      experienciaPersonero === "si"
        ? true
        : experienciaPersonero === "no"
          ? false
          : null;
    const afiliado = !isRp
      ? null
      : afiliadoRp === "si"
        ? true
        : afiliadoRp === "no"
          ? false
          : null;

    // Validación de cliente (el servidor revalida igualmente).
    if (nombres.length < 2) return setError("Ingresa tus nombres.");
    if (apellidos.length < 2) return setError("Ingresa tus apellidos.");
    if (!/^\d{8}$/.test(dni)) return setError("El DNI debe tener 8 dígitos.");
    if (telefono.replace(/\D/g, "").length < 9)
      return setError("Ingresa un celular válido (9 dígitos).");
    if (!EMAIL_RE.test(email)) return setError("Ingresa un correo válido.");
    if (!region) return setError("Selecciona tu región.");
    if (!provincia) return setError("Selecciona tu provincia.");
    if (!distrito) return setError("Selecciona tu distrito.");
    if (experiencia === null)
      return setError("Indica si tienes experiencia previa como personero.");
    if (isRp && afiliado === null)
      return setError("Indica si eres afiliado a Renovación Popular.");
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
          region,
          provincia,
          distrito,
          afiliado_rp: afiliado,
          experiencia_personero: experiencia,
          centro_votacion,
          numero_mesa,
          origen,
          consentimiento,
          turnstileToken: captchaToken,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        resetCaptcha();
        setError(payload.error ?? "No pudimos guardar tu inscripción. Intenta de nuevo.");
        return;
      }

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
    return (
      <div className="dl-panel mx-auto max-w-md px-6 py-10 text-center">
        <p className="dl-kicker">Inscripción recibida</p>
        <h2 className="dl-title mt-3 text-2xl">Gracias por unirte</h2>
        <p className="mx-auto mt-3 text-sm leading-relaxed text-muted">
          Registramos tus datos. Te contactaremos para la{" "}
          <strong>capacitación</strong> y la <strong>asignación de mesa</strong>.
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
    <form
      className="mx-auto w-full max-w-md space-y-5"
      noValidate
      onSubmit={handleSubmit}
    >
      <div>
        <label className="dl-label" htmlFor="nombres">
          Nombres
        </label>
        <input
          autoComplete="given-name"
          className="dl-input"
          id="nombres"
          name="nombres"
          placeholder="María Elena"
          required
          type="text"
        />
      </div>

      <div>
        <label className="dl-label" htmlFor="apellidos">
          Apellidos
        </label>
        <input
          autoComplete="family-name"
          className="dl-input"
          id="apellidos"
          name="apellidos"
          placeholder="Quispe Rojas"
          required
          type="text"
        />
      </div>

      <div>
        <label className="dl-label" htmlFor="dni">
          DNI
        </label>
        <input
          autoComplete="off"
          className="dl-input font-[family-name:var(--font-data)]"
          id="dni"
          inputMode="numeric"
          maxLength={8}
          minLength={8}
          name="dni"
          pattern="[0-9]{8}"
          placeholder="12345678"
          required
          type="text"
        />
      </div>

      <div>
        <label className="dl-label" htmlFor="telefono">
          Celular
        </label>
        <input
          autoComplete="tel"
          className="dl-input font-[family-name:var(--font-data)]"
          id="telefono"
          inputMode="tel"
          name="telefono"
          placeholder="999 888 777"
          required
          type="tel"
        />
      </div>

      <div>
        <label className="dl-label" htmlFor="email">
          Correo electrónico
        </label>
        <input
          autoComplete="email"
          className="dl-input"
          id="email"
          name="email"
          placeholder="tu@correo.com"
          required
          type="email"
        />
      </div>

      <fieldset className="space-y-4 border-t border-border pt-5">
        <legend className="dl-label mb-1">Ubicación de votación</legend>
        <p className="text-xs leading-relaxed text-zinc-500">
          Nota importante: seleccione el distrito donde apoyará como personero.
        </p>

        <div>
          <label className="dl-label" htmlFor="region">
            Región
          </label>
          <select
            className="dl-input"
            id="region"
            name="region"
            required
            value={region}
            onChange={(event) => {
              const next = event.target.value;
              setRegion(next);
              setProvincia("");
              setDistrito("");
            }}
          >
            <option value="">Selecciona región</option>
            {REGIONES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="dl-label" htmlFor="provincia">
            Provincia
          </label>
          <select
            className="dl-input"
            disabled={!region}
            id="provincia"
            name="provincia"
            required
            value={provincia}
            onChange={(event) => {
              setProvincia(event.target.value);
              setDistrito("");
            }}
          >
            <option value="">Selecciona provincia</option>
            {provincias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="dl-label" htmlFor="distrito">
            Distrito
          </label>
          <select
            className="dl-input"
            disabled={!provincia}
            id="distrito"
            name="distrito"
            required
            value={distrito}
            onChange={(event) => setDistrito(event.target.value)}
          >
            <option value="">Selecciona distrito</option>
            {distritos.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="dl-label" htmlFor="centro_votacion">
            Centro de votación
          </label>
          <input
            autoComplete="off"
            className="dl-input"
            id="centro_votacion"
            name="centro_votacion"
            placeholder="Ej. I.E. 1023 San Martín"
            type="text"
          />
        </div>

        <div>
          <label className="dl-label" htmlFor="numero_mesa">
            Número de mesa
          </label>
          <input
            autoComplete="off"
            className="dl-input font-[family-name:var(--font-data)]"
            id="numero_mesa"
            inputMode="numeric"
            name="numero_mesa"
            placeholder="Ej. 001234"
            type="text"
          />
        </div>
      </fieldset>

      {isRp ? (
        <fieldset className="space-y-3">
          <legend className="dl-label mb-1">
            ¿Es afiliado a Renovación Popular?
          </legend>
          <div className="flex gap-3">
            {(
              [
                ["si", "Sí"],
                ["no", "No"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                aria-pressed={afiliadoRp === value}
                className={`dl-btn flex-1 ${
                  afiliadoRp === value ? "dl-btn-primary" : "dl-btn-secondary"
                }`}
                onClick={() => setAfiliadoRp(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset className="space-y-3">
        <legend className="dl-label mb-1">
          ¿Tiene experiencia previa como personero?
        </legend>
        <div className="flex gap-3">
          {(
            [
              ["si", "Sí"],
              ["no", "No"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              aria-pressed={experienciaPersonero === value}
              className={`dl-btn flex-1 ${
                experienciaPersonero === value
                  ? "dl-btn-primary"
                  : "dl-btn-secondary"
              }`}
              onClick={() => setExperienciaPersonero(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 text-xs leading-relaxed text-zinc-500">
        <input
          checked={consentimiento}
          className="mt-0.5 h-4 w-4 shrink-0"
          onChange={(event) => setConsentimiento(event.target.checked)}
          type="checkbox"
        />
        <span>
          Acepto el tratamiento de mis datos personales (incluida mi afiliación
          política) para esta iniciativa ciudadana —capacitación, asignación y
          contacto— conforme a la{" "}
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
        {submitting ? "Enviando…" : "Confirmar inscripción"}
        {!submitting ? <Chevron /> : null}
      </button>
    </form>
  );
}
