import Link from "next/link";
import { redirect } from "next/navigation";
import {
  eventoEstaAbierto,
  formatEventoRango,
  listEventos,
} from "@/lib/eventos";
import { getSessionRegistro } from "@/lib/plataforma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CoordinacionEventosPage() {
  const { registro } = await getSessionRegistro();
  if (!registro) redirect("/entrar");

  const supabase = await createSupabaseServerClient();
  const eventos = await listEventos(supabase);

  return (
    <section className="mx-auto max-w-2xl">
      <p className="dl-kicker">Coordinación</p>
      <h1 className="dl-title mt-3 text-3xl">Registrar evento</h1>
      <p className="mt-3 text-sm text-muted">
        Elige el evento y registra la asistencia de tus personeros (QR o DNI).
      </p>

      {eventos.length === 0 ? (
        <div className="dl-panel mt-10 px-5 py-6 text-sm text-muted">
          Aún no hay eventos activos. El admin los crea en Administración →
          Eventos.
        </div>
      ) : (
        <ul className="mt-10 space-y-3">
          {eventos.map((evento) => {
            const abierto = eventoEstaAbierto(evento);
            return (
              <li key={evento.id}>
                <Link
                  href={`/coordinacion/eventos/${evento.id}`}
                  className="dl-panel block px-5 py-5 transition hover:border-[rgb(16_119_161_/_0.36)]"
                >
                  <p className="text-xs uppercase tracking-wider text-muted">
                    {evento.tipo === "ensayo" ? "Ensayo" : "Elección"}
                    {abierto ? " · abierto" : ""}
                  </p>
                  <p className="mt-2 text-lg font-medium text-[#0b2a36]">
                    {evento.nombre}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatEventoRango(evento)}
                  </p>
                  <p className="mt-3 text-sm text-[#1077A1]">
                    Registrar asistencia →
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
