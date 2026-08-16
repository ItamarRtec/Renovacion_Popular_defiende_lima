/** Server prerequisites for /admin1010 login (tabla public.administradores). */

export function adminGateConfigured(): boolean {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return serviceRole.length > 20;
}

/** Env needed only to seed the first row when administradores is empty. */
export function adminBootstrapEnvReady(): boolean {
  const user = process.env.ADMIN_GATE_USER?.trim() ?? "";
  const pass = process.env.ADMIN_GATE_PASSWORD?.trim() ?? "";
  return user.length >= 3 && pass.length >= 8;
}
