"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isPlaceholderVideoUrl, youtubeEmbedUrl } from "@/lib/youtube";

type VideoItem = {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
  orden: number;
  visto: boolean;
};

export function VideoList({
  videos,
  registroId,
}: {
  videos: VideoItem[];
  registroId: string;
}) {
  const [items, setItems] = useState(videos);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function markWatched(videoId: string) {
    setError(null);
    setBusyId(videoId);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: upsertError } = await supabase.from("video_progresos").upsert(
        {
          registro_id: registroId,
          video_id: videoId,
          visto: true,
          porcentaje: 100,
          visto_at: new Date().toISOString(),
        },
        { onConflict: "registro_id,video_id" },
      );

      if (upsertError) {
        setError("No pudimos marcar el video. Intenta de nuevo.");
        console.error(upsertError);
        return;
      }

      await supabase.rpc("refresh_registro_capacitado", {
        p_registro_id: registroId,
      });

      setItems((prev) =>
        prev.map((video) =>
          video.id === videoId ? { ...video, visto: true } : video,
        ),
      );
    } catch (err) {
      console.error(err);
      setError("No pudimos marcar el video. Intenta de nuevo.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p className="text-sm text-[var(--dl-danger-500)]" role="alert">
          {error}
        </p>
      ) : null}

      {items.map((video) => {
        const embed = youtubeEmbedUrl(video.url);
        const placeholder = isPlaceholderVideoUrl(video.url);

        return (
          <article key={video.id} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">
                  Video {video.orden}
                  {video.visto ? " · Visto" : ""}
                </p>
                <h2 className="mt-1 text-xl font-medium">{video.titulo}</h2>
                <p className="mt-2 text-sm text-muted">{video.descripcion}</p>
              </div>
              {video.visto ? (
                <span className="shrink-0 text-xs text-[var(--dl-success-500)]">
                  Completado
                </span>
              ) : null}
            </div>

            {embed && !placeholder ? (
              <div className="aspect-video overflow-hidden rounded-[var(--radius-lg)] border border-border bg-black">
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                  src={embed}
                  title={video.titulo}
                />
              </div>
            ) : (
              <div className="dl-panel flex aspect-video items-center justify-center px-6 text-center text-sm text-muted">
                Video pendiente de configurar. Un admin debe reemplazar la URL
                en la tabla `videos`.
              </div>
            )}

            {!video.visto ? (
              <button
                className="dl-btn dl-btn-primary"
                disabled={busyId === video.id}
                type="button"
                onClick={() => markWatched(video.id)}
              >
                {busyId === video.id ? "Guardando…" : "Marqué como visto"}
              </button>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
