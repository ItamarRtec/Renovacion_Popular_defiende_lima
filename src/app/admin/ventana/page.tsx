import { VentanaForm } from "@/components/admin/ventana-form";
import { requireAdminDb } from "@/lib/admin-session";

export default async function AdminVentanaPage() {
  const { supabase } = await requireAdminDb();
  const { data } = await supabase
    .from("ventana_acceso")
    .select("id, abre_at, cierra_at, activa, updated_at")
    .eq("id", 1)
    .maybeSingle();

  const { data: abierto } = await supabase.rpc("acceso_publico_abierto");

  return (
    <section className="mx-auto max-w-2xl">
      <p className="dl-kicker">Administración</p>
      <h1 className="dl-title mt-3 text-3xl">Ventana de acceso</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Personeros y coordinadores entran siempre con correo + DNI. Esta
        ventana ya no cierra el login. Para un ensayo de QR, usa{" "}
        <a className="underline underline-offset-2" href="/admin/eventos">
          Eventos
        </a>
        : aísla las llegadas del día D.
      </p>
      <div className="mt-8">
        <VentanaForm
          initial={
            data ?? {
              id: 1,
              abre_at: null,
              cierra_at: null,
              activa: true,
              updated_at: "",
            }
          }
          abiertoAhora={abierto ?? true}
        />
      </div>
    </section>
  );
}
