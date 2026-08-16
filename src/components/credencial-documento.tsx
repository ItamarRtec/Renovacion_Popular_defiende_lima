import Image from "next/image";
import {
  credencialBoxValue,
  credencialCopy,
  credencialTipo,
  fechaEmisionEs,
  nombreCompleto,
  personeroLegal,
  ubicacionCredencial,
  type CredencialData,
} from "@/lib/credencial";

type CredencialDocumentoProps = {
  data: CredencialData;
  qrDataUrl: string | null;
};

export function CredencialDocumento({
  data,
  qrDataUrl,
}: CredencialDocumentoProps) {
  const legal = personeroLegal();
  const copy = credencialCopy(data);
  const tipo = credencialTipo(data);
  const boxValue = credencialBoxValue(data);
  const local = data.centro_votacion?.trim() || "Por confirmar";
  const esSuplente = tipo === "personero" && data.rol_mesa === "suplente";

  return (
    <article
      id="credencial-print"
      className="credencial-sheet mx-auto"
    >
      <style>{`
        .credencial-sheet {
          background: #fff;
          color: #000;
          box-shadow: 0 8px 32px rgb(0 0 0 / 0.12);
        }
        .credencial-sheet,
        .credencial-sheet h1,
        .credencial-sheet h2,
        .credencial-sheet h3,
        .credencial-sheet p,
        .credencial-sheet th,
        .credencial-sheet td,
        .credencial-sheet strong,
        .credencial-sheet span,
        .credencial-sheet footer {
          color: #000 !important;
          background: #fff !important;
        }
        .credencial-sheet table,
        .credencial-sheet th,
        .credencial-sheet td,
        .credencial-sheet header,
        .credencial-sheet .credencial-box,
        .credencial-sheet .credencial-qr,
        .credencial-sheet .credencial-sign,
        .credencial-sheet footer {
          border-color: #000 !important;
        }
      `}</style>
      <header className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
        <Image
          src="/brands/renovacion-popular/logo-r.png"
          alt="Renovación Popular"
          width={56}
          height={56}
          className="credencial-logo h-14 w-14 object-contain"
        />
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[11px] font-semibold tracking-[0.14em]">
            ELECCIONES MUNICIPALES 2026
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">CREDENCIAL</h1>
          <p className="mt-1 text-[13px] font-semibold underline underline-offset-2">
            {copy.cargo}
          </p>
        </div>
        {qrDataUrl ? (
          // QR is a data URL from the server/client — not a remote asset.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={`QR de ${copy.cargo.toLowerCase()}`}
            className="credencial-qr h-20 w-20 shrink-0 border border-black bg-white p-0.5"
            width={80}
            height={80}
          />
        ) : (
          <div className="credencial-qr h-20 w-20 shrink-0 border border-dashed border-black" />
        )}
      </header>

      <div className="credencial-box mx-auto mt-4 w-fit max-w-full border-2 border-black px-6 py-1.5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wider">
          {copy.boxLabel}
        </p>
        <p className="font-[family-name:var(--font-data)] text-xl font-bold tabular-nums">
          {boxValue}
        </p>
        {esSuplente ? (
          <p className="text-[10px] font-medium uppercase tracking-wider">
            Suplente
          </p>
        ) : null}
      </div>

      <p className="mt-5 text-[12px] leading-relaxed">
        Mediante el presente documento y de conformidad con la normativa vigente
        del Jurado Nacional de Elecciones sobre participación de personeros, se
        otorga la presente credencial de <strong>{copy.otorgamiento}</strong> de
        la Organización Política: <strong>RENOVACIÓN POPULAR</strong> al Señor
        (a):
      </p>

      <table className="mt-4 w-full border-collapse text-[12px]">
        <tbody>
          <tr>
            <th className="w-[42%] border border-black px-2 py-2 text-left font-semibold">
              {copy.nombreLabel}
            </th>
            <td className="border border-black px-2 py-2 font-medium">
              {nombreCompleto(data) || "—"}
            </td>
          </tr>
          <tr>
            <th className="border border-black px-2 py-2 text-left font-semibold">
              Nro. DNI
            </th>
            <td className="border border-black px-2 py-2 font-[family-name:var(--font-data)] tabular-nums">
              {data.dni || "—"}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-5 text-center text-[11px] font-bold uppercase tracking-wide">
        {copy.lugarTitulo}
      </p>
      <table className="mt-2 w-full border-collapse text-[12px]">
        <tbody>
          {copy.showLocal ? (
            <tr>
              <th className="w-[42%] border border-black px-2 py-2 text-left font-semibold">
                Nombre del Centro de Votación
              </th>
              <td className="border border-black px-2 py-2">{local}</td>
            </tr>
          ) : null}
          <tr>
            <th className="w-[42%] border border-black px-2 py-2 text-left font-semibold">
              Ubicado en la provincia y distrito de:
            </th>
            <td className="border border-black px-2 py-2">
              {ubicacionCredencial(data)}
            </td>
          </tr>
        </tbody>
      </table>

      {copy.colgarOtraMesa ? (
        <>
          <p className="mt-5 text-center text-[11px] font-bold uppercase tracking-wide">
            Colgar de otra mesa
          </p>
          <table className="mt-2 w-full border-collapse text-[12px]">
            <tbody>
              <tr>
                <th className="w-[42%] border border-black px-2 py-2 text-left font-semibold">
                  Autorización
                </th>
                <td className="border border-black px-2 py-2">
                  {copy.colgarOtraMesa}
                </td>
              </tr>
              <tr>
                <th className="border border-black px-2 py-2 text-left font-semibold">
                  Mesa en la que se cuelga
                </th>
                <td className="border border-black px-2 py-2 font-[family-name:var(--font-data)] tabular-nums">
                  {data.numero_mesa?.trim() ||
                    "Cualquier mesa del ámbito acreditado"}
                </td>
              </tr>
            </tbody>
          </table>
        </>
      ) : null}

      <p className="mt-5 text-[11px] font-bold uppercase tracking-wide">
        Personero legal que otorga la credencial
      </p>
      <div className="mt-2 space-y-1.5 text-[12px]">
        <p>
          <span className="font-semibold">Nombres y Apellidos:</span>{" "}
          {legal.nombre}
        </p>
        <p>
          <span className="font-semibold">Personero Legal:</span>{" "}
          {legal.calidad}
          {legal.dni ? (
            <>
              {" · "}
              <span className="font-semibold">DNI N°</span> {legal.dni}
            </>
          ) : null}
        </p>
        <p>
          <span className="font-semibold">Acreditado ante:</span> Jurado
          Electoral Especial de {legal.jee}
        </p>
        <p className="text-right">
          Fecha de emisión: {fechaEmisionEs(data.emitidaEl)}
        </p>
      </div>

      <div className="mt-10 text-center">
        <div className="credencial-sign mx-auto h-12 w-48 border-b border-black" />
        <p className="mt-1 text-[11px]">Sello y Firma · Personero Legal</p>
      </div>

      <footer className="mt-8 border-t border-black pt-3 text-[9px] leading-snug">
        <p>{copy.footer}</p>
      </footer>
    </article>
  );
}
