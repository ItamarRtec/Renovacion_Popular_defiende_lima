import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PromoteForm } from "@/components/admin/promote-form";
import { BRANDS } from "@/lib/brands";

const rp = BRANDS.renovacion_popular;

export const metadata: Metadata = {
  title: "Ops",
  robots: { index: false, follow: false },
};

export default function Admin1010Page() {
  return (
    <>
      <style>{`
        html { color-scheme: light; }
        body { background: #ffffff !important; color: #0b2a36; }
      `}</style>
      <div className="theme-rp flex min-h-full flex-1 flex-col bg-white text-[#0b2a36]">
        <header className="dl-nav">
          <div className="dl-container flex h-[3.25rem] items-center gap-2">
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
          <div className="mx-auto mb-10 max-w-md text-center">
            <p className="dl-kicker">Ops</p>
            <h1 className="dl-title mt-3 text-3xl">Promoción de roles</h1>
            <p className="mt-3 text-sm text-muted">
              Asigna coordinador o administrador por DNI. Requiere la clave de
              servidor.
            </p>
          </div>
          <PromoteForm />
        </main>
      </div>
    </>
  );
}
