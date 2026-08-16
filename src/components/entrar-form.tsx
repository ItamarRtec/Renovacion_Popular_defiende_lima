"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeNextPath } from "@/lib/auth-paths";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Turnstile, turnstileConfigured } from "@/components/turnstile";

type Mode = "evento" | "seguro";

export function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const [mode, setMode] = useState<Mode>("evento");
  const [dni, setDni] = useState("");
  const [clave, setClave] = useState("");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captchaRequired = turnstileConfigured();

  function resetCaptcha() {
    setCaptchaToken(null);
    setCaptchaNonce((n) => n + 1);
  }
  const [notice, setNotice] = useState<string | null>(null);

  async function submitEvento() {
    const response = await fetch("/api/auth/event-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        clave: clave.trim(),
        turnstileToken: captchaToken,
      }),
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      redirect?: string;
      error?: string;
      requiereSeguro?: boolean;
    };

    if (!response.ok || !payload.ok) {
      // El token de Turnstile es de un solo uso: re-armar el widget.
      resetCaptcha();
      if (payload.requiereSeguro) {
        setMode("seguro");
        setNotice(
          "Tu cuenta usa acceso seguro por enlace. Ingresa tu DNI y correo.",
        );
        setError(null);
        return;
      }
      setError(payload.error ?? "No pudimos iniciar sesión.");
      return;
    }

    const destino = next ?? payload.redirect ?? "/plataforma";
    router.replace(destino);
    router.refresh();
  }

  async function submitSeguro() {
    const dniValue = dni.trim();
    const emailValue = email.trim().toLowerCase();

    const response = await fetch("/api/auth/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dni: dniValue, email: emailValue }),
    });
    const payload = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok) {
      setError(payload.error ?? "No pudimos procesar el acceso.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback${
      next ? `?next=${encodeURIComponent(next)}` : ""
    }`;
    await supabase.auth.signInWithOtp({
      email: emailValue,
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    });
    setSent(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "evento") {
        await submitEvento();
      } else {
        await submitSeguro();
      }
    } catch (err) {
      console.error(err);
      setError("No pudimos procesar el acceso. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 text-center">
        <p className="dl-kicker">Acceso seguro</p>
        <h1 className="dl-title text-3xl">Revisa tu correo</h1>
        <p className="text-sm leading-relaxed text-muted">
          Si tu DNI y correo coinciden con una inscripción, te enviamos un
          enlace de acceso a <strong>{email.trim().toLowerCase()}</strong>.
          Ábrelo desde este dispositivo para entrar.
        </p>
        <button
          className="dl-btn dl-btn-secondary"
          type="button"
          onClick={() => {
            setSent(false);
            setError(null);
          }}
        >
          Volver
        </button>
      </div>
    );
  }

  const eventoDisabled =
    submitting ||
    email.trim().length < 5 ||
    clave.length !== 8 ||
    (captchaRequired && !captchaToken);
  const seguroDisabled =
    submitting || dni.length !== 8 || email.trim().length < 5;

  return (
    <form
      className="mx-auto w-full max-w-md space-y-5"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="text-center">
        <p className="dl-kicker">Plataforma</p>
        <h1 className="dl-title mt-3 text-3xl">Entrar</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {mode === "evento"
            ? "Personeros y coordinadores: tu correo y tu DNI."
            : "Administradores: DNI + correo → enlace seguro."}
        </p>
      </div>

      {notice ? (
        <p className="rounded-[var(--radius-md)] border border-border bg-[var(--surface-muted)] px-4 py-3 text-sm text-muted">
          {notice}
        </p>
      ) : null}

      {mode === "evento" ? (
        <>
          <div>
            <label className="dl-label" htmlFor="email">
              Correo electrónico
            </label>
            <input
              autoComplete="username"
              className="dl-input"
              id="email"
              name="email"
              placeholder="tu@correo.com"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label className="dl-label" htmlFor="clave">
              Clave (tu DNI)
            </label>
            <input
              autoComplete="current-password"
              className="dl-input"
              id="clave"
              inputMode="numeric"
              maxLength={8}
              name="clave"
              pattern="[0-9]{8}"
              placeholder="8 dígitos de tu DNI"
              required
              type="password"
              value={clave}
              onChange={(event) =>
                setClave(event.target.value.replace(/\D/g, "").slice(0, 8))
              }
            />
          </div>
          <Turnstile key={captchaNonce} onToken={setCaptchaToken} />
        </>
      ) : (
        <>
          <div>
            <label className="dl-label" htmlFor="dni">
              DNI
            </label>
            <input
              autoComplete="off"
              className="dl-input"
              id="dni"
              inputMode="numeric"
              maxLength={8}
              name="dni"
              pattern="[0-9]{8}"
              placeholder="12345678"
              required
              value={dni}
              onChange={(event) =>
                setDni(event.target.value.replace(/\D/g, "").slice(0, 8))
              }
            />
          </div>
          <div>
            <label className="dl-label" htmlFor="email-seguro">
              Correo electrónico
            </label>
            <input
              autoComplete="email"
              className="dl-input"
              id="email-seguro"
              name="email"
              placeholder="tu@correo.com"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </>
      )}

      {error ? (
        <p className="text-sm text-[var(--dl-danger-500)]" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="dl-btn dl-btn-primary w-full"
        disabled={mode === "evento" ? eventoDisabled : seguroDisabled}
        type="submit"
      >
        {submitting
          ? "Procesando…"
          : mode === "evento"
            ? "Entrar"
            : "Enviar enlace de acceso"}
      </button>

      <div className="text-center text-sm text-muted">
        {mode === "evento" ? (
          <button
            className="underline underline-offset-4"
            type="button"
            onClick={() => {
              setMode("seguro");
              setError(null);
              setNotice(null);
            }}
          >
            Soy administrador (enlace seguro)
          </button>
        ) : (
          <button
            className="underline underline-offset-4"
            type="button"
            onClick={() => {
              setMode("evento");
              setError(null);
              setNotice(null);
            }}
          >
            Volver al ingreso (correo + DNI)
          </button>
        )}
      </div>

      <p className="text-center text-sm text-muted">
        ¿Aún no te inscribiste?{" "}
        <Link className="underline underline-offset-4" href="/unirme">
          Regístrate con Renovación Popular
        </Link>
      </p>
    </form>
  );
}
