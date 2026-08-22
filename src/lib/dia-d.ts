import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** ¿El admin activó la ventana de 3 botones del día D? Ante error, no. */
export async function diaDActivo(
  supabase?: SupabaseClient<Database>,
): Promise<boolean> {
  try {
    const client = supabase ?? (await createSupabaseServerClient());
    const { data, error } = await client.rpc("dia_d_activo");
    if (error) {
      console.error(error);
      return false;
    }
    return Boolean(data);
  } catch {
    return false;
  }
}
