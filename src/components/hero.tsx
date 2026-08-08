import Link from "next/link";
import { Chevron } from "@/components/icons/chevron";
import type { BrandConfig } from "@/lib/brands";

type HeroProps = {
  brand: BrandConfig;
};

export function Hero({ brand }: HeroProps) {
  const titleRest =
    brand.id === "defiende_lima" ? "para que cada voto" : "por cada voto en";

  const atmosphere =
    brand.id === "renovacion_popular_claro"
      ? "radial-gradient(ellipse 80% 50% at 50% -10%, rgb(16 119 161 / 0.16), transparent 65%)"
      : brand.id === "renovacion_popular"
        ? "radial-gradient(ellipse 80% 50% at 50% -10%, rgb(16 119 161 / 0.38), transparent 65%), radial-gradient(ellipse 50% 40% at 85% 90%, rgb(1 105 138 / 0.2), transparent 55%)"
        : "radial-gradient(ellipse 70% 45% at 50% 0%, rgb(255 255 255 / 0.045), transparent 70%)";

  const isRp =
    brand.id === "renovacion_popular" || brand.id === "renovacion_popular_claro";

  const subtitleColor =
    brand.id === "renovacion_popular_claro" ? "text-[#0b2a36]" : "text-white";

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-[calc(100svh-3.25rem)] items-center justify-center overflow-hidden px-4 pb-20 pt-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: atmosphere }}
      />

      <div className="relative mx-auto flex w-full max-w-[52rem] flex-col items-center text-center">
        <Link className="dl-announce dl-animate-rise" href={brand.howHref}>
          <span className="dl-announce-new">Nuevo</span>
          <span>{brand.announce}</span>
          <Chevron className="h-3.5 w-3.5 opacity-50" />
        </Link>

        <h1
          id="hero-heading"
          className={`dl-animate-rise mt-9 max-w-[22ch] text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[1.07] tracking-[-0.022em] text-balance ${subtitleColor}`}
          style={{ animationDelay: "80ms" }}
        >
          <span
            className={`block ${isRp ? "text-[#1077A1]" : ""}`}
          >
            {brand.heroTitle}
          </span>
          <span className="block">
            {titleRest}{" "}
            <span className="dl-accent-underline">{brand.heroHighlight}</span>
          </span>
        </h1>

        <p
          className="dl-animate-rise mt-7 max-w-xl text-[17px] font-normal leading-[1.47059] tracking-[-0.022em] text-muted sm:text-[19px]"
          style={{ animationDelay: "140ms" }}
        >
          {brand.heroLede}
        </p>

        <div
          className="dl-animate-rise mt-10 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "200ms" }}
        >
          <Link className="dl-btn dl-btn-primary" href={brand.registerHref}>
            Unirme ahora <Chevron />
          </Link>
          <Link className="dl-btn dl-btn-secondary" href={brand.howHref}>
            Cómo funciona
          </Link>
        </div>
      </div>
    </section>
  );
}
