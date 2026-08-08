"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Chevron } from "@/components/icons/chevron";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  ParticipacionRol,
  RegistroOrigen,
} from "@/lib/supabase/database.types";
import {
  PROVINCIAS_POR_REGION,
  REGIONES,
  distritosDe,
} from "@/lib/ubicacion";

const DEFAULT_ROLE: ParticipacionRol = "personero";

type RegistroFormProps = {
  origen?: RegistroOrigen;
  homeHref?: string;
};

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
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provincias = useMemo(
    () => (region ? (PROVINCIAS_POR_REGION[region] ?? []) : []),
    [region],
  );
  const distritos = useMemo(
    () => (region && provincia ? distritosDe(region, provincia) : []),
    [region, provincia],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const experiencia =
      experienciaPersonero === "si"
        ? true
        : experienciaPersonero === "no"
          ? false
          : null;
    const afiliado =
      !isRp
        ? null
        : afiliadoRp === "si"
          ? true
          : afiliadoRp === "no"
            ? false
            : null;

    if (experiencia === null) {
      setError("Indica si tienes experiencia previa como personero.");
      setSubmitting(false);
      return;
    }

    if (isRp && afiliado === null) {
      setError("Indica si eres afiliado a Renovación Popular.");
      setSubmitting(false);
      return;
    }

    const payload = {
      rol: DEFAULT_ROLE,
      nombres: readTrimmed(form, "nombres"),
      apellidos: readTrimmed(form, "apellidos"),
      dni: readTrimmed(form, "dni"),
      telefono: readTrimmed(form, "telefono"),
      email: readTrimmed(form, "email").toLowerCase(),
      region: readTrimmed(form, "region"),
      provincia: readTrimmed(form, "provincia"),
      distrito: readTrimmed(form, "distrito"),
      afiliado_rp: afiliado,
      experiencia_personero: experiencia,
      centro_votacion: null,
      numero_mesa: null,
      origen,
    };

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: insertError } = await supabase
        .from("registros")
        .insert(payload);

      if (insertError) {
        if (insertError.code === "23505") {
          setError("Este DNI ya está registrado.");
        } else if (insertError.message.includes("NEXT_PUBLIC_SUPABASE")) {
          setError(
            "Falta configurar Supabase. Revisa front_end/.env.local (ver .env.local.example).",
          );
        } else {
          setError("No pudimos guardar tu inscripción. Intenta de nuevo.");
          console.error(insertError);
        }
        return;
      }

      setSubmitted(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al registrar.";
      setError(
        message.includes("NEXT_PUBLIC_SUPABASE")
          ? "Falta configurar Supabase. Revisa front_end/.env.local (ver .env.local.example)."
          : "No pudimos guardar tu inscripción. Intenta de nuevo.",
      );
      console.error(err);
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
          Revisaremos tu registro y te contactaremos con los siguientes pasos
          de capacitación.
        </p>
        <Link className="dl-btn dl-btn-primary mt-8" href={homeHref}>
          Volver al inicio
        </Link>
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

      <p className="text-xs leading-relaxed text-zinc-500">
        Al registrarte aceptas ser contactado para capacitación y asignación.
        Tus datos se usarán solo para esta iniciativa ciudadana.
      </p>

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
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Enviando…" : "Confirmar inscripción"}
        {!submitting ? <Chevron /> : null}
      </button>
    </form>
  );
}
