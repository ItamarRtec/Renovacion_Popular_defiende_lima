import Link from "next/link";
import { redirect } from "next/navigation";
import { EstadoAlerta } from "@/components/coordinacion/estado-alerta";
import { loadTeamOperacion } from "@/lib/coordinacion";
import {
  personeroTieneActa,
  codigosAlertaDe,
  textosAlerta,
} from "@/lib/personero-alertas";
import { getSessionRegistro } from "@/lib/plataforma";

function ActaMark({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      aria-label={ok ? `${label} colgada` : `${label} no colgada`}
      className={`inline-block h-3.5 w-3.5 rounded-full ${ok ? "bg-[#16a34a]" : "bg-[#ef4444]"}`}
      title={ok ? "Colgada" : "No colgada"}
    />
  );
}

export default async function CoordinacionPersonerosPage() {
  const { registro, plataformaRol } = await getSessionRegistro();
  if (!registro) redirect("/entrar");

  const {
    personeros,
    totalVideos,
    vistosByRegistro,
    actas,
    asistenciaById,
  } = await loadTeamOperacion(registro, plataformaRol);

  return (
    <section className="mx-auto max-w-6xl">
      <p className="dl-kicker">Equipo</p>
      <h1 className="dl-title mt-3 text-3xl">Personeros</h1>
      <p className="mt-3 text-sm text-muted">
        {personeros.length} en tu alcance (territorio + asignación manual).
      </p>

      <div className="mt-8 overflow-x-auto rounded-[var(--radius-lg)] border border-border">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-border bg-[var(--surface-muted)] text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Mesa</th>
              <th className="px-4 py-3 font-medium">Videos</th>
              <th className="px-4 py-3 font-medium">Local</th>
              <th className="px-4 py-3 font-medium">Acta de instalación</th>
              <th className="px-4 py-3 font-medium">Acta de escrutinio</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {personeros.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted"
                  colSpan={8}
                >
                  No hay personeros en tu territorio aún.
                </td>
              </tr>
            ) : (
              personeros.map((p) => {
                const vistos = vistosByRegistro.get(p.id) ?? 0;
                const alertas = textosAlerta(
                  codigosAlertaDe({
                    personero: p,
                    actas,
                    videosVistos: vistos,
                    totalVideos,
                    llegoAlLocal: asistenciaById.has(p.id),
                  }),
                  vistos,
                  totalVideos,
                );
                return (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 hover:bg-[var(--surface-muted)]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        className="font-medium text-[#1077A1] hover:underline"
                        href={`/coordinacion/personeros/${p.id}`}
                      >
                        {p.apellidos}, {p.nombres}
                      </Link>
                      {p.coordinador_id === registro.id ? (
                        <span className="ml-2 text-[10px] uppercase text-muted">
                          manual
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">{p.dni}</td>
                    <td className="px-4 py-3 text-muted">
                      {p.numero_mesa ?? "—"}
                      {p.rol_mesa === "suplente" ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-[#1077A1]">
                          suplente
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {vistos}/{totalVideos}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {asistenciaById.has(p.id) ? (
                        <span className="text-[#1077A1]">
                          {new Intl.DateTimeFormat("es-PE", {
                            timeStyle: "short",
                          }).format(new Date(asistenciaById.get(p.id)!))}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ActaMark
                        label="Acta de instalación"
                        ok={personeroTieneActa(
                          actas,
                          p.id,
                          p.numero_mesa,
                          "instalacion_sufragio",
                        )}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ActaMark
                        label="Acta de escrutinio"
                        ok={personeroTieneActa(
                          actas,
                          p.id,
                          p.numero_mesa,
                          "escrutinio",
                        )}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EstadoAlerta alertas={alertas} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
