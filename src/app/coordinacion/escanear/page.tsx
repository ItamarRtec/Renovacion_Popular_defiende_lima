import { CheckInScanner } from "@/components/coordinacion/check-in-scanner";
import { loadTeamPersoneros } from "@/lib/coordinacion";
import { formatEventoRango, getEventoActivo } from "@/lib/eventos";
import { getSessionRegistro } from "@/lib/plataforma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CoordinacionEscanearPage() {
  const { registro, plataformaRol } = await getSessionRegistro();
  if (!registro) redirect("/entrar");

  const supabase = await createSupabaseServerClient();
  const [team, evento] = await Promise.all([
    loadTeamPersoneros(registro, plataformaRol),
    getEventoActivo(supabase),
  ]);

  return (
    <div className="space-y-6">
      {evento ? (
        <div className="rounded-[var(--radius-md)] border border-[rgb(16_119_161_/_0.28)] bg-[rgb(16_119_161_/_0.06)] px-4 py-3 text-sm">
          <p className="font-medium text-[#0b2a36]">
            {evento.tipo === "ensayo" ? "Ensayo" : "Elección"} · {evento.nombre}
          </p>
          <p className="mt-1 text-muted">{formatEventoRango(evento)}</p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-border px-4 py-3 text-sm text-muted">
          No hay un evento abierto. El admin debe crear un ensayo en
          Administración → Eventos para poder registrar llegadas.
        </div>
      )}
      <CheckInScanner
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
