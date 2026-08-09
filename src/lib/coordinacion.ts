import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RegistroRow } from "@/lib/supabase/database.types";

export async function loadTeamPersoneros(
  me: RegistroRow,
  rol: string,
): Promise<RegistroRow[]> {
  const supabase = await createSupabaseServerClient();

  if (rol === "administrador") {
    const { data } = await supabase
      .from("registros")
      .select("*")
      .eq("plataforma_rol", "personero")
      .order("apellidos", { ascending: true });
    return data ?? [];
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

  const byId = new Map<string, RegistroRow>();
  for (const row of [...(territorial ?? []), ...(manual ?? [])]) {
    byId.set(row.id, row);
  }
  return [...byId.values()].sort((a, b) =>
    a.apellidos.localeCompare(b.apellidos, "es"),
  );
}
