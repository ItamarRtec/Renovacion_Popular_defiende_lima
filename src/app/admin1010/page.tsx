import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminGateLogin } from "@/components/admin/gate-login";
import { adminGateConfigured } from "@/lib/admin-gate";
import { getAdminSession } from "@/lib/admin-session";
import { BRANDS } from "@/lib/brands";

const rp = BRANDS.renovacion_popular;

export const metadata: Metadata = {
  title: "Admin — Entrar",
  robots: { index: false, follow: false },
};

export default async function Admin1010Page() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const configured = adminGateConfigured();

  return (
    <>
      <style>{`
        html { color-scheme: light; }
        body { background: #ffffff !important; color: #0b2a36; }
      `}</style>
      <div className="theme-rp flex min-h-full flex-1 flex-col bg-white text-[#0b2a36]">
        <header className="dl-nav">
          <div className="dl-container flex h-[3.25rem] items-center justify-between gap-4">
            <Link
              className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-tight text-[#1077A1]"
              href={rp.homeHref}
              aria-label={`${rp.name} — inicio`}
            >
              <Image
                src={rp.logoSrc}
                alt={rp.logoAlt}
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                priority
              />
              <span className="hidden sm:inline">{rp.name}</span>
            </Link>
          </div>
        </header>

        <main className="dl-container flex flex-1 flex-col py-16">
          {configured ? (
            <AdminGateLogin />
          ) : (
            <p className="mx-auto max-w-md text-center text-sm text-[#c2410c]">
              Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.
            </p>
          )}
        </main>
      </div>
    </>
  );
}
