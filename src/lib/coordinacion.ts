import { isAdminRole, isCoordinadorDistrital } from "@/lib/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RegistroRow } from "@/lib/supabase/database.types";
import type { ActaRef } from "@/lib/personero-alertas";

function mergeById(rows: RegistroRow[]): RegistroRow[] {
  const byId = new Map<string, RegistroRow>();
  for (const row of rows) {
    byId.set(row.id, row);
  }
  return [...byId.values()].sort((a, b) =>
    a.apellidos.localeCompare(b.apellidos, "es"),
  );
}

export async function loadTeamPersoneros(
  me: RegistroRow,
  rol: string,
): Promise<RegistroRow[]> {
  const supabase = await createSupabaseServerClient();

  if (isAdminRole(rol)) {
    const { data } = await supabase
      .from("registros")
      .select("*")
      .eq("plataforma_rol", "personero")
      .order("apellidos", { ascending: true });
    return data ?? [];
  }

  if (isCoordinadorDistrital(rol)) {
    const { data: locales } = await supabase
      .from("registros")
      .select("id")
      .eq("coordinador_id", me.id);

    const localIds = (locales ?? []).map((row) => row.id);
    const batches: RegistroRow[][] = [];

    const { data: directos } = await supabase
      .from("registros")
      .select("*")
      .eq("plataforma_rol", "personero")
      .eq("coordinador_id", me.id);
    batches.push(directos ?? []);

    if (localIds.length > 0) {
      const { data: bajoLocales } = await supabase
        .from("registros")
        .select("*")
        .eq("plataforma_rol", "personero")
        .in("coordinador_id", localIds);
      batches.push(bajoLocales ?? []);
    }

    if (me.provincia && me.distrito) {
      const { data: territoriales } = await supabase
        .from("registros")
        .select("*")
        .eq("plataforma_rol", "personero")
        .eq("origen", me.origen)
        .eq("provincia", me.provincia)
        .eq("distrito", me.distrito);
      batches.push(territoriales ?? []);
    }

    return mergeById(batches.flat());
  }

  if (!me.provincia || !me.distrito) {
    const { data: manualOnly } = await supabase
      .from("registros")
      .select("*")
      .eq("coordinador_id", me.id);
    return mergeById(manualOnly ?? []);
  }

  const [{ data: territorial }, { data: manual }] = await Promise.all([
    supabase
      .from("registros")
      .select("*")
      .eq("plataforma_rol", "personero")
      .eq("origen", me.origen)
      .eq("provincia", me.provincia)
      .eq("distrito", me.distrito),
    supabase.from("registros").select("*").eq("coordinador_id", me.id),
  ]);

  return mergeById([...(territorial ?? []), ...(manual ?? [])]);
}

export type TeamOperacion = {
  personeros: RegistroRow[];
  totalVideos: number;
  vistosByRegistro: Map<string, number>;
  actas: ActaRef[];
  asistenciaById: Map<string, string>;
};

export async function loadTeamOperacion(
  me: RegistroRow,
  rol: string,
): Promise<TeamOperacion> {
  const personeros = await loadTeamPersoneros(me, rol);
  const ids = personeros.map((row) => row.id);
  const supabase = await createSupabaseServerClient();

  const [{ data: videos }, { data: progresos }, { data: actas }, { data: asistencias }] =
    await Promise.all([
      supabase.from("videos").select("id").eq("activo", true),
      ids.length
        ? supabase
            .from("video_progresos")
            .select("registro_id, visto")
            .in("registro_id", ids)
            .eq("visto", true)
        : Promise.resolve({ data: [] as { registro_id: string; visto: boolean }[] }),
      ids.length
        ? supabase
            .from("actas")
            .select("registro_id, tipo, numero_mesa")
            .in("registro_id", [...ids, me.id])
        : Promise.resolve({ data: [] as ActaRef[] }),
      ids.length
        ? supabase
            .from("asistencias")
            .select("registro_id, llegada_at")
            .in("registro_id", ids)
        : Promise.resolve({
            data: [] as { registro_id: string; llegada_at: string }[],
          }),
    ]);

  const vistosByRegistro = new Map<string, number>();
  for (const row of progresos ?? []) {
    vistosByRegistro.set(
      row.registro_id,
      (vistosByRegistro.get(row.registro_id) ?? 0) + 1,
    );
  }

  return {
    personeros,
    totalVideos: videos?.length ?? 0,
    vistosByRegistro,
    actas: (actas ?? []) as ActaRef[],
    asistenciaById: new Map(
      (asistencias ?? []).map((row) => [row.registro_id, row.llegada_at]),
    ),
  };
}
