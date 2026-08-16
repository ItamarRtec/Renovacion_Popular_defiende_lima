/**
 * Verificación server-side de Cloudflare Turnstile (CAPTCHA).
 *
 * En `next dev` (localhost) se omite aunque existan las claves en .env.local.
 * En producción el CAPTCHA sigue obligatorio si TURNSTILE_SECRET_KEY está
 * configurada.
 */
export function isLocalTurnstileBypass(): boolean {
  return process.env.NODE_ENV === "development";
}

export function turnstileEnabled(): boolean {
  if (isLocalTurnstileBypass()) return false;
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(
  token: string | undefined | null,
  ip: string,
): Promise<boolean> {
  if (isLocalTurnstileBypass()) return true;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // no configurado: no se exige
  if (!token) return false;

  try {
    const form = new URLSearchParams();
    form.append("secret", secret);
    form.append("response", token);
    if (ip && !ip.startsWith("untrusted:") && ip !== "unknown") {
      form.append("remoteip", ip);
    }
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Fail-closed: si no se puede verificar el CAPTCHA, se rechaza.
    return false;
  }
}
