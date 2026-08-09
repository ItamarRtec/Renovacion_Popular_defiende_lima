import Link from "next/link";
import { redirect } from "next/navigation";
import { loadTeamPersoneros } from "@/lib/coordinacion";
import { getSessionRegistro } from "@/lib/plataforma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CoordinacionHomePage() {
  const { registro, plataformaRol } = await getSessionRegistro();
  if (!registro) redirect("/entrar");

  const personeros = await loadTeamPersoneros(registro, plataformaRol);
  const ids = personeros.map((p) => p.id);
  const capacitados = personeros.filter(
    (r) => r.estado === "capacitado" || r.estado === "completado",
  ).length;

  const supabase = await createSupabaseServerClient();
  let conActa = 0;
  if (ids.length > 0) {
    const { data: actas } = await supabase
      .from("actas")
      .select("registro_id")
      .in("registro_id", ids);
    conActa = new Set((actas ?? []).map((a) => a.registro_id)).size;
  }

  return (
    <section className="mx-auto max-w-3xl">
      <p className="dl-kicker">Coordinación</p>
      <h1 className="dl-title mt-3 text-3xl">
        {plataformaRol === "administrador"
          ? "Vista general"
          : `${registro.distrito}, ${registro.provincia}`}
      </h1>
      <p className="mt-3 text-sm text-muted">
        Personeros de tu territorio y asignaciones manuales.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="dl-panel px-5 py-5">
          <p className="text-xs uppercase tracking-wider text-muted">
            Personeros
          </p>
          <p className="mt-2 text-3xl font-medium tabular-nums">
            {personeros.length}
          </p>
        </div>
        <div className="dl-panel px-5 py-5">
          <p className="text-xs uppercase tracking-wider text-muted">
            Capacitados
          </p>
          <p className="mt-2 text-3xl font-medium tabular-nums">{capacitados}</p>
        </div>
        <div className="dl-panel px-5 py-5">
          <p className="text-xs uppercase tracking-wider text-muted">Con acta</p>
          <p className="mt-2 text-3xl font-medium tabular-nums">{conActa}</p>
        </div>
      </div>

      <Link
        className="dl-btn dl-btn-primary mt-8"
        href="/coordinacion/personeros"
      >
        Ver personeros
      </Link>
    </section>
  );
}
