import { isAdminRole, isCoordinadorDistrital } from "@/lib/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RegistroRow } from "@/lib/supabase/database.types";

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
