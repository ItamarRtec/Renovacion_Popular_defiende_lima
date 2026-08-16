"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  eventoEstaAbierto,
  formatEventoRango,
  pickEventoActivo,
} from "@/lib/eventos";
import type { EventoRow, EventoTipo } from "@/lib/supabase/database.types";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function defaultAbre(): string {
  return toLocalInput(new Date().toISOString());
}

function defaultCierra(hours = 2): string {
  return toLocalInput(new Date(Date.now() + hours * 60 * 60 * 1000).toISOString());
}

type AdminEventosProps = {
  eventos: EventoRow[];
};

export function AdminEventos({ eventos }: AdminEventosProps) {
  const router = useRouter();
  const activo = pickEventoActivo(eventos);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<EventoTipo>("ensayo");
  const [abre, setAbre] = useState(defaultAbre);
  const [cierra, setCierra] = useState(() => defaultCierra(2));
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const n = nombre.trim();
    if (n.length < 2) {
      setError("Ponle un nombre al evento (mín. 2 caracteres).");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: n,
          tipo,
          abre_at: fromLocalInput(abre),
          cierra_at: fromLocalInput(cierra),
          activo: true,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el evento.");
        return;
      }
      setNombre("");
      setTipo("ensayo");
      setAbre(defaultAbre());
      setCierra(defaultCierra(2));
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el evento.");
    } finally {
      setBusy(false);
    }
  }

  async function abrirEnsayoRapido() {
    setError(null);
    setBusy(true);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const stamp = new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(now);
      const res = await fetch("/api/admin/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: `Ensayo QR ${stamp}`,
          tipo: "ensayo",
          abre_at: now.toISOString(),
          cierra_at: end.toISOString(),
          activo: true,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo abrir el ensayo.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo abrir el ensayo.");
    } finally {
      setBusy(false);
    }
  }

  async function patchEvento(
    id: string,
    body: {
      activo?: boolean;
      abre_at?: string | null;
      cierra_at?: string | null;
    },
  ) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/eventos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
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
      setBusyId(null);
    }
  }

  async function removeEvento(id: string) {
    if (!window.confirm("¿Eliminar este evento?")) return;
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/eventos", {
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
      <div
        className={`rounded-[var(--radius-md)] border px-4 py-3 text-sm ${
          activo
            ? "border-[var(--dl-success-500)]/40 text-[var(--dl-success-500)]"
            : "border-border text-muted"
        }`}
      >
        {activo ? (
          <>
            Evento abierto: <strong>{activo.nombre}</strong>
            {" · "}
            {activo.tipo === "ensayo" ? "ensayo QR" : "elección"}
            {" · "}
            {formatEventoRango(activo)}
          </>
        ) : (
          <>
            Ningún evento abierto. Los personeros sí pueden entrar; el QR y el
            check-in se activan cuando abras un ensayo.
          </>
        )}
      </div>

      <button
        className="dl-btn dl-btn-primary"
        disabled={busy}
        type="button"
        onClick={() => void abrirEnsayoRapido()}
      >
        {busy ? "Abriendo…" : "Abrir ensayo QR (2 horas)"}
      </button>

      <form onSubmit={handleCreate} className="dl-panel space-y-4 px-5 py-5">
        <p className="text-xs uppercase tracking-wider text-muted">
          Crear evento
        </p>
        <div>
          <label className="dl-label" htmlFor="evento-nombre">
            Nombre
          </label>
          <input
            id="evento-nombre"
            className="dl-input mt-1"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ensayo QR Comas"
            required
          />
        </div>
        <div>
          <label className="dl-label" htmlFor="evento-tipo">
            Tipo
          </label>
          <select
            id="evento-tipo"
            className="dl-input mt-1"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as EventoTipo)}
          >
            <option value="ensayo">Ensayo (prueba de QR)</option>
            <option value="eleccion">Elección (día D)</option>
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="dl-label" htmlFor="evento-abre">
              Abre
            </label>
            <input
              id="evento-abre"
              className="dl-input mt-1"
              type="datetime-local"
              value={abre}
              onChange={(e) => setAbre(e.target.value)}
            />
          </div>
          <div>
            <label className="dl-label" htmlFor="evento-cierra">
              Cierra
            </label>
            <input
              id="evento-cierra"
              className="dl-input mt-1"
              type="datetime-local"
              value={cierra}
              onChange={(e) => setCierra(e.target.value)}
            />
          </div>
        </div>
        {error ? (
          <p className="text-sm text-[#c2410c]" role="alert">
            {error}
          </p>
        ) : null}
        <button className="dl-btn dl-btn-primary" disabled={busy} type="submit">
          {busy ? "Guardando…" : "Crear evento"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-border bg-[var(--surface-muted)] text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Evento</th>
              <th className="px-4 py-3 font-medium">Horario</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {eventos.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={4}>
                  Aún no hay eventos. Abre un ensayo de 2 horas para probar el
                  QR con coordinadores.
                </td>
              </tr>
            ) : (
              eventos.map((evento) => {
                const abierto = eventoEstaAbierto(evento);
                return (
                  <tr
                    key={evento.id}
                    className="border-b border-border last:border-0 hover:bg-[var(--surface-muted)]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0b2a36]">{evento.nombre}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {evento.tipo === "ensayo" ? "Ensayo QR" : "Elección"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatEventoRango(evento)}
                    </td>
                    <td className="px-4 py-3">
                      {abierto ? (
                        <span className="text-[#1077A1]">Abierto</span>
                      ) : evento.activo ? (
                        <span className="text-muted">Programado / vencido</span>
                      ) : (
                        <span className="text-muted">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {abierto ? (
                          <button
                            type="button"
                            className="text-sm text-[#c2410c] hover:underline disabled:opacity-50"
                            disabled={busyId === evento.id}
                            onClick={() =>
                              void patchEvento(evento.id, {
                                activo: false,
                                cierra_at: new Date().toISOString(),
                              })
                            }
                          >
                            Cerrar ahora
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-sm text-[#1077A1] hover:underline disabled:opacity-50"
                            disabled={busyId === evento.id}
                            onClick={() => {
                              if (evento.activo) {
                                void patchEvento(evento.id, { activo: false });
                                return;
                              }
                              const vencido =
                                evento.cierra_at &&
                                new Date(evento.cierra_at).getTime() < Date.now();
                              if (vencido) {
                                const now = new Date();
                                void patchEvento(evento.id, {
                                  activo: true,
                                  abre_at: now.toISOString(),
                                  cierra_at: new Date(
                                    now.getTime() + 2 * 60 * 60 * 1000,
                                  ).toISOString(),
                                });
                                return;
                              }
                              void patchEvento(evento.id, { activo: true });
                            }}
                          >
                            {evento.activo ? "Desactivar" : "Reabrir"}
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-sm text-[#c2410c] hover:underline disabled:opacity-50"
                          disabled={busyId === evento.id}
                          onClick={() => void removeEvento(evento.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
