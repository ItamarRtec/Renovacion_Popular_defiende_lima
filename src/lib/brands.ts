import type { RegistroOrigen } from "@/lib/supabase/database.types";

export type BrandId = "defiende_lima" | "renovacion_popular";

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

/** Marca oficial en defiendelima.com (hero + registro público). */
export const BRANDS: Record<BrandId, BrandConfig> = {
  renovacion_popular: {
    id: "renovacion_popular",
    name: "Renovación Popular",
    shortName: "RP",
    homeHref: "/",
    registerHref: "/unirme",
    howHref: "/#como-funciona",
    origen: "renovacion_popular",
    logoSrc: "/brands/renovacion-popular/logo-r.png",
    logoAlt: "Renovación Popular",
    heroTitle: "Renovación Popular",
    heroHighlight: "Lima.",
    heroLede:
      "La red de personeros, miembros de mesa y ciudadanos de Renovación Popular para contar cada voto con transparencia.",
    announce: "Elecciones municipales · personeros RP",
    themeClass: "theme-rp",
  },
  /** Registro interno / legado (no es el hero público). */
  defiende_lima: {
    id: "defiende_lima",
    name: "Defiende Lima",
    shortName: "Defiende Lima",
    homeHref: "/dl/unirme",
    registerHref: "/dl/unirme",
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
};
