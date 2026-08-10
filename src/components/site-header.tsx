import Image from "next/image";
import Link from "next/link";
import { Chevron } from "@/components/icons/chevron";
import type { BrandConfig } from "@/lib/brands";

const NAV_LINKS = [
  { hash: "#como-funciona", label: "Cómo funciona", chevron: true },
] as const;

type SiteHeaderProps = {
  brand: BrandConfig;
};

export function SiteHeader({ brand }: SiteHeaderProps) {
  return (
    <header className="dl-nav dl-animate-fade">
      <div className="dl-container grid h-[3.25rem] grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Link
          className="justify-self-start inline-flex items-center gap-2 text-[13px] font-semibold tracking-tight"
          href={brand.homeHref}
          aria-label={`${brand.name} — inicio`}
        >
          {brand.logoSrc ? (
            <Image
              src={brand.logoSrc}
              alt={brand.logoAlt}
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
          ) : null}
          <span
            className={
              brand.logoSrc
                ? "hidden text-[#1077A1] sm:inline"
                : undefined
            }
          >
            {brand.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Principal">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.hash}
              className="dl-nav-link"
              href={`${brand.homeHref === "/" ? "" : brand.homeHref}${link.hash}`}
            >
              {link.label}
              {link.chevron ? <Chevron className="h-3 w-3 opacity-40" /> : null}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          {/* Botón "Entrar" oculto hasta habilitar el login públicamente. */}
          <Link className="dl-btn dl-btn-primary dl-btn-sm" href={brand.registerHref}>
            Unirme <Chevron />
          </Link>
        </div>
      </div>
    </header>
  );
}
