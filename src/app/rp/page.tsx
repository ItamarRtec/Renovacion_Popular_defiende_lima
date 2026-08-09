import type { Metadata } from "next";
import { ComoFunciona } from "@/components/como-funciona";
import { Hero } from "@/components/hero";
import { SiteHeader } from "@/components/site-header";
import { BRANDS } from "@/lib/brands";

const brand = BRANDS.renovacion_popular;

export const metadata: Metadata = {
  title: "Renovación Popular — Personeros",
  description:
    "Regístrate como personero, miembro de mesa o ciudadano con Renovación Popular. Cada voto cuenta.",
};

export default function RenovacionPopularPage() {
  return (
    <main className="flex-1">
      <SiteHeader brand={brand} />
      <Hero brand={brand} />
      <ComoFunciona />
    </main>
  );
}
