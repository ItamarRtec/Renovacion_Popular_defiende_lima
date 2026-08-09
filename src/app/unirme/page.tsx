import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RegistroForm } from "@/components/registro-form";
import { BRANDS } from "@/lib/brands";

const brand = BRANDS.renovacion_popular;

export const metadata: Metadata = {
  title: "Registro de Personeros de Mesa — Renovación Popular",
  description:
    "Regístrate como personero de mesa con Renovación Popular.",
};

export default function UnirmePage() {
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
            <Link className="dl-nav-link" href={brand.howHref}>
              Cómo funciona
            </Link>
          </div>
        </header>

        <main className="flex-1">
          <section className="dl-container px-4 pb-20 pt-12 sm:pt-16">
            <div className="mx-auto max-w-md text-center">
              <p className="dl-kicker">Paso 1 · Registro</p>
              <h1 className="dl-title mt-3 text-[clamp(2rem,5vw,2.75rem)]">
                Registro de Personeros de Mesa
              </h1>
              <p className="mx-auto mt-4 text-base leading-relaxed text-muted">
                Completa tus datos. Luego te capacitamos, te asignamos mesa y
                defiendes el voto con Renovación Popular.
              </p>
            </div>

            <div className="mt-10">
              <RegistroForm homeHref={brand.homeHref} origen={brand.origen} />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
