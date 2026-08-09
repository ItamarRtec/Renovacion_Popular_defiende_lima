import { VentanaForm } from "@/components/admin/ventana-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminVentanaPage() {
  const supabase = await createSupabaseServerClient();
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
        Controla cuándo los personeros pueden entrar con correo + DNI. Fuera de
        la ventana, el acceso público se cierra; administradores y coordinadores
        entran por enlace seguro (OTP).
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
