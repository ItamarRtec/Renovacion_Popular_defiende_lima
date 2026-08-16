import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { Suspense } from "react";
import { RegistroExitoRp } from "@/components/registro-exito-rp";
import { BRANDS } from "@/lib/brands";

const brand = BRANDS.renovacion_popular;

export const metadata: Metadata = {
  title: "Eso es todo amigos — Personero Renovación Popular",
  description:
    "Ya estás inscrito como personero. Invita a un amigo y espera tu local por WhatsApp en septiembre.",
};

async function absoluteRegisterUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}/unirme`;
}

export default async function RegistroListoPage() {
  const registerUrl = await absoluteRegisterUrl();

  return (
    <>
      <style>{`
        html { color-scheme: light; }
        body { background: #ffffff !important; color: #0b2a36; }
      `}</style>
      <div className="theme-rp flex min-h-full flex-1 flex-col bg-white text-[#0b2a36]">
        <header className="dl-nav no-print">
          <div className="dl-container flex h-[3.25rem] items-center justify-between gap-4">
            <Link
              className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-tight"
              href={brand.homeHref}
            >
              <Image
                src={brand.logoSrc}
                alt={brand.logoAlt}
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                priority
              />
              <span className="hidden text-[#1077A1] sm:inline">
                {brand.name}
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1">
          <section className="dl-container px-4 pb-20 pt-12 sm:pt-16">
            <Suspense fallback={null}>
              <RegistroExitoRp
                homeHref={brand.homeHref}
                registerUrl={registerUrl}
              />
            </Suspense>
          </section>
        </main>
      </div>
    </>
  );
}
