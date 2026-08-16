import { AdminAsignaciones } from "@/components/admin/asignaciones";
import { requireAdminDb } from "@/lib/admin-session";
import { isCoordinadorDistrital, isCoordinadorLocal } from "@/lib/roles";

const LOCAL_SELECT =
  "id, nombres, apellidos, dni, distrito, provincia, coordinador_id, plataforma_rol";

export default async function AdminAsignacionesPage() {
  const { supabase } = await requireAdminDb();

  const [{ data: personeros }, { data: staff }] = await Promise.all([
    supabase
      .from("registros")
      .select(LOCAL_SELECT)
      .eq("plataforma_rol", "personero")
      .order("apellidos", { ascending: true }),
    supabase
      .from("registros")
      .select(LOCAL_SELECT)
      .neq("plataforma_rol", "personero")
      .neq("plataforma_rol", "administrador")
      .order("apellidos", { ascending: true }),
  ]);

  const locales = (staff ?? []).filter((row) =>
    isCoordinadorLocal(row.plataforma_rol),
  );
  const distritales = (staff ?? []).filter((row) =>
    isCoordinadorDistrital(row.plataforma_rol),
  );

  return (
    <section className="mx-auto max-w-5xl">
      <p className="dl-kicker">Administración</p>
      <h1 className="dl-title mt-3 text-3xl">Asignación del árbol</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Aquí fijas el árbol: personero → coordinador de local → coordinador de
        distrito. Si no eliges a nadie, el personero no tiene CL propio y lo
        ve quien coincida en distrito.
      </p>
      <div className="mt-8">
        <AdminAsignaciones
          personeros={personeros ?? []}
          coordinadoresLocales={locales}
          coordinadoresDistritales={distritales}
        />
      </div>
    </section>
  );
}
