import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PlataformaRol,
  RegistroRow,
} from "@/lib/supabase/database.types";
import { homePathForRole } from "@/lib/auth-paths";

export { homePathForRole };

export async function getSessionRegistro(): Promise<{
  userId: string;
  email: string;
  registro: RegistroRow | null;
  plataformaRol: PlataformaRol;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      userId: "",
      email: "",
      registro: null,
      plataformaRol: "personero",
    };
  }

  const { data: linked } = await supabase.rpc("link_registro_user");

  if (linked) {
    const registro = linked as RegistroRow;
    return {
      userId: user.id,
      email: user.email,
      registro,
      plataformaRol: registro.plataforma_rol ?? "personero",
    };
  }

  const { data: registro } = await supabase
    .from("registros")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email,
    registro: registro,
    plataformaRol: registro?.plataforma_rol ?? "personero",
  };
}
