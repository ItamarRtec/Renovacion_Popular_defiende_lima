import type { RegistroOrigen } from "@/lib/supabase/database.types";

export type BrandId =
  | "defiende_lima"
  | "renovacion_popular"
  | "renovacion_popular_claro";

export type BrandConfig = {
  id: BrandId;
  name: string;
  shortName: string;
  homeHref: string;
  registerHref: string;
  howHref: string;
  origen: RegistroOrigen;
  logoSrc: string;
  logoAlt: string;
  heroTitle: string;
  heroHighlight: string;
  heroLede: string;
  announce: string;
  themeClass: string;
};

const RP_COPY = {
  name: "Renovación Popular",
  shortName: "RP",
  origen: "renovacion_popular" as const,
  logoSrc: "/brands/renovacion-popular/logo-r.png",
  logoAlt: "Renovación Popular",
  heroTitle: "Renovación Popular",
  heroHighlight: "Lima.",
  heroLede:
    "La red de personeros, miembros de mesa y ciudadanos de Renovación Popular para contar cada voto con transparencia.",
  announce: "Elecciones municipales · personeros RP",
};

export const BRANDS: Record<BrandId, BrandConfig> = {
  defiende_lima: {
    id: "defiende_lima",
    name: "Defiende Lima",
    shortName: "Defiende Lima",
    homeHref: "/",
    registerHref: "/unirme",
    howHref: "/#como-funciona",
    origen: "defiende_lima",
    logoSrc: "",
    logoAlt: "Defiende Lima",
    heroTitle: "Defiende Lima",
    heroHighlight: "cuente.",
    heroLede:
      "La red más grande de personeros, miembros de mesa y ciudadanos para contar cada voto con transparencia.",
    announce: "Elecciones Lima 2026 · coordinación ciudadana",
    themeClass: "",
  },
  renovacion_popular: {
    id: "renovacion_popular",
    ...RP_COPY,
    homeHref: "/rp",
    registerHref: "/rp/unirme",
    howHref: "/rp#como-funciona",
    themeClass: "theme-rp",
  },
  renovacion_popular_claro: {
    id: "renovacion_popular_claro",
    ...RP_COPY,
    homeHref: "/rp/claro",
    registerHref: "/rp/claro/unirme",
    howHref: "/rp/claro#como-funciona",
    themeClass: "theme-rp-light",
  },
};
