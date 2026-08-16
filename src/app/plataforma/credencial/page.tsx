import Link from "next/link";
import { CredencialAcciones } from "@/components/credencial-acciones";
import { renderPersoneroQrDataUrl } from "@/lib/personero-qr";
import { getSessionRegistro } from "@/lib/plataforma";

export default async function PlataformaCredencialPage() {
  const { registro } = await getSessionRegistro();

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

  const qrDataUrl = await renderPersoneroQrDataUrl(registro.id, {
    dark: "#000000",
  });

  return (
    <section className="mx-auto max-w-3xl">
      <div className="no-print mx-auto max-w-lg text-center">
        <p className="dl-kicker">Credencial</p>
        <h1 className="dl-title mt-3 text-3xl">Tu credencial de personero</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Descárgala o imprímela. El QR es el mismo de tu asistencia.
        </p>
      </div>
      <div className="mt-8">
        <CredencialAcciones
          data={{
            nombres: registro.nombres,
            apellidos: registro.apellidos,
            dni: registro.dni,
            numero_mesa: registro.numero_mesa,
            centro_votacion: registro.centro_votacion,
            provincia: registro.provincia,
            distrito: registro.distrito,
            rol_mesa: registro.rol_mesa,
            emitidaEl: registro.created_at,
          }}
          qrDataUrl={qrDataUrl}
        />
      </div>
    </section>
  );
}
