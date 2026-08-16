import Link from "next/link";
import { ACTA_TIPOS } from "@/lib/actas";
import { credencialesVisibles } from "@/lib/credencial-visible";
import { renderPersoneroQrDataUrl } from "@/lib/personero-qr";
import { getSessionRegistro } from "@/lib/plataforma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlataformaHomePage() {
  const { registro } = await getSessionRegistro();

  if (!registro) {
    return (
      <section className="mx-auto max-w-lg text-center">
        <p className="dl-kicker">Cuenta</p>
        <h1 className="dl-title mt-3 text-3xl">Sin inscripción vinculada</h1>
        <p className="mt-3 text-sm text-muted">
          Tu correo de acceso no coincide con un registro. Inscríbete primero o
          usa el email con el que te registraste.
        </p>
        <Link className="dl-btn dl-btn-primary mt-8" href="/unirme">
          Ir a inscripción
        </Link>
      </section>
    );
  }

  const supabase = await createSupabaseServerClient();
  const [
    { data: videos },
    { data: progresos },
    { data: actas },
    qrDataUrl,
    mostrarCredencial,
  ] = await Promise.all([
    supabase.from("videos").select("id").eq("activo", true),
    supabase
      .from("video_progresos")
      .select("video_id, visto")
      .eq("registro_id", registro.id)
      .eq("visto", true),
    supabase.from("actas").select("id, tipo").eq("registro_id", registro.id),
    renderPersoneroQrDataUrl(registro.id),
    credencialesVisibles(supabase),
  ]);

  const totalVideos = videos?.length ?? 0;
  const vistos = progresos?.length ?? 0;
  const tiposActa = new Set((actas ?? []).map((a) => a.tipo));
  const actasCargadas = ACTA_TIPOS.filter((t) => tiposActa.has(t)).length;

  return (
    <section className="mx-auto max-w-2xl">
      <p className="dl-kicker">Hola, {registro.nombres}</p>
      <h1 className="dl-title mt-3 text-3xl sm:text-4xl">Tu plataforma</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Desde aquí haces todo: capacitarte, ver tu mesa y, el día del evento,
        mostrar el QR y subir el acta. Nosotros vemos el avance en el tablero.
      </p>

      <div className="dl-panel mx-auto mt-10 max-w-sm px-5 py-6 text-center">
        <p className="text-xs uppercase tracking-wider text-muted">
          Tu QR único
        </p>
        {qrDataUrl ? (
          <>
            {/* QR is a data URL from the server — not a remote asset. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR de ${registro.nombres}`}
              className="mx-auto mt-4 h-[220px] w-[220px]"
              width={220}
              height={220}
            />
            <p className="mt-4 text-sm font-medium text-[#0b2a36]">
              {registro.nombres} {registro.apellidos}
            </p>
            <p className="mt-1 font-[family-name:var(--font-data)] tabular-nums text-[#1077A1]">
              Mesa {registro.numero_mesa?.trim() || "—"}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {mostrarCredencial ? (
                <Link
                  className="dl-btn dl-btn-primary w-full"
                  href="/plataforma/credencial"
                >
                  Ver credencial
                </Link>
              ) : null}
              <Link
                className="text-sm text-[#1077A1] underline underline-offset-2"
                href="/plataforma/qr"
              >
                Ver QR en grande
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted">
              No se pudo generar tu QR. Falta la clave de firma en el servidor.
            </p>
            {mostrarCredencial ? (
              <Link
                className="dl-btn dl-btn-primary mt-5 w-full"
                href="/plataforma/credencial"
              >
                Ver credencial
              </Link>
            ) : null}
          </>
        )}
      </div>

      <div className="mt-10 space-y-4">
        {mostrarCredencial ? (
          <Link
            className="dl-panel block px-5 py-5 transition hover:border-[rgb(16_119_161_/_0.36)]"
            href="/plataforma/credencial"
          >
            <p className="text-xs uppercase tracking-wider text-muted">
              Credencial
            </p>
            <p className="mt-2 text-lg font-medium">Ver y descargar</p>
            <p className="mt-1 text-sm text-muted">
              Documento de personero de mesa con tu QR
            </p>
          </Link>
        ) : null}

        <Link
          className="dl-panel block px-5 py-5 transition hover:border-[rgb(16_119_161_/_0.36)]"
          href="/plataforma/videos"
        >
          <p className="text-xs uppercase tracking-wider text-muted">Videos</p>
          <p className="mt-2 text-lg font-medium">
            {vistos} de {totalVideos} vistos
          </p>
          <p className="mt-1 text-sm text-muted">
            Estado:{" "}
            {registro.estado === "capacitado" ? "Capacitado" : "Pendiente"}
          </p>
        </Link>

        <Link
          className="dl-panel block px-5 py-5 transition hover:border-[rgb(16_119_161_/_0.36)]"
          href="/plataforma/acta"
        >
          <p className="text-xs uppercase tracking-wider text-muted">Actas</p>
          <p className="mt-2 text-lg font-medium">
            {actasCargadas} de 2 cargadas
          </p>
          <p className="mt-1 text-sm text-muted">
            Mesa {registro.numero_mesa ?? "—"} ·{" "}
            {registro.centro_votacion ?? "Sin centro"}
          </p>
        </Link>
      </div>
    </section>
  );
}
