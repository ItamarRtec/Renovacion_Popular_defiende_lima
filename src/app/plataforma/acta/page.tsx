import { redirect } from "next/navigation";
import { ActaUpload } from "@/components/plataforma/acta-upload";
import { getSessionRegistro } from "@/lib/plataforma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlataformaActaPage() {
  const { registro } = await getSessionRegistro();
  if (!registro) redirect("/plataforma");

  const supabase = await createSupabaseServerClient();
  const { data: acta } = await supabase
    .from("actas")
    .select("id, storage_path, created_at")
    .eq("registro_id", registro.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let signedUrl: string | null = null;
  if (acta?.storage_path) {
    const { data } = await supabase.storage
      .from("actas")
      .createSignedUrl(acta.storage_path, 300);
    signedUrl = data?.signedUrl ?? null;
  }

  return (
    <section className="mx-auto max-w-2xl">
      <p className="dl-kicker">Evidencia</p>
      <h1 className="dl-title mt-3 text-3xl">Foto del acta</h1>
      <p className="mt-3 text-sm text-muted">
        Sube una foto clara del acta de tu mesa
        {registro.numero_mesa ? ` (${registro.numero_mesa})` : ""}.
      </p>
      <div className="mt-10">
        <ActaUpload
          registroId={registro.id}
          initialActa={
            acta
              ? {
                  id: acta.id,
                  storage_path: acta.storage_path,
                  created_at: acta.created_at,
                  signedUrl,
                }
              : null
          }
        />
      </div>
    </section>
  );
}
