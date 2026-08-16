import Link from "next/link";
import { requireAdminDb } from "@/lib/admin-session";

type Vista = "todos" | "con" | "sin" | "suplentes";

type SearchParams = Promise<{ vista?: string }>;

function hasMesa(numero: string | null | undefined) {
  return Boolean(numero?.trim());
}

function parseVista(raw: string | undefined): Vista {
  if (raw === "con" || raw === "sin" || raw === "suplentes" || raw === "todos") {
    return raw;
  }
  return "todos";
}

export default async function AdminMesasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { vista: vistaRaw } = await searchParams;
  const vista = parseVista(vistaRaw);

  const { supabase } = await requireAdminDb();
  const { data } = await supabase
    .from("registros")
    .select(
      "id, nombres, apellidos, dni, telefono, email, numero_mesa, centro_votacion, distrito, provincia, rol_mesa, origen, created_at",
    )
    .eq("plataforma_rol", "personero")
    .order("created_at", { ascending: false });

  const personeros = data ?? [];
  const conMesa = personeros.filter((p) => hasMesa(p.numero_mesa));
  const sinMesa = personeros.filter((p) => !hasMesa(p.numero_mesa));
  const suplentes = personeros.filter((p) => p.rol_mesa === "suplente");

  const rows =
    vista === "con"
      ? conMesa
      : vista === "sin"
        ? sinMesa
        : vista === "suplentes"
          ? suplentes
          : personeros;

  const tabs: { id: Vista; label: string; count: number }[] = [
    { id: "todos", label: "Todos", count: personeros.length },
    { id: "con", label: "Con mesa", count: conMesa.length },
    { id: "sin", label: "Sin mesa", count: sinMesa.length },
    { id: "suplentes", label: "Suplentes", count: suplentes.length },
  ];

  return (
    <section className="mx-auto max-w-5xl">
      <p className="dl-kicker">Administración</p>
      <h1 className="dl-title mt-3 text-3xl">Reporte de mesas</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Personeros con mesa ONPE asignada y los que aún están pendientes de
        asignación.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        <div className="dl-panel px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-muted">Total</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">
            {personeros.length}
          </p>
        </div>
        <div className="dl-panel px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-muted">
            Con mesa
          </p>
          <p className="mt-1 text-2xl font-medium tabular-nums text-[#1077A1]">
            {conMesa.length}
          </p>
        </div>
        <div className="dl-panel px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-muted">
            Sin mesa
          </p>
          <p className="mt-1 text-2xl font-medium tabular-nums">
            {sinMesa.length}
          </p>
        </div>
        <div className="dl-panel px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-muted">
            Suplentes
          </p>
          <p className="mt-1 text-2xl font-medium tabular-nums">
            {suplentes.length}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = vista === tab.id;
          const href =
            tab.id === "todos" ? "/admin/mesas" : `/admin/mesas?vista=${tab.id}`;
          return (
            <Link
              key={tab.id}
              href={href}
              className={
                active
                  ? "rounded-full bg-[#1077A1] px-3.5 py-1.5 text-sm font-medium text-white"
                  : "rounded-full border border-[rgb(16_119_161_/_0.22)] bg-white px-3.5 py-1.5 text-sm text-[#0b2a36] hover:border-[rgb(16_119_161_/_0.4)]"
              }
            >
              {tab.label}{" "}
              <span className={active ? "opacity-80" : "text-muted"}>
                ({tab.count})
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 overflow-x-auto rounded-[var(--radius-lg)] border border-border">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-border bg-[var(--surface-muted)] text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Mesa</th>
              <th className="px-4 py-3 font-medium">Distrito</th>
              <th className="px-4 py-3 font-medium">Local</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Contacto</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-muted"
                  colSpan={7}
                >
                  No hay personeros en esta vista.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-[var(--surface-muted)]"
                >
                  <td className="px-4 py-3 font-medium text-[#0b2a36]">
                    {p.apellidos}, {p.nombres}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted">{p.dni}</td>
                  <td className="px-4 py-3 font-[family-name:var(--font-data)] tabular-nums text-[#1077A1]">
                    {p.numero_mesa?.trim() || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {p.distrito ?? "—"}
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-3 text-muted">
                    {p.centro_votacion ?? "—"}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted">
                    {p.rol_mesa === "suplente" ? (
                      <span className="text-[#1077A1]">suplente</span>
                    ) : hasMesa(p.numero_mesa) ? (
                      "titular"
                    ) : (
                      "pendiente"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <span className="block tabular-nums">{p.telefono}</span>
                    <span className="block truncate text-xs">{p.email}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
