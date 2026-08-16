import { redirect } from "next/navigation";
import { ActaUpload } from "@/components/plataforma/acta-upload";
import { ACTA_TIPOS, isActaTipo, type ActaTipo } from "@/lib/actas";
import { getSessionRegistro } from "@/lib/plataforma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlataformaActaPage() {
  const { registro } = await getSessionRegistro();
  if (!registro) redirect("/plataforma");

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("actas")
    .select("id, storage_path, created_at, tipo")
    .eq("registro_id", registro.id)
    .order("created_at", { ascending: false });

  const actas = rows ?? [];
  const latestByTipo = new Map<ActaTipo, (typeof actas)[number]>();
  for (const row of actas) {
    if (!isActaTipo(row.tipo) || latestByTipo.has(row.tipo)) continue;
    latestByTipo.set(row.tipo, row);
  }

  const initial = await Promise.all(
    ACTA_TIPOS.map(async (tipo) => {
      const acta = latestByTipo.get(tipo) ?? null;
      let signedUrl: string | null = null;
      if (acta?.storage_path) {
        const { data } = await supabase.storage
          .from("actas")
          .createSignedUrl(acta.storage_path, 300);
        signedUrl = data?.signedUrl ?? null;
      }
      return {
        tipo,
        acta: acta
          ? {
              id: acta.id,
              storage_path: acta.storage_path,
              created_at: acta.created_at,
              signedUrl,
            }
          : null,
      };
    }),
  );

  return (
    <section className="mx-auto max-w-2xl">
      <p className="dl-kicker">Evidencia</p>
      <h1 className="dl-title mt-3 text-3xl">Actas de tu mesa</h1>
      <p className="mt-3 text-sm text-muted">
        Sube las dos fotos
        {registro.numero_mesa ? ` de la mesa ${registro.numero_mesa}` : ""}:
        instalación y sufragio, y escrutinio.
      </p>
      <div className="mt-10 space-y-6">
        {initial.map(({ tipo, acta }) => (
          <ActaUpload
            key={tipo}
            registroId={registro.id}
            tipo={tipo}
            initialActa={acta}
          />
        ))}
      </div>
    </section>
  );
}
