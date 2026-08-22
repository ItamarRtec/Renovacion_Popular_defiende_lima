import type { Metadata } from "next";
import { ComoFunciona } from "@/components/como-funciona";
import { Hero } from "@/components/hero";
import { SiteHeader } from "@/components/site-header";
import { BRANDS } from "@/lib/brands";

const brand = BRANDS.renovacion_popular;

export const metadata: Metadata = {
  title: "Sé nuestro personero — Renovación Popular",
  description:
    "Elecciones municipales 2027. Domingo 4 de octubre de 2026. Si votas en Lima necesito tu apoyo",
};

export default function HomePage() {
  return (
    <>
      <style>{`
        html { color-scheme: light; }
        body { background: #ffffff !important; color: #0b2a36; }
      `}</style>
      <div className="theme-rp flex min-h-full flex-1 flex-col bg-white text-[#0b2a36]">
        <main className="flex-1">
          <SiteHeader brand={brand} />
          <Hero brand={brand} />
          <ComoFunciona />
        </main>
      </div>
    </>
  );
}
