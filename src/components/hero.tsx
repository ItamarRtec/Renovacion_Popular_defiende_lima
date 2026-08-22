import Image from "next/image";
import Link from "next/link";
import { Chevron } from "@/components/icons/chevron";
import type { BrandConfig } from "@/lib/brands";

type HeroProps = {
  brand: BrandConfig;
};

export function Hero({ brand }: HeroProps) {
  const isRp = brand.id === "renovacion_popular";

  if (isRp) {
    return (
      <section
        aria-labelledby="hero-heading"
        className="relative flex min-h-[calc(100svh-3.25rem)] items-center justify-center overflow-hidden px-4 pb-20 pt-10"
      >
        <div className="relative mx-auto flex w-full max-w-[40rem] flex-col items-center text-center">
          <Link className="dl-announce dl-animate-rise" href={brand.howHref}>
            <span className="dl-announce-new">Nuevo</span>
            <span>{brand.announce}</span>
            <Chevron className="h-3.5 w-3.5 opacity-50" />
          </Link>

          <div
            className="dl-animate-rise mx-auto mt-8 h-[6.5rem] w-[6.5rem] overflow-hidden rounded-full border-2 border-[#1077A1]/30 shadow-[0_10px_28px_rgb(16_119_161_/_0.2)]"
            style={{ animationDelay: "60ms" }}
          >
            <Image
              src="/brands/renovacion-popular/rafael-face.png"
              alt="Rafael López Aliaga"
              width={208}
              height={208}
              className="h-full w-full object-cover object-[50%_42%]"
              priority
            />
          </div>

          <p
            className="dl-animate-rise mt-6 text-[15px] font-semibold tracking-tight text-[#1077A1]"
            style={{ animationDelay: "90ms" }}
          >
            {brand.heroTitle}
          </p>

          <h1
            id="hero-heading"
            className="dl-animate-rise mt-3 max-w-[16ch] text-[clamp(2.75rem,8vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance text-[#0b2a36]"
            style={{ animationDelay: "110ms" }}
          >
            Sé nuestro personero
          </h1>

          <p
            className="dl-animate-rise mt-6 max-w-lg text-[17px] font-normal leading-[1.5] tracking-[-0.022em] text-muted sm:text-[19px]"
            style={{ animationDelay: "150ms" }}
          >
            Si votas en Lima{" "}
            <span className="dl-accent-underline">necesito tu apoyo</span>
          </p>

          <p
            className="dl-animate-rise mt-3 text-[14px] font-medium tracking-tight text-[#1077A1] sm:text-[15px]"
            style={{ animationDelay: "170ms" }}
          >
            Domingo 4 de octubre de 2026
          </p>

          <div
            className="dl-animate-rise mt-10 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "200ms" }}
          >
            <Link className="dl-btn dl-btn-primary" href={brand.registerHref}>
              Quiero ser personero <Chevron />
            </Link>
            <Link className="dl-btn dl-btn-secondary" href={brand.howHref}>
              Cómo funciona
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-[calc(100svh-3.25rem)] items-center justify-center overflow-hidden px-4 pb-20 pt-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgb(255 255 255 / 0.045), transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[52rem] flex-col items-center text-center">
        <Link className="dl-announce dl-animate-rise" href={brand.howHref}>
          <span className="dl-announce-new">Nuevo</span>
          <span>{brand.announce}</span>
          <Chevron className="h-3.5 w-3.5 opacity-50" />
        </Link>

        <h1
          id="hero-heading"
          className="dl-animate-rise mt-9 max-w-[22ch] text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[1.07] tracking-[-0.022em] text-balance text-white"
          style={{ animationDelay: "80ms" }}
        >
          <span className="block">{brand.heroTitle}</span>
          <span className="block">
            para que cada voto{" "}
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
