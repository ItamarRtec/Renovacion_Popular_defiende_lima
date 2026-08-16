import Link from "next/link";
import { getActaReport } from "@/lib/admin-reports";
import { requireAdminDb } from "@/lib/admin-session";

function formatNum(n: number) {
  return n.toLocaleString("es-PE");
}

function formatHora(iso: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function AdminActasPage() {
  const { supabase } = await requireAdminDb();
  const report = await getActaReport(supabase);

  return (
    <section className="mx-auto max-w-5xl">
      <p className="dl-kicker">Administración</p>
      <h1 className="dl-title mt-3 text-3xl">Actas</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Quién ya subió la foto del acta y quién todavía no.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="dl-panel px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-muted">
            Con acta
          </p>
          <p className="mt-1 text-3xl font-medium tabular-nums text-[#1077A1]">
            {formatNum(report.conActa)}
          </p>
        </div>
        <div className="dl-panel px-4 py-4">
          <p className="text-xs uppercase tracking-wider text-muted">
            Sin acta
          </p>
          <p className="mt-1 text-3xl font-medium tabular-nums text-[#c2410c]">
            {formatNum(report.sinActa)}
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
        <h2 className="dl-title text-xl">Sin acta</h2>
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] border border-border">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-border bg-[var(--surface-muted)] text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Mesa</th>
                <th className="px-4 py-3 font-medium">Distrito</th>
              </tr>
            </thead>
            <tbody>
              {report.rowsSinActa.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted" colSpan={4}>
                    Todos subieron acta.
                  </td>
                </tr>
              ) : (
                report.rowsSinActa.map((p) => (
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
                    <td className="px-4 py-3 text-muted">
                      {p.distrito ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="dl-title text-xl">Con acta</h2>
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] border border-border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border bg-[var(--surface-muted)] text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Mesa</th>
                <th className="px-4 py-3 font-medium">Subida</th>
              </tr>
            </thead>
            <tbody>
              {report.rowsConActa.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted" colSpan={4}>
                    Todavía no hay actas.
                  </td>
                </tr>
              ) : (
                report.rowsConActa.map((p) => (
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
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {p.actaAt ? formatHora(p.actaAt) : "—"}
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
