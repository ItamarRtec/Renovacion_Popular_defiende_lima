import Link from "next/link";
import { CredencialAcciones } from "@/components/credencial-acciones";
import { credencialFromRegistro, tituloCredencial } from "@/lib/credencial";
import { credencialesVisibles } from "@/lib/credencial-visible";
import { diaDActivo } from "@/lib/dia-d";
import { renderPersoneroQrDataUrl } from "@/lib/personero-qr";
import type { RegistroRow } from "@/lib/supabase/database.types";

export async function CredencialVista({
  registro,
  homeHref,
}: {
  registro: RegistroRow | null;
  homeHref: string;
}) {
  const [mostrar, diaD] = await Promise.all([
    credencialesVisibles(),
    diaDActivo(),
  ]);

  if (!mostrar && !diaD) {
    return (
      <section className="mx-auto max-w-lg text-center">
        <p className="dl-kicker">Credencial</p>
        <h1 className="dl-title mt-3 text-3xl">Aún no disponible</h1>
        <p className="mt-3 text-sm text-muted">
          La credencial se publicará cuando el equipo de Renovación Popular la
          active.
        </p>
        <Link className="dl-btn dl-btn-secondary mt-8" href={homeHref}>
          Volver
        </Link>
      </section>
    );
  }

  if (!registro) {
    return (
      <section className="mx-auto max-w-lg text-center">
        <p className="dl-kicker">Credencial</p>
        <h1 className="dl-title mt-3 text-3xl">Sin inscripción</h1>
        <Link className="dl-btn dl-btn-primary mt-8" href="/unirme">
          Ir a inscripción
        </Link>
      </section>
    );
  }

  const data = credencialFromRegistro(registro);
  if (!data) {
    return (
      <section className="mx-auto max-w-lg text-center">
        <p className="dl-kicker">Credencial</p>
        <h1 className="dl-title mt-3 text-3xl">Sin credencial de campo</h1>
        <p className="mt-3 text-sm text-muted">
          El centro de control no usa credencial impresa.
        </p>
        <Link className="dl-btn dl-btn-secondary mt-8" href={homeHref}>
          Volver
        </Link>
      </section>
    );
  }

  const qrDataUrl = await renderPersoneroQrDataUrl(registro.id, {
    dark: "#000000",
  });

  return (
    <section className="mx-auto max-w-3xl">
      <div className="no-print mx-auto max-w-lg text-center">
        <p className="dl-kicker">Credencial</p>
        <h1 className="dl-title mt-3 text-3xl">{tituloCredencial(data)}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Descárgala o imprímela. El QR te identifica en el local.
        </p>
      </div>
      <div className="mt-8">
        <CredencialAcciones data={data} qrDataUrl={qrDataUrl} />
      </div>
    </section>
  );
}
