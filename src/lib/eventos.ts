import type { AdminDb } from "@/lib/admin-session";
import type { EventoRow } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export function eventoEstaAbierto(
  evento: Pick<EventoRow, "activo" | "abre_at" | "cierra_at">,
  now = Date.now(),
): boolean {
  if (!evento.activo) return false;
  if (evento.abre_at && new Date(evento.abre_at).getTime() > now) return false;
  if (evento.cierra_at && new Date(evento.cierra_at).getTime() < now) {
    return false;
  }
  return true;
}

export function pickEventoActivo(eventos: EventoRow[]): EventoRow | null {
  const open = eventos.filter((e) => eventoEstaAbierto(e));
  if (open.length === 0) return null;
  const ranked = [...open].sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === "eleccion" ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return ranked[0] ?? null;
}

export async function getEventoActivo(
  supabase: AdminDb | SupabaseClient<Database>,
): Promise<EventoRow | null> {
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("activo", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return null;
  }

  return pickEventoActivo((data ?? []) as EventoRow[]);
}

export function formatEventoRango(evento: EventoRow): string {
  const fmt = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const abre = evento.abre_at ? fmt.format(new Date(evento.abre_at)) : "ya";
  const cierra = evento.cierra_at
    ? fmt.format(new Date(evento.cierra_at))
    : "sin cierre";
  return `${abre} → ${cierra}`;
}
