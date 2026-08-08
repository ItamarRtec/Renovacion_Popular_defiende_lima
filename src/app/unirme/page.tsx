import type { Metadata } from "next";
import Link from "next/link";
import { RegistroForm } from "@/components/registro-form";
import { BRANDS } from "@/lib/brands";

const brand = BRANDS.defiende_lima;

export const metadata: Metadata = {
  title: "Registro de Personeros de Mesa — Defiende Lima",
  description:
    "Registro de personeros de mesa para Defiende Lima 2026.",
};

export default function UnirmePage() {
  return (
    <main className="flex-1">
      <header className="dl-nav">
        <div className="dl-container flex h-[3.25rem] items-center justify-between gap-4">
          <Link
            className="text-[13px] font-semibold tracking-tight text-white"
            href={brand.homeHref}
          >
            {brand.name}
          </Link>
          <Link className="dl-nav-link" href={brand.howHref}>
            Cómo funciona
          </Link>
        </div>
      </header>

      <section className="dl-container px-4 pb-20 pt-12 sm:pt-16">
        <div className="mx-auto max-w-md text-center">
          <p className="dl-kicker">Paso 1 · Registro</p>
          <h1 className="dl-title mt-3 text-[clamp(2rem,5vw,2.75rem)]">
            Registro de Personeros de Mesa
          </h1>
          <p className="mx-auto mt-4 text-base leading-relaxed text-muted">
            Completa tus datos. Luego te capacitamos, te asignamos mesa y
            defiendes el voto contigo.
          </p>
        </div>

        <div className="mt-10">
          <RegistroForm homeHref={brand.homeHref} origen={brand.origen} />
        </div>
      </section>
    </main>
  );
}
