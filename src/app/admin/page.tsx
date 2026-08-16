import Link from "next/link";
import { CredencialesToggle } from "@/components/admin/credenciales-toggle";
import { getAdminBalanceStats } from "@/lib/admin-stats";
import {
  getAdminControlCenter,
  type ControlFlagRow,
} from "@/lib/admin-ops";
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

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "alert";
}) {
  const valueClass =
    tone === "alert"
      ? "mt-1 text-3xl font-medium tabular-nums text-[#c2410c]"
      : tone === "warn"
        ? "mt-1 text-3xl font-medium tabular-nums text-[#a16207]"
        : tone === "ok"
          ? "mt-1 text-3xl font-medium tabular-nums text-[#1077A1]"
          : "mt-1 text-3xl font-medium tabular-nums text-[#0b2a36]";

  return (
    <div className="dl-panel px-4 py-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={valueClass}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function FlagTable({
  rows,
  empty,
  showLlegada,
}: {
  rows: ControlFlagRow[];
  empty: string;
  showLlegada?: boolean;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] border border-border">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-border bg-[var(--surface-muted)] text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">DNI</th>
            <th className="px-4 py-3 font-medium">Mesa</th>
            <th className="px-4 py-3 font-medium">Distrito</th>
            {showLlegada ? (
              <th className="px-4 py-3 font-medium">Llegada</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                className="px-4 py-8 text-center text-muted"
                colSpan={showLlegada ? 5 : 4}
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.slice(0, 40).map((p) => (
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
                <td className="px-4 py-3 text-muted">{p.distrito ?? "—"}</td>
                {showLlegada ? (
                  <td className="px-4 py-3 tabular-nums text-muted">
                    {p.llegada_at ? formatHora(p.llegada_at) : "—"}
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {rows.length > 40 ? (
        <p className="border-t border-border px-4 py-2 text-xs text-muted">
          Mostrando 40 de {formatNum(rows.length)}.
        </p>
      ) : null}
    </div>
  );
}

export default async function AdminPage() {
  const { supabase } = await requireAdminDb();
  const [ops, stats, flags] = await Promise.all([
    getAdminControlCenter(supabase),
    getAdminBalanceStats(supabase),
    supabase
      .from("plataforma_flags")
      .select("credenciales_visibles")
      .eq("id", 1)
      .maybeSingle(),
  ]);
  const credencialesVisibles = flags.data?.credenciales_visibles ?? false;

  const cobertura =
    ops.personerosTitulares - ops.sinMesa > 0
      ? Math.round(
          (ops.presentes / (ops.personerosTitulares - ops.sinMesa)) * 100,
        )
      : 0;

  return (
    <section className="mx-auto max-w-5xl">
      <p className="dl-kicker">Administración · solo local</p>
      <h1 className="dl-title mt-3 text-3xl">Centro de control</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Banderas en vivo: quién ya llegó al local (QR/manual) y qué mesas
        faltan. Los coordinadores escanean en campo; tú ves el tablero
        {ops.eventoNombre ? ` del evento “${ops.eventoNombre}”` : ""}.
      </p>

      <CredencialesToggle visible={credencialesVisibles} />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sin check-in"
          value={formatNum(ops.sinCheckIn)}
          hint="Titulares con mesa que aún no llegan"
          tone={ops.sinCheckIn > 0 ? "alert" : "ok"}
        />
        <StatCard
          label="En el local"
          value={formatNum(ops.presentes)}
          hint={
            ops.personerosTitulares - ops.sinMesa > 0
              ? `${cobertura}% de mesas asignadas`
              : "Check-ins registrados"
          }
          tone="ok"
        />
        <StatCard
          label="Sin mesa"
          value={formatNum(ops.sinMesa)}
          hint="Personeros sin número ONPE"
          tone={ops.sinMesa > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Presentes sin acta"
          value={formatNum(ops.presentesSinActa)}
          hint="Llegaron, falta foto del acta"
          tone={ops.presentesSinActa > 0 ? "warn" : "default"}
        />
      </div>

      <div className="mt-10">
        <h2 className="dl-title text-xl">Bandera · mesas sin check-in</h2>
        <p className="mt-2 text-sm text-muted">
          Prioridad del día D: titular con mesa asignada que el coordinador aún
          no escaneó.
        </p>
        <FlagTable
          rows={ops.flagsSinCheckIn}
          empty="Todas las mesas asignadas ya tienen llegada."
        />
      </div>

      <div className="mt-10">
        <h2 className="dl-title text-xl">Bandera · presentes sin acta</h2>
        <p className="mt-2 text-sm text-muted">
          Ya están en el local; falta evidencia para el pago.
        </p>
        <FlagTable
          rows={ops.flagsPresentesSinActa}
          empty="Nadie en esta categoría."
          showLlegada
        />
      </div>

      {ops.flagsSinMesa.length > 0 ? (
        <div className="mt-10">
          <h2 className="dl-title text-xl">Bandera · sin mesa</h2>
          <p className="mt-2 text-sm text-muted">
            Inscritos aún sin número de mesa ONPE.
          </p>
          <FlagTable
            rows={ops.flagsSinMesa}
            empty="Nadie sin mesa."
          />
        </div>
      ) : null}

      <h2 className="dl-title mt-12 text-xl">Balance de equipo</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Personeros" value={formatNum(stats.personeros)} />
        <StatCard
          label="Coordinadores"
          value={formatNum(stats.coordinadores)}
        />
        <StatCard
          label="Suplentes"
          value={formatNum(stats.suplentesPersoneros)}
        />
        <StatCard
          label="Mesas cubiertas"
          value={formatNum(stats.mesasCubiertas)}
          hint={
            stats.mesasRestantes === null
              ? "Sin ADMIN_MESAS_OBJETIVO"
              : `${formatNum(stats.mesasRestantes)} restantes`
          }
        />
      </div>

      <ul className="mt-10 space-y-3">
        <li>
          <Link
            href="/admin/eventos"
            className="block rounded-lg border border-[rgb(16_119_161_/_0.16)] bg-white px-4 py-3 transition hover:border-[rgb(16_119_161_/_0.35)] hover:bg-[rgb(16_119_161_/_0.04)]"
          >
            <span className="font-medium text-[#0b2a36]">Eventos / ensayo QR</span>
            <span className="mt-0.5 block text-sm text-muted">
              Abre una ventana para que coordinadores prueben el check-in.
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/videos"
            className="block rounded-lg border border-[rgb(16_119_161_/_0.16)] bg-white px-4 py-3 transition hover:border-[rgb(16_119_161_/_0.35)] hover:bg-[rgb(16_119_161_/_0.04)]"
          >
            <span className="font-medium text-[#0b2a36]">Videos</span>
            <span className="mt-0.5 block text-sm text-muted">
              Publica o desactiva videos de capacitación (YouTube).
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/capacitacion"
            className="block rounded-lg border border-[rgb(16_119_161_/_0.16)] bg-white px-4 py-3 transition hover:border-[rgb(16_119_161_/_0.35)] hover:bg-[rgb(16_119_161_/_0.04)]"
          >
            <span className="font-medium text-[#0b2a36]">Capacitación</span>
            <span className="mt-0.5 block text-sm text-muted">
              Quién completó los videos y quién falta.
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/actas"
            className="block rounded-lg border border-[rgb(16_119_161_/_0.16)] bg-white px-4 py-3 transition hover:border-[rgb(16_119_161_/_0.35)] hover:bg-[rgb(16_119_161_/_0.04)]"
          >
            <span className="font-medium text-[#0b2a36]">Actas</span>
            <span className="mt-0.5 block text-sm text-muted">
              Quién subió el acta y quién no.
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/mesas"
            className="block rounded-lg border border-[rgb(16_119_161_/_0.16)] bg-white px-4 py-3 transition hover:border-[rgb(16_119_161_/_0.35)] hover:bg-[rgb(16_119_161_/_0.04)]"
          >
            <span className="font-medium text-[#0b2a36]">Reporte de mesas</span>
            <span className="mt-0.5 block text-sm text-muted">
              Listado completo de personeros.
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/coordinacion/eventos"
            className="block rounded-lg border border-[rgb(16_119_161_/_0.16)] bg-white px-4 py-3 transition hover:border-[rgb(16_119_161_/_0.35)] hover:bg-[rgb(16_119_161_/_0.04)]"
          >
            <span className="font-medium text-[#0b2a36]">
              Escanear asistencia
            </span>
            <span className="mt-0.5 block text-sm text-muted">
              También puedes escanear desde admin (misma sesión).
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
