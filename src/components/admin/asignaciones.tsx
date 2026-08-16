"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Personero = {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  distrito: string | null;
  provincia: string | null;
  coordinador_id: string | null;
};

type Coordinador = {
  id: string;
  nombres: string;
  apellidos: string;
  distrito: string | null;
  provincia: string | null;
};

export function AdminAsignaciones({
  personeros,
  coordinadores,
}: {
  personeros: Personero[];
  coordinadores: Coordinador[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return personeros;
    return personeros.filter(
      (p) =>
        p.dni.includes(q) ||
        p.nombres.toLowerCase().includes(q) ||
        p.apellidos.toLowerCase().includes(q) ||
        (p.distrito?.toLowerCase().includes(q) ?? false),
    );
  }, [filter, personeros]);

  async function assign(personeroId: string, coordinadorId: string) {
    setError(null);
    setBusyId(personeroId);
    try {
      const res = await fetch("/api/admin/asignaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personeroId,
          coordinadorId: coordinadorId === "" ? null : coordinadorId,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la asignación.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la asignación.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <input
        className="dl-input max-w-md"
        placeholder="Buscar por nombre, DNI o distrito…"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />

      {error ? (
        <p className="text-sm text-[var(--dl-danger-500)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-border bg-[var(--surface-muted)] text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Personero</th>
              <th className="px-4 py-3 font-medium">Territorio</th>
              <th className="px-4 py-3 font-medium">Coordinador manual</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {p.apellidos}, {p.nombres}
                  </p>
                  <p className="text-xs tabular-nums text-muted">{p.dni}</p>
                </td>
                <td className="px-4 py-3 text-muted">
                  {p.distrito && p.provincia
                    ? `${p.distrito}, ${p.provincia}`
                    : "Sin ubicación"}
                </td>
                <td className="px-4 py-3">
                  <select
                    className="dl-input py-2"
                    disabled={busyId === p.id}
                    value={p.coordinador_id ?? ""}
                    onChange={(event) => assign(p.id, event.target.value)}
                  >
                    <option value="">Solo territorio</option>
                    {coordinadores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.apellidos}, {c.nombres}
                        {c.distrito ? ` — ${c.distrito}` : ""}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
