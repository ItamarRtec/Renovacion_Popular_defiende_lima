import Link from "next/link";
import { redirect } from "next/navigation";
import { loadTeamOperacion } from "@/lib/coordinacion";
import { credencialesVisibles } from "@/lib/credencial-visible";
import {
  ALERTA_LABEL,
  codigosAlertaDe,
  personeroTieneActa,
  resumenAlertas,
} from "@/lib/personero-alertas";
import { getSessionRegistro } from "@/lib/plataforma";
import { isAdminRole, isCoordinadorDistrital, labelRol } from "@/lib/roles";

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "ok" | "alert";
}) {
  const valueClass =
    tone === "alert"
      ? "mt-2 text-3xl font-medium tabular-nums text-[#ef4444]"
      : tone === "ok"
        ? "mt-2 text-3xl font-medium tabular-nums text-[#16a34a]"
        : "mt-2 text-3xl font-medium tabular-nums";

  return (
    <div className="dl-panel px-5 py-5">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={valueClass}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export default async function CoordinacionHomePage() {
  const { registro, plataformaRol } = await getSessionRegistro();
  if (!registro) redirect("/entrar");

  const [{ personeros, totalVideos, vistosByRegistro, actas, asistenciaById }, mostrarCredencial] =
    await Promise.all([
      loadTeamOperacion(registro, plataformaRol),
      credencialesVisibles(),
    ]);

  const capacitados = personeros.filter((p) => {
    if (totalVideos > 0) {
      return (vistosByRegistro.get(p.id) ?? 0) >= totalVideos;
    }
    return p.estado === "capacitado" || p.estado === "completado";
  }).length;

  const presentes = personeros.filter((p) => asistenciaById.has(p.id)).length;
  const actasCompletas = personeros.filter(
    (p) =>
      personeroTieneActa(actas, p.id, p.numero_mesa, "instalacion_sufragio") &&
      personeroTieneActa(actas, p.id, p.numero_mesa, "escrutinio"),
  ).length;

  const porPersonero = personeros.map((p) =>
    codigosAlertaDe({
      personero: p,
      actas,
      videosVistos: vistosByRegistro.get(p.id) ?? 0,
      totalVideos,
      llegoAlLocal: asistenciaById.has(p.id),
    }),
  );
  const alertas = resumenAlertas(porPersonero);

  return (
    <section className="mx-auto max-w-3xl">
      <p className="dl-kicker">
        {isAdminRole(plataformaRol) ? "Coordinación" : labelRol(plataformaRol)}
      </p>
      <h1 className="dl-title mt-3 text-3xl">
        {isAdminRole(plataformaRol)
          ? "Vista general"
          : registro.distrito && registro.provincia
            ? `${registro.distrito}, ${registro.provincia}`
            : "Tu territorio"}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {isCoordinadorDistrital(plataformaRol)
          ? "Personeros de tus coordinadores de local y de tu distrito."
          : "Personeros de tu territorio y asignaciones manuales."}
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Personeros"
          value={personeros.length}
          hint="En tu alcance"
        />
        <StatCard
          label="Capacitados"
          value={capacitados}
          hint={
            totalVideos > 0
              ? `Vieron los ${totalVideos} videos`
              : "Estado capacitado"
          }
        />
        <StatCard
          label="En el local"
          value={presentes}
          hint="Check-in del evento"
          tone={presentes > 0 ? "ok" : "default"}
        />
        <StatCard
          label="Actas completas"
          value={actasCompletas}
          hint="Instalación y escrutinio"
        />
      </div>

      <div className="dl-panel mt-4 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">
              Alertas
            </p>
            <p
              className={`mt-2 text-3xl font-medium tabular-nums ${alertas.personeros > 0 ? "text-[#ef4444]" : "text-[#16a34a]"}`}
            >
              {alertas.personeros}
            </p>
            <p className="mt-1 text-xs text-muted">
              {personeros.length === 0
                ? "Aún no hay personeros en tu alcance."
                : alertas.personeros === 0
                  ? "Nadie de tu equipo tiene pendientes."
                  : `${alertas.personeros} personero${alertas.personeros === 1 ? "" : "s"} con pendientes.`}
            </p>
          </div>
          <span
            aria-hidden
            className={`mt-1 inline-block h-3.5 w-3.5 shrink-0 rounded-full ${alertas.personeros > 0 ? "bg-[#ef4444]" : "bg-[#16a34a]"}`}
          />
        </div>
        {alertas.porCodigo.length > 0 ? (
          <ul className="mt-4 space-y-1.5 text-sm text-[#0b2a36]">
            {alertas.porCodigo.map(({ codigo, count }) => (
              <li key={codigo} className="flex justify-between gap-4">
                <span>{ALERTA_LABEL[codigo]}</span>
                <span className="tabular-nums text-[#ef4444]">{count}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <Link
          className="dl-btn dl-btn-secondary mt-5"
          href="/coordinacion/personeros"
        >
          Ver personeros
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="dl-btn dl-btn-primary" href="/coordinacion/eventos">
          Registrar evento
        </Link>
        <Link className="dl-btn dl-btn-secondary" href="/coordinacion/actas">
          Colgar otra mesa
        </Link>
        {mostrarCredencial && !isAdminRole(plataformaRol) ? (
          <Link
            className="dl-btn dl-btn-secondary"
            href="/coordinacion/credencial"
          >
            Ver credencial
          </Link>
        ) : null}
      </div>
    </section>
  );
}
