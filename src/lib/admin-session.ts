import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const ADMIN_SESSION_COOKIE = "dl_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h

export type AdminSession = {
  id: string;
  usuario: string;
  nombre: string;
};

function sessionSecret(): string | null {
  const s =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_GATE_PASSWORD?.trim() ||
    "";
  return s.length >= 8 ? s : null;
}

function signPayload(payload: string): string {
  const key = sessionSecret();
  if (!key) throw new Error("ADMIN_SESSION_SECRET / ADMIN_GATE_PASSWORD missing");
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function createAdminSessionToken(session: AdminSession): string {
  const body = Buffer.from(
    JSON.stringify({
      id: session.id,
      usuario: session.usuario,
      nombre: session.nombre,
      exp: Date.now() + SESSION_TTL_MS,
    }),
    "utf8",
  ).toString("base64url");
  return `a1.${body}.${signPayload(body)}`;
}

export function parseAdminSessionToken(
  token: string | undefined | null,
): AdminSession | null {
  if (!token || !sessionSecret()) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "a1") return null;
  const [, body, sig] = parts;
  if (!body || !sig) return null;
  const expected = signPayload(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as {
      id?: string;
      usuario?: string;
      nombre?: string;
      exp?: number;
    };
    if (!data.id || !data.usuario || typeof data.exp !== "number") return null;
    if (data.exp < Date.now()) return null;
    return {
      id: data.id,
      usuario: data.usuario,
      nombre: data.nombre ?? data.usuario,
    };
  } catch {
    return null;
  }
}

export function getAdminSessionFromRequest(
  request: NextRequest,
): AdminSession | null {
  return parseAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  return parseAdminSessionToken(jar.get(ADMIN_SESSION_COOKIE)?.value);
}

export function adminSessionCookieOptions(token: string) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

export type AdminDb = SupabaseClient<Database>;

export async function requireAdminDb(): Promise<{
  session: AdminSession;
  supabase: AdminDb;
}> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED_ADMIN");
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("MISSING_SERVICE_ROLE");
  }
  return { session, supabase };
}

export async function requireAdminDbFromRequest(request: NextRequest): Promise<{
  session: AdminSession;
  supabase: AdminDb;
}> {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    throw new Error("UNAUTHORIZED_ADMIN");
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("MISSING_SERVICE_ROLE");
  }
  return { session, supabase };
}

export async function hashAdminPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyAdminPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/** If table empty, seed first admin from ADMIN_GATE_USER / ADMIN_GATE_PASSWORD. */
export async function ensureBootstrapAdmin(supabase: AdminDb): Promise<void> {
  const { count, error } = await supabase
    .from("administradores")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  if ((count ?? 0) > 0) return;

  const usuario = process.env.ADMIN_GATE_USER?.trim() ?? "";
  const password = process.env.ADMIN_GATE_PASSWORD?.trim() ?? "";
  if (usuario.length < 3 || password.length < 8) {
    throw new Error("BOOTSTRAP_ENV_MISSING");
  }

  const password_hash = await hashAdminPassword(password);
  const { error: insertError } = await supabase.from("administradores").insert({
    usuario,
    password_hash,
    nombre: "Administrador",
    activo: true,
  });
  if (insertError) throw insertError;
}

export async function authenticateAdministrador(
  usuario: string,
  password: string,
): Promise<AdminSession | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  await ensureBootstrapAdmin(supabase);

  const { data, error } = await supabase
    .from("administradores")
    .select("id, usuario, nombre, password_hash, activo")
    .ilike("usuario", usuario.trim())
    .maybeSingle();

  if (error || !data || !data.activo) return null;
  const ok = await verifyAdminPassword(password, data.password_hash);
  if (!ok) return null;

  return {
    id: data.id,
    usuario: data.usuario,
    nombre: data.nombre || data.usuario,
  };
}
