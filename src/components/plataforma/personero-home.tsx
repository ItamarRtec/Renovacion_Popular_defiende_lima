import Link from "next/link";

export function PersoneroHome({
  nombres,
  mesa,
  mostrarCredencial,
  mostrarVideos,
  diaD,
}: {
  nombres: string;
  mesa: string | null;
  mostrarCredencial: boolean;
  mostrarVideos: boolean;
  diaD: boolean;
}) {
  return (
    <section className="mx-auto max-w-md">
      <p className="dl-kicker">{diaD ? "Día de elección" : "Tu mesa"}</p>
      <h1 className="dl-title mt-3 text-3xl">Hola, {nombres}</h1>
      <p className="mt-3 text-sm text-muted">
        Mesa {mesa?.trim() || "—"}.
      </p>
      <div className="mt-10 flex flex-col gap-4">
        <Link
          className="dl-btn dl-btn-primary min-h-20 w-full text-lg"
          href="/plataforma/qr"
        >
          Mostrar QR
        </Link>
        {diaD || mostrarCredencial ? (
          <Link
            className="dl-btn dl-btn-primary min-h-20 w-full text-lg"
            href="/plataforma/credencial"
          >
            Ver credencial
          </Link>
        ) : null}
        <Link
          className="dl-btn dl-btn-primary min-h-20 w-full text-lg"
          href="/plataforma/acta?tipo=instalacion_sufragio"
        >
          Acta de instalación
        </Link>
        <Link
          className="dl-btn dl-btn-primary min-h-20 w-full text-lg"
          href="/plataforma/acta?tipo=escrutinio"
        >
          Acta de escrutinio
        </Link>
        {!diaD && mostrarVideos ? (
          <Link
            className="dl-btn dl-btn-secondary min-h-20 w-full text-lg"
            href="/plataforma/videos"
          >
            Videos de capacitación
          </Link>
        ) : null}
      </div>
    </section>
  );
}
