import { Suspense } from "react";
import { AuthCallbackClient } from "@/components/auth-callback-client";

export default function AuthCallbackPage() {
  return (
    <>
      <style>{`
        html { color-scheme: light; }
        body { background: #ffffff !important; color: #0b2a36; }
      `}</style>
      <div className="theme-rp flex min-h-full flex-1 flex-col items-center justify-center bg-white px-6">
        <Suspense
          fallback={
            <p className="text-sm text-muted">Confirmando acceso…</p>
          }
        >
          <AuthCallbackClient />
        </Suspense>
      </div>
    </>
  );
}
