import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckInScanner } from "@/components/coordinacion/check-in-scanner";
import { loadTeamPersoneros } from "@/lib/coordinacion";
import { formatEventoRango, getEventoById } from "@/lib/eventos";
import { getSessionRegistro } from "@/lib/plataforma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoordinacionEventoAsistenciaPage({
  params,
}: PageProps) {
  const { id } = await params;
  const { registro, plataformaRol } = await getSessionRegistro();
  if (!registro) redirect("/entrar");

  const supabase = await createSupabaseServerClient();
  const [evento, team] = await Promise.all([
    getEventoById(supabase, id),
    loadTeamPersoneros(registro, plataformaRol),
  ]);

  if (!evento) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm text-muted hover:text-[#1077A1]"
          href="/coordinacion/eventos"
        >
          ← Registrar evento
        </Link>
        <div className="mt-4 rounded-[var(--radius-md)] border border-[rgb(16_119_161_/_0.28)] bg-[rgb(16_119_161_/_0.06)] px-4 py-3 text-sm">
          <p className="font-medium text-[#0b2a36]">
            {evento.tipo === "ensayo" ? "Ensayo" : "Elección"} · {evento.nombre}
          </p>
          <p className="mt-1 text-muted">{formatEventoRango(evento)}</p>
        </div>
      </div>
      <CheckInScanner
        eventoId={evento.id}
        eventoNombre={evento.nombre}
        team={team.map((p) => ({
          id: p.id,
          nombres: p.nombres,
          apellidos: p.apellidos,
          dni: p.dni,
          numero_mesa: p.numero_mesa ?? null,
        }))}
      />
    </div>
  );
}
