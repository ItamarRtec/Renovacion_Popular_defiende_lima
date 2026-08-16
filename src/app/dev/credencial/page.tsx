import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CredencialAcciones } from "@/components/credencial-acciones";
import { signCheckInToken } from "@/lib/checkin-token";
import { renderPersoneroQrDataUrl } from "@/lib/personero-qr";

function isLocalHost(host: string) {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

export default async function DevCredencialPreviewPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  if (process.env.ALLOW_ADMIN !== "1" && !isLocalHost(host)) {
    notFound();
  }

  const demoId = "00000000-0000-4000-8000-000000000001";
  const qrDataUrl = await renderPersoneroQrDataUrl(demoId, { dark: "#000000" });
  const qrToken = qrDataUrl ? null : signCheckInToken(demoId);

  return (
    <>
      <style>{`
        html { color-scheme: light; }
        body { background: #fff !important; color: #000; }
      `}</style>
      <main className="min-h-full bg-white px-4 py-10 text-black">
        <p className="no-print mx-auto max-w-lg text-center text-xs uppercase tracking-wider text-black">
          Vista previa local — no es un registro real
        </p>
        <div className="mt-6">
          <CredencialAcciones
            data={{
              nombres: "María Elena",
              apellidos: "Quispe Rojas",
              dni: "45678912",
              numero_mesa: "001234",
              centro_votacion: "I.E. 1098 Los Libertadores",
              provincia: "Lima",
              distrito: "San Juan de Lurigancho",
              rol_mesa: "titular",
              emitidaEl: new Date().toISOString(),
            }}
            qrDataUrl={qrDataUrl}
            qrToken={qrToken}
          />
        </div>
      </main>
    </>
  );
}
