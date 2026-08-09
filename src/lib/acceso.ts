import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * ¿Está abierta la ventana de acceso público? (server-side)
 * Ante cualquier error/ausencia de config se asume abierta (no bloquear
 * por un fallo transitorio); el cierre es una decisión explícita del admin.
 */
export async function accesoPublicoAbierto(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.rpc("acceso_publico_abierto");
    return data ?? true;
  } catch {
    return true;
  }
}
