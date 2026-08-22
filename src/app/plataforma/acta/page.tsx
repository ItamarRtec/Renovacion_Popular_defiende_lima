import { redirect } from "next/navigation";
import { ActaUpload } from "@/components/plataforma/acta-upload";
import {
  ACTA_TIPOS,
  ACTA_TIPO_LABEL,
  isActaTipo,
  normalizeNumeroMesa,
  type ActaTipo,
} from "@/lib/actas";
import { getSessionRegistro } from "@/lib/plataforma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ tipo?: string }>;
};

export default async function PlataformaActaPage({ searchParams }: PageProps) {
  const { registro } = await getSessionRegistro();
  if (!registro) redirect("/plataforma");

  const { tipo: tipoParam } = await searchParams;
  const soloTipo = isActaTipo(tipoParam) ? tipoParam : null;

  const mesaNorm = normalizeNumeroMesa(registro.numero_mesa);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("actas")
    .select("id, storage_path, created_at, tipo")
    .eq("registro_id", registro.id)
    .order("created_at", { ascending: false });
  query = mesaNorm
    ? query.eq("numero_mesa", mesaNorm)
    : query.eq("numero_mesa", "");
  const { data: rows } = await query;

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

  const visibles = soloTipo
    ? initial.filter((row) => row.tipo === soloTipo)
    : initial;

  return (
    <section className="mx-auto max-w-2xl">
      <p className="dl-kicker">Evidencia</p>
      <h1 className="dl-title mt-3 text-3xl">
        {soloTipo ? ACTA_TIPO_LABEL[soloTipo] : "Actas de tu mesa"}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {soloTipo
          ? `Toma o sube la foto${registro.numero_mesa ? ` de la mesa ${registro.numero_mesa}` : ""}.`
          : `Sube las dos fotos${registro.numero_mesa ? ` de la mesa ${registro.numero_mesa}` : ""}: instalación y sufragio, y escrutinio.`}
      </p>
      {soloTipo ? (
        <Link
          className="mt-4 inline-block text-sm text-[#1077A1] underline underline-offset-2"
          href="/plataforma"
        >
          Volver
        </Link>
      ) : null}
      <div className="mt-10 space-y-6">
        {visibles.map(({ tipo, acta }) => (
          <ActaUpload
            key={tipo}
            numeroMesa={mesaNorm}
            registroId={registro.id}
            tipo={tipo}
            initialActa={acta}
          />
        ))}
      </div>
    </section>
  );
}
