import type { AdminDb } from "@/lib/admin-session";
import { getEventoActivo } from "@/lib/eventos";

export type ControlFlagRow = {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  numero_mesa: string | null;
  distrito: string | null;
  centro_votacion: string | null;
  rol_mesa: "titular" | "suplente";
  llegada_at: string | null;
  hasActa: boolean;
};

export type AdminControlCenter = {
  personerosTitulares: number;
  presentes: number;
  sinCheckIn: number;
  sinMesa: number;
  suplentes: number;
  presentesSinActa: number;
  flagsSinCheckIn: ControlFlagRow[];
  flagsPresentesSinActa: ControlFlagRow[];
  flagsSinMesa: ControlFlagRow[];
  eventoNombre: string | null;
};

function hasMesa(numero: string | null | undefined) {
  return Boolean(numero?.trim());
}

export async function getAdminControlCenter(
  supabase: AdminDb,
): Promise<AdminControlCenter> {
  const evento = await getEventoActivo(supabase);
  const asisQuery = supabase.from("asistencias").select("registro_id, llegada_at");
  const scopedAsis = evento
    ? asisQuery.eq("evento_id", evento.id)
    : asisQuery.is("evento_id", null);

  const [{ data: personeros, error }, { data: asistencias }, { data: actas }] =
    await Promise.all([
      supabase
        .from("registros")
        .select(
          "id, nombres, apellidos, dni, numero_mesa, distrito, centro_votacion, rol_mesa",
        )
        .eq("plataforma_rol", "personero")
        .order("apellidos", { ascending: true }),
      scopedAsis,
      supabase.from("actas").select("registro_id"),
    ]);

  if (error) {
    console.error(error);
    throw new Error("No se pudo cargar el centro de control.");
  }

  const llegadaById = new Map(
    (asistencias ?? []).map((a) => [a.registro_id, a.llegada_at]),
  );
  const actaSet = new Set((actas ?? []).map((a) => a.registro_id));

  const flagsSinCheckIn: ControlFlagRow[] = [];
  const flagsPresentesSinActa: ControlFlagRow[] = [];
  const flagsSinMesa: ControlFlagRow[] = [];

  let personerosTitulares = 0;
  let presentes = 0;
  let sinCheckIn = 0;
  let sinMesa = 0;
  let suplentes = 0;
  let presentesSinActa = 0;

  for (const p of personeros ?? []) {
    const llegada_at = llegadaById.get(p.id) ?? null;
    const hasActa = actaSet.has(p.id);
    const row: ControlFlagRow = {
      id: p.id,
      nombres: p.nombres,
      apellidos: p.apellidos,
      dni: p.dni,
      numero_mesa: p.numero_mesa ?? null,
      distrito: p.distrito ?? null,
      centro_votacion: p.centro_votacion ?? null,
      rol_mesa: p.rol_mesa === "suplente" ? "suplente" : "titular",
      llegada_at,
      hasActa,
    };

    if (row.rol_mesa === "suplente") {
      suplentes += 1;
      continue;
    }

    personerosTitulares += 1;

    if (!hasMesa(row.numero_mesa)) {
      sinMesa += 1;
      flagsSinMesa.push(row);
      continue;
    }

    if (llegada_at) {
      presentes += 1;
      if (!hasActa) {
        presentesSinActa += 1;
        flagsPresentesSinActa.push(row);
      }
    } else {
      sinCheckIn += 1;
      flagsSinCheckIn.push(row);
    }
  }

  return {
    personerosTitulares,
    presentes,
    sinCheckIn,
    sinMesa,
    suplentes,
    presentesSinActa,
    flagsSinCheckIn,
    flagsPresentesSinActa,
    flagsSinMesa,
    eventoNombre: evento?.nombre ?? null,
  };
}
