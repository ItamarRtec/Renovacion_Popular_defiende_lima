import Link from "next/link";
import { getCapacitacionReport } from "@/lib/admin-reports";
import { requireAdminDb } from "@/lib/admin-session";

function formatNum(n: number) {
  return n.toLocaleString("es-PE");
}

export default async function AdminCapacitacionPage() {
  const { supabase } = await requireAdminDb();
  const report = await getCapacitacionReport(supabase);

  return (
    <section className="mx-auto max-w-5xl">
      <p className="dl-kicker">Administración</p>
      <h1 className="dl-title mt-3 text-3xl">Capacitación</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Quién completó los {formatNum(report.totalVideos)} videos activos y
        quién aún no.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="dl-panel px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-muted">
            Completaron
          </p>
          <p className="mt-1 text-3xl font-medium tabular-nums text-[#1077A1]">
            {formatNum(report.completaron)}
          </p>
        </div>
        <div className="dl-panel px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-muted">
            Pendientes
          </p>
          <p className="mt-1 text-3xl font-medium tabular-nums text-[#c2410c]">
            {formatNum(report.pendientes)}
          </p>
        </div>
        <div className="dl-panel px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-muted">
            Personeros
          </p>
          <p className="mt-1 text-3xl font-medium tabular-nums">
            {formatNum(report.totalPersoneros)}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="dl-title text-xl">Pendientes de completar</h2>
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] border border-border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border bg-[var(--surface-muted)] text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Mesa</th>
                <th className="px-4 py-3 font-medium">Videos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {report.rowsPendientes.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted" colSpan={5}>
                    Todos completaron la capacitación.
                  </td>
                </tr>
              ) : (
                report.rowsPendientes.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 hover:bg-[var(--surface-muted)]"
                  >
                    <td className="px-4 py-3 font-medium text-[#0b2a36]">
                      <Link
                        className="text-[#1077A1] hover:underline"
                        href={`/coordinacion/personeros/${p.id}`}
                      >
                        {p.apellidos}, {p.nombres}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {p.dni}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {p.numero_mesa ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {p.vistos}/{p.totalVideos}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted">
                      {p.estado}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="dl-title text-xl">Completaron</h2>
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] border border-border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border bg-[var(--surface-muted)] text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Mesa</th>
                <th className="px-4 py-3 font-medium">Videos</th>
              </tr>
            </thead>
            <tbody>
              {report.rowsCompletos.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted" colSpan={4}>
                    Nadie ha completado aún.
                  </td>
                </tr>
              ) : (
                report.rowsCompletos.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 hover:bg-[var(--surface-muted)]"
                  >
                    <td className="px-4 py-3 font-medium text-[#0b2a36]">
                      {p.apellidos}, {p.nombres}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {p.dni}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {p.numero_mesa ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[#1077A1]">
                      {p.vistos}/{p.totalVideos}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
