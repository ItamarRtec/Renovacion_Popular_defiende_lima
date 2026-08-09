import Link from "next/link";
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
  const [{ data: videos }, { data: progresos }, { data: actas }] =
    await Promise.all([
      supabase
        .from("videos")
        .select("id")
        .eq("activo", true),
      supabase
        .from("video_progresos")
        .select("video_id, visto")
        .eq("registro_id", registro.id)
        .eq("visto", true),
      supabase
        .from("actas")
        .select("id")
        .eq("registro_id", registro.id)
        .limit(1),
    ]);

  const totalVideos = videos?.length ?? 0;
  const vistos = progresos?.length ?? 0;
  const hasActa = (actas?.length ?? 0) > 0;

  return (
    <section className="mx-auto max-w-2xl">
      <p className="dl-kicker">Hola, {registro.nombres}</p>
      <h1 className="dl-title mt-3 text-3xl sm:text-4xl">Tu plataforma</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Completa la capacitación en video y, el día de la elección, sube la
        foto del acta desde aquí.
      </p>

      <div className="mt-10 space-y-4">
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
          <p className="text-xs uppercase tracking-wider text-muted">Acta</p>
          <p className="mt-2 text-lg font-medium">
            {hasActa ? "Foto cargada" : "Aún sin foto"}
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
