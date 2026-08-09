"use client";

import { useState } from "react";
import type { PlataformaRol } from "@/lib/supabase/database.types";

const ROLES: PlataformaRol[] = ["personero", "coordinador", "administrador"];

type PromoteResult = {
  ok?: boolean;
  message?: string;
  error?: string;
  registro?: {
    nombres: string;
    apellidos: string;
    dni: string;
    plataforma_rol: PlataformaRol;
  };
};

export function PromoteForm() {
  const [secret, setSecret] = useState("");
  const [dni, setDni] = useState("");
  const [rol, setRol] = useState<PlataformaRol>("coordinador");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PromoteResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/ops/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, dni: dni.trim(), rol }),
      });
      const data = (await res.json()) as PromoteResult;
      if (!res.ok) {
        setResult({ error: data.error ?? "No se pudo completar." });
        return;
      }
      setResult(data);
    } catch {
      setResult({ error: "Error de red. Intenta de nuevo." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="mx-auto w-full max-w-md space-y-5"
      onSubmit={onSubmit}
      autoComplete="off"
    >
      <div>
        <label className="dl-label" htmlFor="ops-secret">
          Clave
        </label>
        <input
          id="ops-secret"
          className="dl-input mt-1.5"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          required
          autoComplete="off"
        />
      </div>

      <div>
        <label className="dl-label" htmlFor="ops-dni">
          DNI
        </label>
        <input
          id="ops-dni"
          className="dl-input mt-1.5"
          inputMode="numeric"
          pattern="\d{8}"
          maxLength={8}
          value={dni}
          onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
          required
          placeholder="8 dígitos"
        />
      </div>

      <div>
        <label className="dl-label" htmlFor="ops-rol">
          Rol
        </label>
        <select
          id="ops-rol"
          className="dl-input mt-1.5"
          value={rol}
          onChange={(e) => setRol(e.target.value as PlataformaRol)}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {result?.error ? (
        <p className="text-sm text-[var(--dl-danger-500)]" role="alert">
          {result.error}
        </p>
      ) : null}

      {result?.ok && result.registro ? (
        <div className="rounded-lg border border-[rgb(16_119_161_/_0.2)] bg-[rgb(16_119_161_/_0.06)] px-4 py-3 text-sm">
          <p className="font-medium text-[#01698A]">{result.message}</p>
          <p className="mt-1 text-[#0b2a36]">
            {result.registro.nombres} {result.registro.apellidos} · DNI{" "}
            {result.registro.dni}
          </p>
          <p className="mt-0.5 text-muted">
            Rol: {result.registro.plataforma_rol}
          </p>
        </div>
      ) : null}

      <button
        className="dl-btn dl-btn-primary w-full"
        type="submit"
        disabled={busy}
      >
        {busy ? "Guardando…" : "Actualizar rol"}
      </button>
    </form>
  );
}
