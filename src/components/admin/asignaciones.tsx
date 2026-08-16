"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Asignable = {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  distrito: string | null;
  provincia: string | null;
  coordinador_id: string | null;
};

type Superior = {
  id: string;
  nombres: string;
  apellidos: string;
  distrito: string | null;
  provincia: string | null;
};

function AssignmentTable({
  rows,
  superiors,
  emptyLabel,
  superiorLabel,
  subjectLabel,
}: {
  rows: Asignable[];
  superiors: Superior[];
  emptyLabel: string;
  superiorLabel: string;
  subjectLabel: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (p) =>
        p.dni.includes(q) ||
        p.nombres.toLowerCase().includes(q) ||
        p.apellidos.toLowerCase().includes(q) ||
        (p.distrito?.toLowerCase().includes(q) ?? false),
    );
  }, [filter, rows]);

  async function assign(registroId: string, coordinadorId: string) {
    setError(null);
    setBusyId(registroId);
    try {
      const res = await fetch("/api/admin/asignaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registroId,
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
              <th className="px-4 py-3 font-medium">{subjectLabel}</th>
              <th className="px-4 py-3 font-medium">Territorio</th>
              <th className="px-4 py-3 font-medium">{superiorLabel}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={3}>
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
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
                      <option value="">{emptyLabel}</option>
                      {superiors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.apellidos}, {c.nombres}
                          {c.distrito ? ` — ${c.distrito}` : ""}
                        </option>
                      ))}
                    </select>
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

export function AdminAsignaciones({
  personeros,
  coordinadoresLocales,
  coordinadoresDistritales,
}: {
  personeros: Asignable[];
  coordinadoresLocales: Asignable[];
  coordinadoresDistritales: Superior[];
}) {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="dl-title text-xl">Personero → coordinador de local</h2>
        <p className="mt-2 text-sm text-muted">
          Elige un coordinador de local para que ese personero quede en su
          equipo. Si dejas “Sin coordinador”, lo ve cualquier CL del mismo
          distrito (acá: Chorrillos, Lima). Hasta 15 personeros por local.
        </p>
        <div className="mt-5">
          <AssignmentTable
            rows={personeros}
            superiors={coordinadoresLocales}
            subjectLabel="Personero"
            superiorLabel="Coordinador de local"
            emptyLabel="Sin coordinador (lo ve el CL de su distrito)"
          />
        </div>
      </div>

      <div>
        <h2 className="dl-title text-xl">
          Coordinador de local → coordinador de distrito
        </h2>
        <p className="mt-2 text-sm text-muted">
          Hasta 45 coordinadores de local por distrito.
        </p>
        <div className="mt-5">
          <AssignmentTable
            rows={coordinadoresLocales}
            superiors={coordinadoresDistritales}
            subjectLabel="Coordinador de local"
            superiorLabel="Coordinador de distrito"
            emptyLabel="Sin distrito asignado"
          />
        </div>
      </div>
    </div>
  );
}
