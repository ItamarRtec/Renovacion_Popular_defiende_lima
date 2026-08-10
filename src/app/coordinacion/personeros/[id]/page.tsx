import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

  const [{ data: videos }, { data: progresos }, { data: acta }] =
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
      supabase
        .from("actas")
        .select("id, storage_path, created_at")
        .eq("registro_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const vistoSet = new Set(
    (progresos ?? []).filter((p) => p.visto).map((p) => p.video_id),
  );

  let signedUrl: string | null = null;
  if (acta?.storage_path) {
    const { data } = await supabase.storage
      .from("actas")
      .createSignedUrl(acta.storage_path, 300);
    signedUrl = data?.signedUrl ?? null;
  }

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
        <h2 className="text-lg font-medium">Acta</h2>
        {signedUrl ? (
          <div className="mt-4 overflow-hidden rounded-[var(--radius-lg)] border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Acta del personero"
              className="max-h-[28rem] w-full object-contain bg-black"
              src={signedUrl}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Aún no subió foto del acta.</p>
        )}
      </div>
    </section>
  );
}
