import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getEventoActivo } from "@/lib/eventos";
import { getSessionRegistro } from "@/lib/plataforma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPlaceholderVideoUrl, youtubeEmbedUrl } from "@/lib/youtube";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoordinacionPersoneroDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  const { registro: me } = await getSessionRegistro();
  if (!me) redirect("/entrar");

  const supabase = await createSupabaseServerClient();
  const { data: personero } = await supabase
    .from("registros")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!personero) notFound();

  const evento = await getEventoActivo(supabase);
  let asisQuery = supabase
    .from("asistencias")
    .select("llegada_at, metodo")
    .eq("registro_id", id);
  asisQuery = evento
    ? asisQuery.eq("evento_id", evento.id)
    : asisQuery.is("evento_id", null);

  const [{ data: videos }, { data: progresos }, { data: actas }, { data: asistencia }] =
    await Promise.all([
      supabase
        .from("videos")
        .select("id, titulo, url, orden")
        .eq("activo", true)
        .order("orden", { ascending: true }),
      supabase
        .from("video_progresos")
        .select("video_id, visto")
        .eq("registro_id", id),
      supabase.from("actas").select("id, tipo").eq("registro_id", id),
      asisQuery.maybeSingle(),
    ]);

  const vistoSet = new Set(
    (progresos ?? []).filter((p) => p.visto).map((p) => p.video_id),
  );

  const mesa = personero.numero_mesa?.trim() ?? "";
  const actasCargadas = new Set((actas ?? []).map((a) => a.tipo)).size;

  return (
    <section className="mx-auto max-w-2xl space-y-10">
      <div>
        <Link
          className="text-sm text-muted hover:text-[#1077A1]"
          href="/coordinacion/personeros"
        >
          ← Personeros
        </Link>
        <p className="dl-kicker mt-6">Personero</p>
        <h1 className="dl-title mt-3 text-3xl">
          {personero.nombres} {personero.apellidos}
        </h1>
        <p className="mt-3 text-sm text-muted">
          DNI {personero.dni} · Mesa {personero.numero_mesa ?? "—"}
          {personero.rol_mesa === "suplente" ? " (suplente)" : ""} ·{" "}
          {personero.distrito && personero.provincia
            ? `${personero.distrito}, ${personero.provincia}`
            : "Sin ubicación"}
        </p>
        <p className="mt-1 text-sm capitalize text-muted">
          Estado: {personero.estado}
          {personero.coordinador_id ? " · Asignación manual" : ""}
        </p>
        <p className="mt-1 text-sm text-muted">
          Asistencia:{" "}
          {asistencia ? (
            <>
              presente ·{" "}
              <span className="font-[family-name:var(--font-data)] tabular-nums text-[#1077A1]">
                {new Intl.DateTimeFormat("es-PE", {
                  dateStyle: "short",
                  timeStyle: "medium",
                }).format(new Date(asistencia.llegada_at))}
              </span>
              {asistencia.metodo === "manual" ? " (manual)" : " (QR)"}
            </>
          ) : (
            "aún no llega"
          )}
        </p>
      </div>

      <div>
        <h2 className="text-lg font-medium">Videos</h2>
        <ul className="mt-4 space-y-3">
          {(videos ?? []).map((video) => (
            <li
              key={video.id}
              className="dl-panel flex items-center justify-between gap-4 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{video.titulo}</p>
                {!isPlaceholderVideoUrl(video.url) &&
                youtubeEmbedUrl(video.url) ? (
                  <p className="text-xs text-muted">YouTube configurado</p>
                ) : (
                  <p className="text-xs text-muted">URL pendiente</p>
                )}
              </div>
              <span
                className={
                  vistoSet.has(video.id)
                    ? "text-xs text-[var(--dl-success-500)]"
                    : "text-xs text-muted"
                }
              >
                {vistoSet.has(video.id) ? "Visto" : "Pendiente"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-medium">Actas</h2>
        <p className="mt-2 text-sm text-muted">
          {actasCargadas} de 2 cargadas.
          {mesa
            ? " Para colgar o reemplazar, selecciona esta mesa."
            : " Este personero no tiene mesa asignada."}
        </p>
        {mesa ? (
          <Link
            className="dl-btn dl-btn-primary mt-4"
            href={`/coordinacion/actas?mesa=${encodeURIComponent(mesa)}`}
          >
            Colgar mesa {mesa}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
