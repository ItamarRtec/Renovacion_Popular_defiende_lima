import { ActaUpload } from "@/components/plataforma/acta-upload";
import { MesaActaSearch } from "@/components/coordinacion/mesa-acta-search";
import {
  ACTA_TIPOS,
  isActaTipo,
  mesaKey,
  mesasParaColgar,
  normalizeNumeroMesa,
  type ActaTipo,
} from "@/lib/actas";
import { loadTeamPersoneros } from "@/lib/coordinacion";
import { getSessionRegistro } from "@/lib/plataforma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ mesa?: string }>;
};

export default async function CoordinacionActasPage({ searchParams }: PageProps) {
  const { registro, plataformaRol } = await getSessionRegistro();
  if (!registro) redirect("/entrar");

  const { mesa: mesaParam } = await searchParams;
  const mesaBuscada = mesaParam?.replace(/\D/g, "") ?? "";
  const mesaNorm = normalizeNumeroMesa(mesaBuscada);
  const personeros = await loadTeamPersoneros(registro, plataformaRol);
  const mesas = mesasParaColgar(personeros);
  const enMesa = mesaBuscada
    ? personeros.filter((p) => mesaKey(p.numero_mesa) === mesaKey(mesaBuscada))
    : [];

  const personero =
    enMesa.find((p) => p.rol_mesa !== "suplente") ?? enMesa[0] ?? null;
  const destino = mesaBuscada ? (personero ?? registro) : null;

  const supabase = await createSupabaseServerClient();
  const { data: rows } = destino
    ? await supabase
        .from("actas")
        .select("id, storage_path, created_at, tipo")
        .eq("registro_id", destino.id)
        .eq("numero_mesa", mesaNorm)
        .order("created_at", { ascending: false })
    : { data: [] };

  const actas = rows ?? [];
  const latestByTipo = new Map<ActaTipo, (typeof actas)[number]>();
  for (const row of actas) {
    if (!isActaTipo(row.tipo) || latestByTipo.has(row.tipo)) continue;
    latestByTipo.set(row.tipo, row);
  }

  const initial = destino
    ? await Promise.all(
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
      )
    : [];

  return (
    <section className="mx-auto max-w-2xl">
      <p className="dl-kicker">Coordinación</p>
      <h1 className="dl-title mt-3 text-3xl">Colgar actas de otra mesa</h1>
      <p className="mt-3 text-sm text-muted">
        Selecciona o escribe la mesa que estás colgando. Sin esa mesa no se
        pueden subir las fotos. Si falta el personero, las cuelgas tú. El
        personero solo cuelga las de su propia mesa.
      </p>

      <MesaActaSearch initialMesa={mesaBuscada} mesas={mesas} />

      {destino ? (
        <div className="mt-10 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">
              Mesa {personero?.numero_mesa?.trim() || mesaNorm || mesaBuscada}
            </p>
            {personero ? (
              <>
                <p className="mt-1 text-lg font-medium text-[#0b2a36]">
                  {personero.nombres} {personero.apellidos}
                  {personero.rol_mesa === "suplente" ? " (suplente)" : ""}
                </p>
                <p className="mt-1 text-sm text-muted">
                  DNI {personero.dni}
                  {personero.distrito ? ` · ${personero.distrito}` : ""}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">
                No hay personero de esta mesa en tu alcance. Las actas quedan a
                tu cargo.
              </p>
            )}
          </div>
          {initial.map(({ tipo, acta }) => (
            <ActaUpload
              key={`${destino.id}-${mesaNorm}-${tipo}`}
              numeroMesa={mesaNorm}
              registroId={destino.id}
              tipo={tipo}
              initialActa={acta}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
