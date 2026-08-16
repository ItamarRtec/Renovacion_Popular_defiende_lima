"use client";

import { useState } from "react";
import { parsePromoteCsv } from "@/lib/promote-csv";
import { labelRol, ROLES_PROMOCION } from "@/lib/roles";
import type { PlataformaRol } from "@/lib/supabase/database.types";

type RegistroPromo = {
  nombres: string;
  apellidos: string;
  dni: string;
  plataforma_rol: PlataformaRol;
};

type FilaResultado = {
  dni: string;
  ok: boolean;
  message: string;
  registro?: RegistroPromo;
};

type PromoteResult = {
  ok?: boolean;
  message?: string;
  error?: string;
  registro?: RegistroPromo;
  resultados?: FilaResultado[];
};

export function PromoteForm() {
  const [secret, setSecret] = useState("");
  const [dni, setDni] = useState("");
  const [rol, setRol] = useState<PlataformaRol>("coordinador_local");
  const [fileName, setFileName] = useState<string | null>(null);
  const [filas, setFilas] = useState<{ dni: string; rol: string | null }[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"uno" | "csv" | null>(null);
  const [result, setResult] = useState<PromoteResult | null>(null);

  async function promote(body: Record<string, unknown>) {
    const res = await fetch("/api/ops/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as PromoteResult;
    if (!res.ok) {
      setResult({ error: data.error ?? "No se pudo completar." });
      return;
    }
    setResult(data);
  }

  async function onSubmitUno(e: React.FormEvent) {
    e.preventDefault();
    setBusy("uno");
    setResult(null);
    try {
      await promote({ secret, dni: dni.trim(), rol });
    } catch {
      setResult({ error: "Error de red. Intenta de nuevo." });
    } finally {
      setBusy(null);
    }
  }

  async function onSubmitCsv(e: React.FormEvent) {
    e.preventDefault();
    if (filas.length === 0) {
      setCsvError("Elige un CSV con DNI.");
      return;
    }
    setBusy("csv");
    setResult(null);
    try {
      await promote({ secret, rol, filas });
    } catch {
      setResult({ error: "Error de red. Intenta de nuevo." });
    } finally {
      setBusy(null);
    }
  }

  function onFile(file: File | undefined) {
    setCsvError(null);
    setFilas([]);
    setFileName(null);
    if (!file) return;
    void file.text().then((text) => {
      const parsed = parsePromoteCsv(text);
      if (parsed.length === 0) {
        setCsvError("El archivo no tiene filas.");
        return;
      }
      setFileName(file.name);
      setFilas(parsed.map((f) => ({ dni: f.dni, rol: f.rol })));
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-10">
      <div className="space-y-5">
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
          <label className="dl-label" htmlFor="ops-rol">
            Rol
          </label>
          <select
            id="ops-rol"
            className="dl-input mt-1.5"
            value={rol}
            onChange={(e) => setRol(e.target.value as PlataformaRol)}
          >
            {ROLES_PROMOCION.map((r) => (
              <option key={r} value={r}>
                {labelRol(r)}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-muted">
            Se usa en el DNI suelto y en el CSV si la fila no trae columna rol.
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={onSubmitUno} autoComplete="off">
        <h2 className="text-lg font-medium text-[#0b2a36]">Un DNI</h2>
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
        <button
          className="dl-btn dl-btn-primary w-full"
          type="submit"
          disabled={busy !== null || !secret}
        >
          {busy === "uno" ? "Guardando…" : "Actualizar rol"}
        </button>
      </form>

      <form className="space-y-5" onSubmit={onSubmitCsv} autoComplete="off">
        <h2 className="text-lg font-medium text-[#0b2a36]">CSV de DNI</h2>
        <p className="text-sm text-muted">
          Una columna <code>dni</code>. Opcional: <code>rol</code> por fila
          (personero, coordinador_local, coordinador_distrital). Máximo 400.
        </p>
        <div>
          <label className="dl-label" htmlFor="ops-csv">
            Archivo
          </label>
          <input
            id="ops-csv"
            className="dl-input mt-1.5"
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {fileName ? (
            <p className="mt-2 text-sm text-[#0b2a36]">
              {fileName} · {filas.length} filas
            </p>
          ) : null}
          {csvError ? (
            <p className="mt-2 text-sm text-[var(--dl-danger-500)]" role="alert">
              {csvError}
            </p>
          ) : null}
        </div>
        <button
          className="dl-btn dl-btn-primary w-full"
          type="submit"
          disabled={busy !== null || !secret || filas.length === 0}
        >
          {busy === "csv" ? "Actualizando…" : "Actualizar desde CSV"}
        </button>
      </form>

      {result?.error ? (
        <p className="text-sm text-[var(--dl-danger-500)]" role="alert">
          {result.error}
        </p>
      ) : null}

      {result?.ok && result.registro && !result.resultados ? (
        <div className="rounded-lg border border-[rgb(16_119_161_/_0.2)] bg-[rgb(16_119_161_/_0.06)] px-4 py-3 text-sm">
          <p className="font-medium text-[#01698A]">{result.message}</p>
          <p className="mt-1 text-[#0b2a36]">
            {result.registro.nombres} {result.registro.apellidos} · DNI{" "}
            {result.registro.dni}
          </p>
          <p className="mt-0.5 text-muted">
            Rol: {labelRol(result.registro.plataforma_rol)}
          </p>
        </div>
      ) : null}

      {result?.resultados ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#0b2a36]">{result.message}</p>
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="border-b border-border bg-[var(--surface-muted)] text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">DNI</th>
                  <th className="px-3 py-2 font-medium">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {result.resultados.map((fila, i) => (
                  <tr
                    key={`${fila.dni}-${i}`}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-2 tabular-nums">{fila.dni}</td>
                    <td
                      className={
                        fila.ok
                          ? "px-3 py-2 text-[#01698A]"
                          : "px-3 py-2 text-[var(--dl-danger-500)]"
                      }
                    >
                      {fila.message}
                      {fila.registro
                        ? ` · ${fila.registro.nombres} ${fila.registro.apellidos}`
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
