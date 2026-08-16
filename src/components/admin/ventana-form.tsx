"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { VentanaAccesoRow } from "@/lib/supabase/database.types";

/** ISO → valor para <input type="datetime-local"> en hora local. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** valor de datetime-local (hora local) → ISO UTC, o null si vacío. */
function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function VentanaForm({
  initial,
  abiertoAhora,
}: {
  initial: VentanaAccesoRow;
  abiertoAhora: boolean;
}) {
  const router = useRouter();
  const [activa, setActiva] = useState(initial.activa);
  const [abre, setAbre] = useState(toLocalInput(initial.abre_at));
  const [cierra, setCierra] = useState(toLocalInput(initial.cierra_at));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function save(overrides?: { activa?: boolean }) {
    setError(null);
    setOk(false);
    setSaving(true);
    try {
      const nextActiva = overrides?.activa ?? activa;
      const res = await fetch("/api/admin/ventana", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activa: nextActiva,
          abre_at: fromLocalInput(abre),
          cierra_at: fromLocalInput(cierra),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar. Reintenta.");
        return;
      }
      if (overrides?.activa !== undefined) setActiva(overrides.activa);
      setOk(true);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar. Reintenta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div
        className={`rounded-[var(--radius-md)] border px-4 py-3 text-sm ${
          abiertoAhora
            ? "border-[var(--dl-success-500)]/40 text-[var(--dl-success-500)]"
            : "border-danger-500/40 text-danger-500"
        }`}
      >
        Estado actual:{" "}
        <strong>{abiertoAhora ? "ACCESO ABIERTO" : "ACCESO CERRADO"}</strong>
      </div>

      <div className="flex gap-3">
        <button
          className="dl-btn dl-btn-primary"
          disabled={saving}
          type="button"
          onClick={() => save({ activa: true })}
        >
          Abrir acceso ahora
        </button>
        <button
          className="dl-btn dl-btn-secondary"
          disabled={saving}
          type="button"
          onClick={() => save({ activa: false })}
        >
          Cerrar acceso ahora
        </button>
      </div>

      <div className="dl-panel space-y-4 px-5 py-5">
        <p className="text-sm text-muted">
          Opcional: programa una ventana. El acceso queda abierto solo si{" "}
          <em>activa</em> está encendido y la hora actual está dentro del rango.
          Deja un campo vacío para no limitar ese extremo.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input
            checked={activa}
            onChange={(e) => setActiva(e.target.checked)}
            type="checkbox"
          />
          Activa (interruptor maestro)
        </label>

        <div>
          <label className="dl-label" htmlFor="abre">
            Abre
          </label>
          <input
            className="dl-input"
            id="abre"
            type="datetime-local"
            value={abre}
            onChange={(e) => setAbre(e.target.value)}
          />
        </div>

        <div>
          <label className="dl-label" htmlFor="cierra">
            Cierra
          </label>
          <input
            className="dl-input"
            id="cierra"
            type="datetime-local"
            value={cierra}
            onChange={(e) => setCierra(e.target.value)}
          />
        </div>

        <button
          className="dl-btn dl-btn-primary"
          disabled={saving}
          type="button"
          onClick={() => save()}
        >
          {saving ? "Guardando…" : "Guardar ventana"}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-danger-500" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="text-sm text-[var(--dl-success-500)]">Guardado.</p>
      ) : null}
    </div>
  );
}
