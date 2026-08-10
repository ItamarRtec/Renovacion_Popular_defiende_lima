import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad — Defiende Lima / Renovación Popular",
  description:
    "Tratamiento de datos personales de la iniciativa, conforme a la Ley 29733.",
};

// NOTA: BORRADOR. Completa los campos marcados con [COMPLETAR] (plazo de
// conservación, encargados adicionales) antes de publicar.
export default function PrivacidadPage() {
  return (
    <>
      <style>{`
        html { color-scheme: light; }
        body { background: #ffffff !important; color: #0b2a36; }
      `}</style>
      <div className="theme-rp min-h-full bg-white text-[#0b2a36]">
        <main className="dl-container mx-auto max-w-2xl px-4 py-16">
          <p className="dl-kicker">Datos personales</p>
          <h1 className="dl-title mt-3 text-3xl">Política de privacidad</h1>
          <p className="mt-3 text-sm text-muted">
            Tratamiento de datos conforme a la Ley N.º 29733 (Protección de Datos
            Personales del Perú) y su reglamento.
          </p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-medium">1. Responsable</h2>
              <p className="mt-2 text-muted">
                Responsable del banco de datos:{" "}
                <strong>Partido Político Renovación Popular</strong>, con
                domicilio en{" "}
                <strong>Calle Costa Rica Nº157, Jesús María, Lima</strong>.
                Contacto:{" "}
                <a
                  className="underline underline-offset-2"
                  href="mailto:renovacionpopularperu@gmail.com"
                >
                  renovacionpopularperu@gmail.com
                </a>{" "}
                / WhatsApp{" "}
                <a
                  className="underline underline-offset-2"
                  href="https://wa.me/51928037519"
                >
                  928 037 519
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium">2. Datos que recogemos</h2>
              <p className="mt-2 text-muted">
                Nombres y apellidos, DNI, celular, correo electrónico, ubicación
                electoral (región, provincia, distrito), centro de votación y
                número de mesa cuando los proporcionas, experiencia como
                personero y, si corresponde, tu afiliación a Renovación Popular
                (dato sensible, tratado con tu consentimiento reforzado).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium">3. Finalidad</h2>
              <p className="mt-2 text-muted">
                Organizar la participación ciudadana como personero de mesa:
                capacitarte, asignarte mesa, contactarte y coordinar la defensa
                del voto. No usamos tus datos para otros fines ni los vendemos.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium">4. Base legal</h2>
              <p className="mt-2 text-muted">
                Tu <strong>consentimiento libre, previo, expreso e informado</strong>,
                otorgado al marcar la casilla del formulario de inscripción.
                Puedes revocarlo en cualquier momento.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium">5. Destinatarios y encargados</h2>
              <p className="mt-2 text-muted">
                Tus datos se almacenan en Supabase (infraestructura del banco de
                datos) y se comparten únicamente con el equipo coordinador de la
                iniciativa.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium">6. Conservación</h2>
              <p className="mt-2 text-muted">
                Conservamos tus datos por <strong>6 meses</strong> o
                hasta que revoques tu consentimiento, tras lo cual se eliminan o
                anonimizan.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium">7. Tus derechos (ARCO)</h2>
              <p className="mt-2 text-muted">
                Puedes ejercer tus derechos de acceso, rectificación,
                cancelación y oposición escribiendo a{" "}
                <a
                  className="underline underline-offset-2"
                  href="mailto:renovacionpopularperu@gmail.com"
                >
                  renovacionpopularperu@gmail.com
                </a>
                . También puedes
                presentar un reclamo ante la Autoridad Nacional de Protección de
                Datos Personales.
              </p>
            </section>
          </div>

          <div className="mt-12">
            <Link className="dl-btn dl-btn-secondary" href="/unirme">
              ← Volver a la inscripción
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
