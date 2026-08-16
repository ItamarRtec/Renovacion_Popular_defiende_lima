import Link from "next/link";
import { PersoneroQr } from "@/components/plataforma/personero-qr";
import { getEventoActivo } from "@/lib/eventos";
import { renderPersoneroQrDataUrl } from "@/lib/personero-qr";
import { getSessionRegistro } from "@/lib/plataforma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlataformaQrPage() {
  const { registro } = await getSessionRegistro();

  if (!registro) {
    return (
      <section className="mx-auto max-w-lg text-center">
        <p className="dl-kicker">QR</p>
        <h1 className="dl-title mt-3 text-3xl">Sin inscripción</h1>
        <Link className="dl-btn dl-btn-primary mt-8" href="/unirme">
          Ir a inscripción
        </Link>
      </section>
    );
  }

  const dataUrl = await renderPersoneroQrDataUrl(registro.id);
  if (!dataUrl) {
    return (
      <section className="mx-auto max-w-lg text-center">
        <p className="dl-kicker">QR</p>
        <h1 className="dl-title mt-3 text-3xl">Aún no disponible</h1>
        <p className="mt-3 text-sm text-muted">
          Falta configurar CHECKIN_QR_SECRET en el servidor.
        </p>
        <Link className="dl-btn dl-btn-secondary mt-8" href="/plataforma">
          Volver
        </Link>
      </section>
    );
  }

  const supabase = await createSupabaseServerClient();
  const evento = await getEventoActivo(supabase);
  let asisQuery = supabase
    .from("asistencias")
    .select("llegada_at, metodo")
    .eq("registro_id", registro.id);
  asisQuery = evento
    ? asisQuery.eq("evento_id", evento.id)
    : asisQuery.is("evento_id", null);
  const { data: asistencia } = await asisQuery.maybeSingle();

  const nombre =
    [registro.nombres, registro.apellidos].filter(Boolean).join(" ").trim() ||
    "Personero";

  return (
    <div className="space-y-6">
      {asistencia ? (
        <p className="mx-auto max-w-sm rounded-[var(--radius-md)] border border-[rgb(16_119_161_/_0.28)] bg-[rgb(16_119_161_/_0.06)] px-4 py-3 text-center text-sm text-[#0b2a36]">
          Llegada registrada
          {asistencia.metodo === "manual" ? " (manual)" : " (QR)"} ·{" "}
          {new Intl.DateTimeFormat("es-PE", {
            dateStyle: "short",
            timeStyle: "medium",
          }).format(new Date(asistencia.llegada_at))}
        </p>
      ) : null}
      <PersoneroQr
        dataUrl={dataUrl}
        mesa={registro.numero_mesa ?? null}
        nombre={nombre}
        eventoNombre={evento?.nombre ?? null}
        esEnsayo={evento?.tipo === "ensayo"}
      />
    </div>
  );
}
