/**
 * Rate limiter best-effort en memoria (por instancia).
 *
 * Suficiente para frenar barridos triviales desde una sola IP. En
 * producción serverless con múltiples instancias, reemplazar por un
 * limitador distribuido (Upstash Redis / Vercel KV) para garantía real.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

/**
 * IP del cliente desde una fuente CONFIABLE.
 *
 * En Vercel, el edge inyecta `x-vercel-forwarded-for` / `x-real-ip` con la IP
 * real del cliente y NO son falsificables por el navegador. NO se usa el
 * `x-forwarded-for` más a la izquierda (lo controla el cliente). Fuera de
 * Vercel, ajustar a la fuente confiable del proxy correspondiente.
 */
function looksLikeIp(v: string): boolean {
  return /^[0-9a-fA-F:.]{3,45}$/.test(v);
}

export function clientIp(request: Request): string {
  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) {
    const ip = vercel.split(",")[0]!.trim();
    if (looksLikeIp(ip)) return ip;
  }
  const real = request.headers.get("x-real-ip");
  if (real && looksLikeIp(real.trim())) return real.trim();
  // Fallback no confiable: se etiqueta para no mezclarlo con IPs verificadas.
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return `untrusted:${xff.split(",")[0]!.trim()}`;
  return "unknown";
}
