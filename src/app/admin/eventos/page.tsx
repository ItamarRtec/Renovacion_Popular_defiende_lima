import { AdminEventos } from "@/components/admin/eventos";
import { requireAdminDb } from "@/lib/admin-session";
import type { EventoRow } from "@/lib/supabase/database.types";

export default async function AdminEventosPage() {
  const { supabase } = await requireAdminDb();
  const { data } = await supabase
    .from("eventos")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto max-w-4xl">
      <p className="dl-kicker">Administración</p>
      <h1 className="dl-title mt-3 text-3xl">Eventos</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Personeros y coordinadores entran siempre. Abre un ensayo para probar
        el QR: esas llegadas no cuentan para el día de la elección.
      </p>
      <div className="mt-8">
        <AdminEventos eventos={(data ?? []) as EventoRow[]} />
      </div>
    </section>
  );
}
