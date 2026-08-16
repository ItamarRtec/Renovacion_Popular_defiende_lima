"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeNextPath } from "@/lib/auth-paths";
import { Turnstile, turnstileConfigured } from "@/components/turnstile";

export function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const [clave, setClave] = useState("");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captchaRequired = turnstileConfigured();

  function resetCaptcha() {
    setCaptchaToken(null);
    setCaptchaNonce((n) => n + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
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
      };

      if (!response.ok || !payload.ok) {
        resetCaptcha();
        setError(payload.error ?? "No pudimos iniciar sesión.");
        return;
      }

      const destino = next ?? payload.redirect ?? "/plataforma";
      router.replace(destino);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No pudimos procesar el acceso. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const disabled =
    submitting ||
    email.trim().length < 5 ||
    clave.length !== 8 ||
    (captchaRequired && !captchaToken);

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
          Personeros y coordinadores: tu correo y tu DNI.
        </p>
      </div>

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

      {error ? (
        <p className="text-sm text-[var(--dl-danger-500)]" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="dl-btn dl-btn-primary w-full"
        disabled={disabled}
        type="submit"
      >
        {submitting ? "Procesando…" : "Entrar"}
      </button>

      <p className="text-center text-sm text-muted">
        ¿Aún no te inscribiste?{" "}
        <Link className="underline underline-offset-4" href="/unirme">
          Regístrate con Renovación Popular
        </Link>
      </p>
    </form>
  );
}
