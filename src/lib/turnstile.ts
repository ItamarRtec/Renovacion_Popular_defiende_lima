/**
 * Verificación server-side de Cloudflare Turnstile (CAPTCHA).
 *
 * Si TURNSTILE_SECRET_KEY no está configurada (p. ej. en desarrollo local),
 * la verificación se OMITE y devuelve true. En producción/el evento DEBE estar
 * configurada para que el CAPTCHA sea efectivo.
 */
export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(
  token: string | undefined | null,
  ip: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // no configurado: no se exige (dev)
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
