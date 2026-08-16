import type { AdminDb } from "@/lib/admin-session";

export type CapacitacionRow = {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  numero_mesa: string | null;
  distrito: string | null;
  estado: string;
  vistos: number;
  totalVideos: number;
  completo: boolean;
};

export type CapacitacionReport = {
  totalVideos: number;
  totalPersoneros: number;
  completaron: number;
  pendientes: number;
  rowsCompletos: CapacitacionRow[];
  rowsPendientes: CapacitacionRow[];
};

export type ActaReportRow = {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  numero_mesa: string | null;
  distrito: string | null;
  hasInstalacion: boolean;
  hasEscrutinio: boolean;
  hasActa: boolean;
  actaAt: string | null;
};

export type ActaReport = {
  totalPersoneros: number;
  conActa: number;
  sinActa: number;
  incompletas: number;
  rowsConActa: ActaReportRow[];
  rowsSinActa: ActaReportRow[];
  rowsIncompletas: ActaReportRow[];
};

export async function getCapacitacionReport(
  supabase: AdminDb,
): Promise<CapacitacionReport> {
  const [{ data: videos }, { data: personeros }, { data: progresos }] =
    await Promise.all([
      supabase.from("videos").select("id").eq("activo", true),
      supabase
        .from("registros")
        .select("id, nombres, apellidos, dni, numero_mesa, distrito, estado")
        .eq("plataforma_rol", "personero")
        .order("apellidos", { ascending: true }),
      supabase
        .from("video_progresos")
        .select("registro_id, video_id, visto")
        .eq("visto", true),
    ]);

  const totalVideos = videos?.length ?? 0;
  const activeIds = new Set((videos ?? []).map((v) => v.id));
  const vistosByRegistro = new Map<string, number>();

  for (const p of progresos ?? []) {
    if (!activeIds.has(p.video_id)) continue;
    vistosByRegistro.set(
      p.registro_id,
      (vistosByRegistro.get(p.registro_id) ?? 0) + 1,
    );
  }

  const rowsCompletos: CapacitacionRow[] = [];
  const rowsPendientes: CapacitacionRow[] = [];

  for (const p of personeros ?? []) {
    const vistos = vistosByRegistro.get(p.id) ?? 0;
    const completo = totalVideos > 0 && vistos >= totalVideos;
    const row: CapacitacionRow = {
      id: p.id,
      nombres: p.nombres,
      apellidos: p.apellidos,
      dni: p.dni,
      numero_mesa: p.numero_mesa ?? null,
      distrito: p.distrito ?? null,
      estado: p.estado,
      vistos,
      totalVideos,
      completo,
    };
    if (completo) rowsCompletos.push(row);
    else rowsPendientes.push(row);
  }

  return {
    totalVideos,
    totalPersoneros: personeros?.length ?? 0,
    completaron: rowsCompletos.length,
    pendientes: rowsPendientes.length,
    rowsCompletos,
    rowsPendientes,
  };
}

export async function getActaReport(supabase: AdminDb): Promise<ActaReport> {
  const [{ data: personeros }, { data: actas }] = await Promise.all([
    supabase
      .from("registros")
      .select("id, nombres, apellidos, dni, numero_mesa, distrito")
      .eq("plataforma_rol", "personero")
      .order("apellidos", { ascending: true }),
    supabase
      .from("actas")
      .select("registro_id, created_at, tipo")
      .order("created_at", { ascending: false }),
  ]);

  const latestActa = new Map<string, string>();
  const tiposByRegistro = new Map<string, Set<string>>();
  for (const a of actas ?? []) {
    if (!latestActa.has(a.registro_id)) {
      latestActa.set(a.registro_id, a.created_at);
    }
    const set = tiposByRegistro.get(a.registro_id) ?? new Set<string>();
    set.add(a.tipo);
    tiposByRegistro.set(a.registro_id, set);
  }

  const rowsConActa: ActaReportRow[] = [];
  const rowsSinActa: ActaReportRow[] = [];
  const rowsIncompletas: ActaReportRow[] = [];

  for (const p of personeros ?? []) {
    const tipos = tiposByRegistro.get(p.id) ?? new Set<string>();
    const hasInstalacion = tipos.has("instalacion_sufragio");
    const hasEscrutinio = tipos.has("escrutinio");
    const actaAt = latestActa.get(p.id) ?? null;
    const row: ActaReportRow = {
      id: p.id,
      nombres: p.nombres,
      apellidos: p.apellidos,
      dni: p.dni,
      numero_mesa: p.numero_mesa ?? null,
      distrito: p.distrito ?? null,
      hasInstalacion,
      hasEscrutinio,
      hasActa: hasInstalacion && hasEscrutinio,
      actaAt,
    };
    if (row.hasActa) rowsConActa.push(row);
    else if (hasInstalacion || hasEscrutinio) rowsIncompletas.push(row);
    else rowsSinActa.push(row);
  }

  return {
    totalPersoneros: personeros?.length ?? 0,
    conActa: rowsConActa.length,
    sinActa: rowsSinActa.length,
    incompletas: rowsIncompletas.length,
    rowsConActa,
    rowsSinActa,
    rowsIncompletas,
  };
}
