import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import Link from "next/link";
import { EntrarForm } from "@/components/entrar-form";
import { BRANDS } from "@/lib/brands";

const rp = BRANDS.renovacion_popular;

export const metadata: Metadata = {
  title: "Entrar — Renovación Popular",
  description:
    "Ingreso de personeros y coordinadores. Correo + DNI.",
};

export default function EntrarPage() {
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
            <Link
              className="text-sm text-muted hover:text-[#1077A1]"
              href="/unirme"
            >
              Unirme
            </Link>
          </div>
        </header>

        <main className="dl-container flex flex-1 flex-col py-16">
          <Suspense
            fallback={
              <p className="text-center text-sm text-muted">Cargando…</p>
            }
          >
            <EntrarForm />
          </Suspense>
        </main>
      </div>
    </>
  );
}
