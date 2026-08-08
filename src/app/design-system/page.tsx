import Link from "next/link";
import { Chevron } from "@/components/icons/chevron";

const COLORS = [
  {
    group: "Core — canvas & type",
    items: [
      { name: "black", token: "--dl-black", hex: "#000000", className: "bg-black" },
      { name: "zinc-950", token: "--dl-zinc-950", hex: "#0A0A0A", className: "bg-zinc-950" },
      { name: "zinc-900", token: "--dl-zinc-900", hex: "#141414", className: "bg-zinc-900" },
      { name: "zinc-800", token: "--dl-zinc-800", hex: "#1F1F1F", className: "bg-zinc-800" },
      { name: "zinc-400", token: "--dl-zinc-400", hex: "#888888", className: "bg-zinc-400" },
      { name: "white", token: "--dl-white", hex: "#FFFFFF", className: "bg-white" },
    ],
  },
  {
    group: "Accents",
    items: [
      { name: "new", token: "--dl-new", hex: "#FF6B00", className: "bg-new" },
      { name: "signal", token: "--dl-signal-500", hex: "#EF4D2B", className: "bg-signal-500" },
      { name: "ocean", token: "--dl-ocean-500", hex: "#3B82F6", className: "bg-ocean-500" },
    ],
  },
  {
    group: "Semánticos",
    items: [
      { name: "success", token: "--dl-success-500", hex: "#22C55E", className: "bg-success-500" },
      { name: "warning", token: "--dl-warning-500", hex: "#EAB308", className: "bg-warning-500" },
      { name: "danger", token: "--dl-danger-500", hex: "#EF4444", className: "bg-danger-500" },
      { name: "info", token: "--dl-info-500", hex: "#3B82F6", className: "bg-info-500" },
    ],
  },
] as const;

const TYPE_SAMPLES = [
  {
    label: "Display XL",
    sample: "Defiende Lima",
    meta: "SF Pro / Apple stack · 600 · clamp(2.5rem, 7vw, 4.5rem)",
    className:
      "font-[family-name:var(--font-brand)] text-[clamp(2.5rem,7vw,4.5rem)] font-semibold tracking-[-0.022em] text-white leading-[1.07]",
  },
  {
    label: "Heading 1",
    sample: "Cada voto cuenta",
    meta: "SF Pro / Apple stack · 600 · 2.25rem",
    className:
      "font-[family-name:var(--font-brand)] text-4xl font-semibold tracking-[-0.022em] text-white",
  },
  {
    label: "Body muted",
    sample:
      "Coordina personeros, miembros de mesa y ciudadanos para que cada voto en Lima 2026 sea contado con transparencia.",
    meta: "SF Pro / Apple stack · 400 · 17–19px · muted #888",
    className: "text-[17px] leading-[1.47059] tracking-[-0.022em] text-muted max-w-xl",
  },
  {
    label: "Data / conteo",
    sample: "Mesa 1247 · 348 votos · 100%",
    meta: "Geist Mono 500",
    className:
      "font-[family-name:var(--font-data)] text-base font-medium text-zinc-200 tracking-tight",
  },
] as const;

export default function DesignSystemPage() {
  return (
    <main className="flex-1 pb-24">
      <header className="dl-nav">
        <div className="dl-container flex h-[3.25rem] items-center justify-between gap-4">
          <Link className="text-[13px] font-semibold tracking-tight text-white" href="/">
            Defiende Lima
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Design system">
            <a className="dl-nav-link" href="#colores">
              Colores
            </a>
            <a className="dl-nav-link" href="#tipografia">
              Tipo
            </a>
            <a className="dl-nav-link" href="#componentes">
              Componentes
            </a>
            <a className="dl-nav-link" href="#roles">
              Roles
            </a>
          </nav>
          <Link className="dl-btn dl-btn-primary dl-btn-sm" href="/">
            Ver landing <Chevron />
          </Link>
        </div>
      </header>

      <section className="dl-section">
        <div className="dl-container mx-auto max-w-2xl text-center">
          <p className="dl-kicker">Design system</p>
          <h1 className="dl-title mt-3 text-4xl sm:text-5xl">Paleta & tokens</h1>
          <p className="mx-auto mt-4 dl-lede">
            Referencia visual. North star:{" "}
            <a className="text-zinc-200 underline decoration-zinc-600 underline-offset-4 hover:text-white" href="https://x.ai" rel="noreferrer" target="_blank">
              x.ai
            </a>
            .
          </p>
        </div>
      </section>

      <section id="colores" className="dl-section scroll-mt-16 pt-0">
        <div className="dl-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="dl-kicker">01 · Color</p>
            <h2 className="dl-title mt-3 text-3xl sm:text-4xl">Paleta</h2>
          </div>
          <div className="mt-12 space-y-10">
            {COLORS.map((group) => (
              <div key={group.group}>
                <h3 className="mb-4 text-sm font-medium text-zinc-400">{group.group}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  {group.items.map((color) => (
                    <div key={color.name} className="dl-swatch">
                      <div className={`dl-swatch-chip ${color.className}`} />
                      <div className="space-y-1 p-3">
                        <p className="text-sm font-medium text-white">{color.name}</p>
                        <p className="font-[family-name:var(--font-data)] text-xs text-muted">
                          {color.hex}
                        </p>
                        <p className="font-[family-name:var(--font-data)] text-[11px] text-zinc-600">
                          {color.token}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tipografia" className="dl-section scroll-mt-16">
        <div className="dl-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="dl-kicker">02 · Tipografía</p>
            <h2 className="dl-title mt-3 text-3xl sm:text-4xl">Jerarquía</h2>
          </div>
          <div className="dl-panel mx-auto mt-12 max-w-3xl px-6 sm:px-8">
            {TYPE_SAMPLES.map((item) => (
              <div key={item.label} className="dl-type-sample">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-500">{item.label}</span>
                  <span className="font-[family-name:var(--font-data)] text-[11px] text-zinc-600">
                    {item.meta}
                  </span>
                </div>
                <p className={item.className}>{item.sample}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="componentes" className="dl-section scroll-mt-16">
        <div className="dl-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="dl-kicker">03 · Componentes</p>
            <h2 className="dl-title mt-3 text-3xl sm:text-4xl">Controles</h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <article className="dl-panel p-6">
              <h3 className="text-lg font-semibold text-white">Botones</h3>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" className="dl-btn dl-btn-primary">
                  Unirme ahora <Chevron />
                </button>
                <button type="button" className="dl-btn dl-btn-secondary">
                  Cómo funciona
                </button>
                <button type="button" className="dl-btn dl-btn-ghost">
                  Cancelar
                </button>
              </div>
            </article>
            <article className="dl-panel p-6">
              <h3 className="text-lg font-semibold text-white">Formularios</h3>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="dl-label" htmlFor="ds-dni">
                    DNI
                  </label>
                  <input
                    id="ds-dni"
                    className="dl-input font-[family-name:var(--font-data)]"
                    placeholder="12345678"
                    type="text"
                  />
                </div>
                <button type="button" className="dl-btn dl-btn-primary">
                  Registrar <Chevron />
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="roles" className="dl-section scroll-mt-16">
        <div className="dl-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="dl-kicker">04 · Roles</p>
            <h2 className="dl-title mt-3 text-3xl sm:text-4xl">Lenguaje del sistema</h2>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <span className="dl-badge dl-badge-personero">Personero</span>
            <span className="dl-badge dl-badge-mesa">Miembro de mesa</span>
            <span className="dl-badge dl-badge-ciudadano">Ciudadano</span>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <span className="dl-status text-success-500">
              <span className="dl-status-dot bg-success-500" />
              Acta cargada
            </span>
            <span className="dl-status text-warning-500">
              <span className="dl-status-dot bg-warning-500" />
              En conteo
            </span>
            <span className="dl-status text-danger-500">
              <span className="dl-status-dot bg-danger-500" />
              Incidencia
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
