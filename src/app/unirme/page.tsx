import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RegistroForm } from "@/components/registro-form";
import { BRANDS } from "@/lib/brands";

const brand = BRANDS.renovacion_popular;

const PITCH = [
  "Te capacitas con 3 videos cortos desde tu celular.",
  "Te asignamos tu local de votación o el más cercano.",
  "Cobras por Yape o Plin al enviar el acta.",
] as const;

export const metadata: Metadata = {
  title: "Sé personero — Renovación Popular",
  description:
    "Si eres de Lima, Rafael te necesita en tu mesa. Un día y cobras por Yape o Plin.",
};

export default function UnirmePage() {
  return (
    <>
      <style>{`
        html { color-scheme: light; }
        body { background: #ffffff !important; color: #0b2a36; }
      `}</style>
      <div className="theme-rp flex min-h-full flex-1 flex-col bg-white text-[#0b2a36]">
        <header className="dl-nav">
          <div className="dl-container flex h-[3.25rem] items-center justify-between gap-4">
            <Link
              className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-tight"
              href={brand.homeHref}
            >
              <Image
                src={brand.logoSrc}
                alt={brand.logoAlt}
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                priority
              />
              <span className="hidden text-[#1077A1] sm:inline">
                {brand.name}
              </span>
            </Link>
            <Link className="dl-nav-link" href={brand.howHref}>
              Cómo funciona
            </Link>
          </div>
        </header>

        <main className="flex-1">
          <section className="dl-container px-4 pb-20 pt-12 sm:pt-16">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto mb-5 h-[5.75rem] w-[5.75rem] overflow-hidden rounded-full border-2 border-[#1077A1]/30 shadow-[0_8px_24px_rgb(16_119_161_/_0.18)]">
                <Image
                  src="/brands/renovacion-popular/rafael-face.png"
                  alt="Rafael López Aliaga sonriendo"
                  width={184}
                  height={184}
                  className="h-full w-full object-cover object-[50%_42%]"
                  priority
                />
              </div>
              <p className="dl-kicker">Elecciones · tu mesa cuenta</p>
              <h1 className="dl-title mt-3 text-[clamp(2.25rem,6vw,3rem)]">
                Sé personero.{" "}
                <span className="dl-accent-underline">Ya.</span>
              </h1>
              <p className="mx-auto mt-4 text-base leading-relaxed text-muted">
                Si eres de Lima, Rafael te necesita en{" "}
                <strong className="font-semibold text-[#0b2a36]">tu mesa</strong>
                . Un día y cobras por Yape o Plin.
              </p>
            </div>

            <ul className="mx-auto mt-10 grid max-w-3xl list-none grid-cols-3 gap-3 p-0 sm:gap-5">
              {PITCH.map((phrase, index) => (
                <li key={phrase} className="min-w-0 text-center">
                  <span
                    aria-hidden
                    className="font-[family-name:var(--font-data)] text-sm font-medium tracking-tight text-[#1077A1]"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 text-[13px] font-semibold leading-snug tracking-tight text-[#0b2a36] sm:text-sm">
                    {phrase}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <RegistroForm
                ctaLabel="Quiero ser personero"
                ctaPendingLabel="Anotándote…"
                footerNote="Toma menos de 1 minuto. Tus datos solo se usan para este proceso."
                homeHref={brand.homeHref}
                labels={{
                  nombres: "Tu nombre",
                  apellidos: "Tus apellidos",
                  dni: "Tu DNI",
                  telefono: "Tu celular (WhatsApp)",
                  email: "Tu correo",
                }}
                origen={brand.origen}
                placeholders={{
                  nombres: "María Elena",
                  apellidos: "Fernández Quispe",
                  dni: "8 dígitos",
                  telefono: "9 dígitos",
                  email: "nombre@correo.com",
                }}
                successHref="/unirme/listo"
              />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
