import { AdminVideos } from "@/components/admin/videos";
import { requireAdminDb } from "@/lib/admin-session";
import type { VideoRow } from "@/lib/supabase/database.types";

export default async function AdminVideosPage() {
  const { supabase } = await requireAdminDb();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .order("orden", { ascending: true });

  return (
    <section className="mx-auto max-w-4xl">
      <p className="dl-kicker">Administración</p>
      <h1 className="dl-title mt-3 text-3xl">Videos de capacitación</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Publica o desactiva videos de YouTube. Los personeros solo ven los
        activos en su plataforma.
      </p>
      <div className="mt-8">
        <AdminVideos videos={(data ?? []) as VideoRow[]} />
      </div>
    </section>
  );
}
