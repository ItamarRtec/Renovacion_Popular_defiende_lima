import { ComoFunciona } from "@/components/como-funciona";
import { Hero } from "@/components/hero";
import { SiteHeader } from "@/components/site-header";
import { BRANDS } from "@/lib/brands";

const brand = BRANDS.defiende_lima;

export default function HomePage() {
  return (
    <main className="flex-1">
      <SiteHeader brand={brand} />
      <Hero brand={brand} />
      <ComoFunciona />
    </main>
  );
}
