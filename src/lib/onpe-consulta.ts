/**
 * Cliente server-only del robot ONPE (`tools/onpe-consulta`).
 * Nunca llamar desde el navegador: el token no debe salir del servidor.
 */

export type OnpeConsultaResult = {
  encontrado: boolean;
  dni: string;
  centroVotacion: string | null;
  numeroMesa: string | null;
  ubigeo: string | null;
  nombres: string | null;
  apellidos: string | null;
  cargo: string | null;
};

export type MesaPadron = {
  centro_votacion: string | null;
  numero_mesa: string | null;
  region: string | null;
  provincia: string | null;
  distrito: string | null;
  cargo: string | null;
};

/** "LIMA / LIMA / CHORRILLOS" → region / provincia / distrito */
export function parseUbigeo(ubigeo: string | null | undefined): {
  region: string | null;
  provincia: string | null;
  distrito: string | null;
} {
  if (!ubigeo?.trim()) {
    return { region: null, provincia: null, distrito: null };
  }
  const parts = ubigeo.split("/").map((p) => p.trim()).filter(Boolean);
  return {
    region: parts[0] ?? null,
    provincia: parts[1] ?? null,
    distrito: parts[2] ?? null,
  };
}

/**
 * Consulta el padrón electoral vía el robot local/privado.
 * Soft-fail: si no hay URL, timeout o error → null (el registro sigue).
 */
export async function consultarMesaPorDni(
  dni: string,
): Promise<MesaPadron | null> {
  const base = (process.env.ONPE_CONSULTA_URL ?? "").replace(/\/$/, "");
  if (!base) return null;
  if (!/^\d{8}$/.test(dni)) return null;

  const token = (process.env.ONPE_CONSULTA_TOKEN ?? "").trim();
  if (!token) {
    console.error("onpe-consulta skipped: ONPE_CONSULTA_TOKEN vacío");
    return null;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55_000);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-consulta-token": token,
    };

    const response = await fetch(`${base}/consultar`, {
      method: "POST",
      headers,
      body: JSON.stringify({ dni }),
      signal: controller.signal,
    });

    if (response.status === 404) {
      return {
        centro_votacion: null,
        numero_mesa: null,
        region: null,
        provincia: null,
        distrito: null,
        cargo: null,
      };
    }

    if (!response.ok) {
      console.error("onpe-consulta HTTP", response.status);
      return null;
    }

    const data = (await response.json()) as OnpeConsultaResult;
    if (!data.encontrado) {
      return {
        centro_votacion: null,
        numero_mesa: null,
        region: null,
        provincia: null,
        distrito: null,
        cargo: null,
      };
    }

    const ubi = parseUbigeo(data.ubigeo);
    return {
      centro_votacion: data.centroVotacion?.trim() || null,
      numero_mesa: data.numeroMesa?.trim() || null,
      region: ubi.region,
      provincia: ubi.provincia,
      distrito: ubi.distrito,
      cargo: data.cargo?.trim() || null,
    };
  } catch (err) {
    console.error("onpe-consulta failed", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
