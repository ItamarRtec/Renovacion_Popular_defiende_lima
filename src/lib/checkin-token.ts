import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 180; // 180 días (cubre el 4 oct 2026)

/** Firma de respaldo si Vercel aún no tiene CHECKIN_QR_SECRET. */
const FALLBACK_QR_SECRET = "rp-personero-qr-v1-defiende-lima-2026xx";

function secret(): string | null {
  const s = process.env.CHECKIN_QR_SECRET?.trim();
  if (s && s.length >= 16) return s;
  return FALLBACK_QR_SECRET;
}

export function checkInQrConfigured(): boolean {
  return secret() !== null;
}

export function signCheckInToken(
  registroId: string,
  ttlMs = DEFAULT_TTL_MS,
): string {
  const key = secret();
  if (!key) {
    throw new Error("CHECKIN_QR_SECRET no configurado");
  }
  const exp = Date.now() + ttlMs;
  const payload = Buffer.from(
    JSON.stringify({ rid: registroId, exp }),
    "utf8",
  ).toString("base64url");
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `dl1.${payload}.${sig}`;
}

export function verifyCheckInToken(
  token: string,
): { registroId: string } | null {
  const key = secret();
  if (!key) return null;

  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts[0] !== "dl1") return null;
  const [, payload, sig] = parts;
  if (!payload || !sig) return null;

  const expected = createHmac("sha256", key).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { rid?: string; exp?: number };
    if (!data.rid || typeof data.exp !== "number") return null;
    if (data.exp < Date.now()) return null;
    return { registroId: data.rid };
  } catch {
    return null;
  }
}
