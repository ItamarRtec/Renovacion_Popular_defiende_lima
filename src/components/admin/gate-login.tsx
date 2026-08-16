"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AdminGateLogin() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ops/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        redirect?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      router.replace(data.redirect ?? "/admin");
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="mx-auto w-full max-w-md space-y-5"
      onSubmit={onSubmit}
      autoComplete="off"
      noValidate
    >
      <div className="text-center">
        <p className="dl-kicker">Administración</p>
        <h1 className="dl-title mt-3 text-3xl">Entrar</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Usuario y contraseña del panel.
        </p>
      </div>

      <div>
        <label className="dl-label" htmlFor="admin-user">
          Usuario
        </label>
        <input
          id="admin-user"
          className="dl-input"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          required
          autoComplete="username"
          placeholder="tu usuario"
        />
      </div>
      <div>
        <label className="dl-label" htmlFor="admin-pass">
          Contraseña
        </label>
        <input
          id="admin-pass"
          className="dl-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>
      {error ? (
        <p className="text-sm text-[#c2410c]" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="dl-btn dl-btn-primary w-full"
        type="submit"
        disabled={busy || user.trim().length < 3 || password.length < 8}
      >
        {busy ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
