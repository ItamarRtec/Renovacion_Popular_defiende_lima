import Link from "next/link";
import { PersoneroHome } from "@/components/plataforma/personero-home";
import { credencialesVisibles } from "@/lib/credencial-visible";
import { diaDActivo } from "@/lib/dia-d";
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
  const [diaD, mostrarCredencial] = await Promise.all([
    diaDActivo(supabase),
    credencialesVisibles(supabase),
  ]);

  return (
    <PersoneroHome
      diaD={diaD}
      mesa={registro.numero_mesa ?? null}
      mostrarCredencial={mostrarCredencial || diaD}
      mostrarVideos={!diaD}
      nombres={registro.nombres}
    />
  );
}
