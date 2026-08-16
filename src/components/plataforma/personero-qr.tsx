import Link from "next/link";

type PersoneroQrProps = {
  dataUrl: string;
  mesa: string | null;
  nombre: string;
  eventoNombre?: string | null;
  esEnsayo?: boolean;
};

export function PersoneroQr({
  dataUrl,
  mesa,
  nombre,
  eventoNombre,
  esEnsayo,
}: PersoneroQrProps) {
  const kicker = esEnsayo
    ? "Ensayo de asistencia"
    : eventoNombre
      ? "Día de la elección"
      : "Tu código";
  const lede = esEnsayo
    ? "Muéstralo al coordinador para probar el check-in. Este ensayo no cuenta para el pago."
    : "Este QR es solo tuyo. Muéstralo al coordinador en el local para registrar tu llegada.";

  return (
    <div className="mx-auto max-w-sm text-center">
      <p className="dl-kicker">{kicker}</p>
      <h1 className="dl-title mt-3 text-3xl">Tu QR de asistencia</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{lede}</p>
      {eventoNombre ? (
        <p className="mt-2 text-xs text-muted">{eventoNombre}</p>
      ) : null}

      <div className="dl-panel mx-auto mt-8 px-5 py-6">
        {/* QR is a data URL from the server — not a remote asset. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={`QR de asistencia de ${nombre}`}
          className="mx-auto h-[280px] w-[280px]"
          width={280}
          height={280}
        />
        <p className="mt-4 text-sm font-medium text-[#0b2a36]">{nombre}</p>
        <p className="mt-1 font-[family-name:var(--font-data)] text-lg tabular-nums text-[#1077A1]">
          Mesa {mesa?.trim() || "—"}
        </p>
        <Link className="dl-btn dl-btn-primary mt-5 w-full" href="/plataforma/credencial">
          Ver credencial
        </Link>
      </div>

      <p className="mx-auto mt-6 max-w-xs text-xs leading-relaxed text-muted">
        No compartas capturas del QR por chat. Solo muéstralo en persona al
        coordinador.
      </p>
    </div>
  );
}
