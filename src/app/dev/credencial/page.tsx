import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CredencialAcciones } from "@/components/credencial-acciones";
import { signCheckInToken } from "@/lib/checkin-token";
import type { CredencialData } from "@/lib/credencial";
import { renderPersoneroQrDataUrl } from "@/lib/personero-qr";
import type { CredencialTipo } from "@/lib/roles";

function isLocalHost(host: string) {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

const DEMOS: { tipo: CredencialTipo; data: CredencialData }[] = [
  {
    tipo: "personero",
    data: {
      tipo: "personero",
      nombres: "María Elena",
      apellidos: "Quispe Rojas",
      dni: "45678912",
      numero_mesa: "001234",
      centro_votacion: "I.E. 1098 Los Libertadores",
      provincia: "Lima",
      distrito: "San Juan de Lurigancho",
      rol_mesa: "titular",
      emitidaEl: new Date().toISOString(),
    },
  },
  {
    tipo: "coordinador_local",
    data: {
      tipo: "coordinador_local",
      nombres: "Carlos Alberto",
      apellidos: "Huamán Vega",
      dni: "10293847",
      centro_votacion: "I.E. 1098 Los Libertadores",
      provincia: "Lima",
      distrito: "San Juan de Lurigancho",
      emitidaEl: new Date().toISOString(),
    },
  },
  {
    tipo: "coordinador_distrital",
    data: {
      tipo: "coordinador_distrital",
      nombres: "Rosa María",
      apellidos: "Salas Paredes",
      dni: "33445566",
      provincia: "Lima",
      distrito: "San Juan de Lurigancho",
      emitidaEl: new Date().toISOString(),
    },
  },
];

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
          Vista previa local — las 3 credenciales
        </p>
        <div className="mt-6 space-y-16">
          {DEMOS.map((demo) => (
            <div key={demo.tipo}>
              <p className="no-print mb-4 text-center text-xs font-semibold uppercase tracking-wider">
                {demo.tipo.replaceAll("_", " ")}
              </p>
              <CredencialAcciones
                data={demo.data}
                qrDataUrl={qrDataUrl}
                qrToken={qrToken}
              />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
