import type { Metadata } from "next";
import { ComoFunciona } from "@/components/como-funciona";
import { Hero } from "@/components/hero";
import { SiteHeader } from "@/components/site-header";
import { BRANDS } from "@/lib/brands";

const brand = BRANDS.renovacion_popular_claro;

export const metadata: Metadata = {
  title: "Renovación Popular — Fondo claro",
  description:
    "Variante fondo blanco de Renovación Popular para personeros, miembros de mesa y ciudadanos.",
};

export default function RenovacionPopularClaroPage() {
  return (
    <main className={`${brand.themeClass} flex-1`}>
      <SiteHeader brand={brand} />
      <Hero brand={brand} />
      <ComoFunciona />
    </main>
  );
}
