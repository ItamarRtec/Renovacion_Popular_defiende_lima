"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

function isLocalTurnstileBypass() {
  if (process.env.NODE_ENV === "development") return true;
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

/**
 * Widget de Cloudflare Turnstile (CAPTCHA).
 * En localhost / `next dev` no se muestra, aunque la site key esté en .env.local.
 */
export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const siteKey = isLocalTurnstileBypass()
    ? undefined
    : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;
    let widgetId: string | undefined;
    let cancelled = false;

    function render() {
      if (cancelled || !window.turnstile || !ref.current || widgetId) return;
      widgetId = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: (t: string) => onTokenRef.current(t),
        "expired-callback": () => onTokenRef.current(null),
        "error-callback": () => onTokenRef.current(null),
      });
    }

    if (window.turnstile) {
      render();
    } else {
      let s = document.querySelector<HTMLScriptElement>(
        `script[data-turnstile]`,
      );
      if (!s) {
        s = document.createElement("script");
        s.src = SCRIPT_SRC;
        s.async = true;
        s.defer = true;
        s.dataset.turnstile = "1";
        document.head.appendChild(s);
      }
      s.addEventListener("load", render);
    }

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          /* noop */
        }
      }
    };
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={ref} className="flex justify-center" />;
}

export function turnstileConfigured(): boolean {
  if (isLocalTurnstileBypass()) return false;
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}
