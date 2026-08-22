"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DiaDToggle({ activo }: { activo: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setActivo(next: boolean) {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/dia-d", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo actualizar.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dl-panel mt-4 px-5 py-5">
      <p className="text-xs uppercase tracking-wider text-muted">Día D</p>
      <h2 className="mt-2 text-lg font-medium text-[#0b2a36]">
        Ventana del personero
      </h2>
      <p className="mt-2 text-sm text-muted">
        El domingo de elección, actívala. El personero solo ve cuatro botones:
        Mostrar QR, Ver credencial, Acta de instalación y Acta de escrutinio.
      </p>
      <div
        className={`mt-4 rounded-[var(--radius-md)] border px-4 py-3 text-sm ${
          activo
            ? "border-[var(--dl-success-500)]/40 text-[var(--dl-success-500)]"
            : "border-border text-muted"
        }`}
      >
        Estado:{" "}
        <strong>
          {activo ? "VIDEOS OCULTOS · DÍA D" : "CON CAPACITACIÓN"}
        </strong>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {activo ? (
          <button
            className="dl-btn dl-btn-secondary"
            disabled={saving}
            type="button"
            onClick={() => void setActivo(false)}
          >
            {saving ? "Guardando…" : "Mostrar videos otra vez"}
          </button>
        ) : (
          <button
            className="dl-btn dl-btn-primary"
            disabled={saving}
            type="button"
            onClick={() => void setActivo(true)}
          >
            {saving ? "Guardando…" : "Activar ventana día D"}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-3 text-sm text-[var(--dl-danger-500)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
