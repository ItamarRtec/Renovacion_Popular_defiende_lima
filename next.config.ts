import type { NextConfig } from "next";

// Next.js necesita 'unsafe-eval' para HMR solo en desarrollo.
// Cloudflare Turnstile (CAPTCHA) carga su script y su iframe desde challenges.cloudflare.com.
const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${
  isDev ? " 'unsafe-eval'" : ""
}`;

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Defensa en profundidad. `frame-ancestors 'none'` refuerza X-Frame-Options.
  // YouTube se embebe vía <iframe> hacia youtube.com; Supabase es el connect-src.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline'",
      scriptSrc,
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com",
      "font-src 'self' data:",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/rp/claro",
        destination: "/rp",
        permanent: true,
      },
      {
        source: "/rp/claro/unirme",
        destination: "/rp/unirme",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
