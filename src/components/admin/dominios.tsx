"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type {
  DominioAccesoRow,
  RegistroOrigen,
} from "@/lib/supabase/database.types";

const ORIGENES: { value: RegistroOrigen; label: string }[] = [
  { value: "renovacion_popular", label: "Renovación Popular" },
  { value: "defiende_lima", label: "Defiende Lima" },
];

const DOMAIN_RE =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

function normalizeDominio(raw: string) {
  let value = raw.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/\/.*$/, "");
  value = value.replace(/:\d+$/, "");
  value = value.replace(/\.$/, "");
  if (value.startsWith("www.")) {
    // keep www if user typed it — they may want both www and apex as separate rows
  }
  return value;
}

function origenLabel(origen: RegistroOrigen) {
  return ORIGENES.find((item) => item.value === origen)?.label ?? origen;
}

export function AdminDominios({ rows }: { rows: DominioAccesoRow[] }) {
  const router = useRouter();
  const [dominio, setDominio] = useState("");
  const [origen, setOrigen] = useState<RegistroOrigen>("renovacion_popular");
  const [notas, setNotas] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalized = normalizeDominio(dominio);
    if (!DOMAIN_RE.test(normalized)) {
      setError(
        "Dominio inválido. Usa solo el host, sin https://. Ej: personeros.renovacionpopular.pe",
      );
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/dominios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dominio: normalized,
          origen,
          notas: notas.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar el dominio.");
        return;
      }

      setDominio("");
      setNotas("");
      setOrigen("renovacion_popular");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el dominio.");
    } finally {
      setBusy(false);
    }
  }

  async function setActivo(id: string, activo: boolean) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/dominios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, activo }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo actualizar el estado.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el estado.");
    } finally {
      setBusyId(null);
    }
  }

  async function setOrigenRow(id: string, next: RegistroOrigen) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/dominios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, origen: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo actualizar la marca.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar la marca.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, host: string) {
    if (!window.confirm(`¿Eliminar el dominio ${host}?`)) return;
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/dominios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo eliminar.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p className="text-sm text-[var(--dl-danger-500)]" role="alert">
          {error}
        </p>
      ) : null}

      <form
        className="rounded-[var(--radius-lg)] border border-border p-5"
        onSubmit={handleCreate}
      >
        <h2 className="text-base font-semibold tracking-tight">
          Agregar dominio
        </h2>
        <p className="mt-1 text-sm text-muted">
          Solo el hostname (sin https:// ni rutas). Ejemplo:{" "}
          <span className="font-[family-name:var(--font-data)]">
            personeros.renovacionpopular.pe
          </span>
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="dl-label" htmlFor="dominio">
              Dominio
            </label>
            <input
              className="dl-input font-[family-name:var(--font-data)]"
              id="dominio"
              name="dominio"
              placeholder="personeros.renovacionpopular.pe"
              required
              value={dominio}
              onChange={(event) => setDominio(event.target.value)}
            />
          </div>

          <div>
            <label className="dl-label" htmlFor="origen">
              Marca / web
            </label>
            <select
              className="dl-input"
              id="origen"
              name="origen"
              value={origen}
              onChange={(event) =>
                setOrigen(event.target.value as RegistroOrigen)
              }
            >
              {ORIGENES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="dl-label" htmlFor="notas">
              Notas (opcional)
            </label>
            <input
              className="dl-input"
              id="notas"
              name="notas"
              placeholder="Producción, staging, redirect…"
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
            />
          </div>
        </div>

        <button
          className="dl-btn dl-btn-primary mt-5"
          disabled={busy}
          type="submit"
        >
          {busy ? "Guardando…" : "Guardar dominio"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-border bg-[var(--surface-muted)] text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Dominio</th>
              <th className="px-4 py-3 font-medium">Marca</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Notas</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-muted" colSpan={5}>
                  Aún no hay dominios. Agrega el primero arriba.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-[family-name:var(--font-data)] font-medium">
                    {row.dominio}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="dl-input py-2"
                      disabled={busyId === row.id}
                      value={row.origen}
                      onChange={(event) =>
                        setOrigenRow(
                          row.id,
                          event.target.value as RegistroOrigen,
                        )
                      }
                    >
                      {ORIGENES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <span className="sr-only">{origenLabel(row.origen)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className={`dl-btn dl-btn-sm ${
                        row.activo ? "dl-btn-primary" : "dl-btn-secondary"
                      }`}
                      disabled={busyId === row.id}
                      type="button"
                      onClick={() => setActivo(row.id, !row.activo)}
                    >
                      {row.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {row.notas?.trim() || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="dl-btn dl-btn-secondary dl-btn-sm"
                      disabled={busyId === row.id}
                      type="button"
                      onClick={() => remove(row.id, row.dominio)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
