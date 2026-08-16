import Link from "next/link";
import { redirect } from "next/navigation";
import { loadTeamPersoneros } from "@/lib/coordinacion";
import { getSessionRegistro } from "@/lib/plataforma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CoordinacionPersonerosPage() {
  const { registro, plataformaRol } = await getSessionRegistro();
  if (!registro) redirect("/entrar");

  const personeros = await loadTeamPersoneros(registro, plataformaRol);
  const ids = personeros.map((p) => p.id);
  const supabase = await createSupabaseServerClient();

  const [{ data: videos }, { data: progresos }, { data: actas }, { data: asistencias }] =
    await Promise.all([
      supabase.from("videos").select("id").eq("activo", true),
      ids.length
        ? supabase
            .from("video_progresos")
            .select("registro_id, visto")
            .in("registro_id", ids)
            .eq("visto", true)
        : Promise.resolve({ data: [] as { registro_id: string; visto: boolean }[] }),
      ids.length
        ? supabase.from("actas").select("registro_id").in("registro_id", ids)
        : Promise.resolve({ data: [] as { registro_id: string }[] }),
      ids.length
        ? supabase
            .from("asistencias")
            .select("registro_id, llegada_at")
            .in("registro_id", ids)
        : Promise.resolve({
            data: [] as { registro_id: string; llegada_at: string }[],
          }),
    ]);

  const totalVideos = videos?.length ?? 0;
  const vistosByRegistro = new Map<string, number>();
  for (const row of progresos ?? []) {
    vistosByRegistro.set(
      row.registro_id,
      (vistosByRegistro.get(row.registro_id) ?? 0) + 1,
    );
  }
  const actaSet = new Set((actas ?? []).map((a) => a.registro_id));
  const asistenciaById = new Map(
    (asistencias ?? []).map((a) => [a.registro_id, a.llegada_at]),
  );

  return (
    <section className="mx-auto max-w-4xl">
      <p className="dl-kicker">Equipo</p>
      <h1 className="dl-title mt-3 text-3xl">Personeros</h1>
      <p className="mt-3 text-sm text-muted">
        {personeros.length} en tu alcance (territorio + asignación manual).
      </p>

      <div className="mt-8 overflow-x-auto rounded-[var(--radius-lg)] border border-border">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-border bg-[var(--surface-muted)] text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Mesa</th>
              <th className="px-4 py-3 font-medium">Videos</th>
              <th className="px-4 py-3 font-medium">Local</th>
              <th className="px-4 py-3 font-medium">Acta</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {personeros.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted"
                  colSpan={7}
                >
                  No hay personeros en tu territorio aún.
                </td>
              </tr>
            ) : (
              personeros.map((p) => (
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
                    {vistosByRegistro.get(p.id) ?? 0}/{totalVideos}
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
                    {actaSet.has(p.id) ? "Sí" : "No"}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted">{p.estado}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
