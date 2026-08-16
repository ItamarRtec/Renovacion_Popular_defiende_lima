import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** ¿El admin activó las 3 credenciales de campo? Ante error, se oculta. */
export async function credencialesVisibles(
  supabase?: SupabaseClient<Database>,
): Promise<boolean> {
  try {
    const client = supabase ?? (await createSupabaseServerClient());
    const { data, error } = await client.rpc("credenciales_visibles");
    if (error) {
      console.error(error);
      return false;
    }
    return Boolean(data);
  } catch {
    return false;
  }
}
