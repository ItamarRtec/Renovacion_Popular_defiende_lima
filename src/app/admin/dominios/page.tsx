import { AdminDominios } from "@/components/admin/dominios";
import { requireAdminDb } from "@/lib/admin-session";

export default async function AdminDominiosPage() {
  const { supabase } = await requireAdminDb();
  const { data } = await supabase
    .from("dominios_acceso")
    .select("id, dominio, origen, activo, notas, created_at, updated_at")
    .order("dominio", { ascending: true });

  return (
    <section className="mx-auto max-w-5xl">
      <p className="dl-kicker">Administración</p>
      <h1 className="dl-title mt-3 text-3xl">Dominios de acceso</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Define qué dominios web conectan a cada marca. Usa el hostname sin{" "}
        <span className="font-[family-name:var(--font-data)]">https://</span>
        — por ejemplo{" "}
        <span className="font-[family-name:var(--font-data)]">
          personeros.renovacionpopular.pe
        </span>
        .
      </p>
      <div className="mt-8">
        <AdminDominios rows={data ?? []} />
      </div>
    </section>
  );
}
