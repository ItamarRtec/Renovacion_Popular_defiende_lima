export type FilaPromoteCsv = {
  linea: number;
  dni: string;
  rol: string | null;
};

function splitCsvLine(line: string, sep: string): string[] {
  return line.split(sep).map((cell) => cell.trim().replace(/^["']|["']$/g, ""));
}

export function parsePromoteCsv(text: string): FilaPromoteCsv[] {
  const raw = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  if (!raw) return [];

  const lines = raw.split("\n").filter((line) => line.trim().length > 0);
  const first = lines[0] ?? "";
  const sep = first.includes(";") && !first.includes(",") ? ";" : ",";
  const cells0 = splitCsvLine(first, sep).map((c) => c.toLowerCase());

  const hasHeader =
    cells0.includes("dni") ||
    cells0.includes("documento") ||
    cells0.includes("rol");
  const dniIdx = hasHeader
    ? Math.max(cells0.indexOf("dni"), cells0.indexOf("documento"), 0)
    : 0;
  const rolIdx = hasHeader
    ? cells0.indexOf("rol") >= 0
      ? cells0.indexOf("rol")
      : cells0.indexOf("plataforma_rol")
    : cells0.length > 1
      ? 1
      : -1;

  const start = hasHeader ? 1 : 0;
  const filas: FilaPromoteCsv[] = [];

  for (let i = start; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i] ?? "", sep);
    const dni = (cells[dniIdx] ?? "").replace(/\D/g, "");
    const rol = rolIdx >= 0 ? (cells[rolIdx] ?? "").trim() || null : null;
    filas.push({ linea: i + 1, dni, rol });
  }

  return filas;
}
