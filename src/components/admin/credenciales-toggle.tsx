"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CredencialesToggle({ visible }: { visible: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setVisible(next: boolean) {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/credenciales", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: next }),
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
    <div className="dl-panel mt-8 px-5 py-5">
      <p className="text-xs uppercase tracking-wider text-muted">
        Credenciales
      </p>
      <h2 className="mt-2 text-lg font-medium text-[#0b2a36]">
        Mostrar credencial a personeros
      </h2>
      <p className="mt-2 text-sm text-muted">
        Cuando está activa, los personeros ven y descargan su credencial en la
        plataforma. Mientras esté apagada, el documento no aparece.
      </p>
      <div
        className={`mt-4 rounded-[var(--radius-md)] border px-4 py-3 text-sm ${
          visible
            ? "border-[var(--dl-success-500)]/40 text-[var(--dl-success-500)]"
            : "border-border text-muted"
        }`}
      >
        Estado:{" "}
        <strong>{visible ? "CREDENCIALES VISIBLES" : "CREDENCIALES OCULTAS"}</strong>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {visible ? (
          <button
            className="dl-btn dl-btn-secondary"
            disabled={saving}
            type="button"
            onClick={() => void setVisible(false)}
          >
            {saving ? "Guardando…" : "Ocultar credenciales"}
          </button>
        ) : (
          <button
            className="dl-btn dl-btn-primary"
            disabled={saving}
            type="button"
            onClick={() => void setVisible(true)}
          >
            {saving ? "Guardando…" : "Activar credenciales"}
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