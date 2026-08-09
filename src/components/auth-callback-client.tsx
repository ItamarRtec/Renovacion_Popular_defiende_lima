"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { homePathForRole, safeNextPath } from "@/lib/auth-paths";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PlataformaRol, RegistroRow } from "@/lib/supabase/database.types";

function parseHashTokens(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

export function AuthCallbackClient() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirmando acceso…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = getSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const token_hash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      const hashTokens = parseHashTokens(window.location.hash);

      let authError: { message: string } | null = null;

      if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        authError = result.error;
      } else if (token_hash && type) {
        const result = await supabase.auth.verifyOtp({
          token_hash,
          type: type as "email",
        });
        authError = result.error;
      } else if (hashTokens) {
        const result = await supabase.auth.setSession(hashTokens);
        authError = result.error;
      } else {
        authError = { message: "missing_auth_params" };
      }

      if (cancelled) return;

      if (authError) {
        console.error(authError);
        router.replace("/entrar?error=auth");
        return;
      }

      const { data: linked } = await supabase.rpc("link_registro_user");
      const rol = ((linked as RegistroRow | null)?.plataforma_rol ??
        "personero") as PlataformaRol;

      const next = safeNextPath(url.searchParams.get("next"));
      const destino = next ?? homePathForRole(rol);

      setMessage("Listo. Redirigiendo…");
      router.replace(destino);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <p className="text-center text-sm text-muted" role="status">
      {message}
    </p>
  );
}
