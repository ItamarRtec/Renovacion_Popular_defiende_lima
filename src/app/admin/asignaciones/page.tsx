import { AdminAsignaciones } from "@/components/admin/asignaciones";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminAsignacionesPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: personeros }, { data: coordinadores }] = await Promise.all([
    supabase
      .from("registros")
      .select(
        "id, nombres, apellidos, dni, distrito, provincia, coordinador_id",
      )
      .eq("plataforma_rol", "personero")
      .order("apellidos", { ascending: true }),
    supabase
      .from("registros")
      .select("id, nombres, apellidos, distrito, provincia")
      .eq("plataforma_rol", "coordinador")
      .order("apellidos", { ascending: true }),
  ]);

  return (
    <section className="mx-auto max-w-5xl">
      <p className="dl-kicker">Administración</p>
      <h1 className="dl-title mt-3 text-3xl">Asignación manual</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Vincula un personero a un coordinador aunque no coincida el distrito.
        Si dejas “Solo territorio”, aplica solo provincia + distrito.
      </p>
      <div className="mt-8">
        <AdminAsignaciones
          personeros={personeros ?? []}
          coordinadores={coordinadores ?? []}
        />
      </div>
    </section>
  );
}
