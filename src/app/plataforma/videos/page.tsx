import { redirect } from "next/navigation";
import { VideoList } from "@/components/plataforma/video-list";
import { diaDActivo } from "@/lib/dia-d";
import { getSessionRegistro } from "@/lib/plataforma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlataformaVideosPage() {
  const { registro } = await getSessionRegistro();
  if (!registro) redirect("/plataforma");
  if (await diaDActivo()) redirect("/plataforma");

  const supabase = await createSupabaseServerClient();
  const [{ data: videos }, { data: progresos }] = await Promise.all([
    supabase
      .from("videos")
      .select("id, titulo, descripcion, url, orden")
      .eq("activo", true)
      .order("orden", { ascending: true }),
    supabase
      .from("video_progresos")
      .select("video_id, visto")
      .eq("registro_id", registro.id),
  ]);

  const vistoById = new Map(
    (progresos ?? []).map((row) => [row.video_id, row.visto]),
  );

  const items = (videos ?? []).map((video) => ({
    ...video,
    visto: Boolean(vistoById.get(video.id)),
  }));

  return (
    <section className="mx-auto max-w-2xl">
      <p className="dl-kicker">Capacitación</p>
      <h1 className="dl-title mt-3 text-3xl">Videos</h1>
      <p className="mt-3 text-sm text-muted">
        Mira cada video y marca como visto. Al completar todos, tu estado pasa
        a capacitado.
      </p>
      <div className="mt-10">
        {items.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay videos publicados.</p>
        ) : (
          <VideoList registroId={registro.id} videos={items} />
        )}
      </div>
    </section>
  );
}
