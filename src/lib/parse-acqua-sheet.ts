import { TIPO_LABEL, type MeterRecord, type MeterTipo, type ScalaId } from "./types";

const SCALA_VALUES: ScalaId[] = ["A", "B", "C"];

export interface SheetParseResult {
  records: MeterRecord[];
  warnings: string[];
  condominio?: string;
  gestione?: string;
  sheetName?: string;
}

function norm(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

function formatApt(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes("/")) return trimmed;
  const n = Number(trimmed.replace(",", "."));
  if (Number.isFinite(n) && n === Math.trunc(n)) return String(Math.trunc(n));
  return trimmed;
}

function isYearLabel(value: string): boolean {
  return /^\d{2}\s*[/\-]\s*\d{2}$/.test(value.trim());
}

function yearKey(value: string): string {
  const m = value.trim().match(/^(\d{2})\s*[/\-]\s*(\d{2})$/);
  if (!m) return value;
  return `${m[1]}-${m[2]}`;
}

function headerAt(grid: string[][], col: number, headerRows: number): string {
  const parts: string[] = [];
  for (let r = 0; r < headerRows && r < grid.length; r++) {
    const cell = norm(grid[r]?.[col]);
    if (cell) parts.push(cell);
  }
  return parts.join(" | ");
}

function detectHeaderRows(grid: string[][]): number {
  const max = Math.min(6, grid.length);
  for (let r = 0; r < max; r++) {
    const row = grid[r] ?? [];
    const hasScala = row.some((c) => /^scala$/i.test(norm(c)));
    const hasYear = row.some((c) => isYearLabel(norm(c)));
    if (hasYear) return r + 1;
    if (hasScala && r >= 1) return r + 2;
  }
  return 3;
}

function pickYearColumns(
  grid: string[][],
  headerRows: number
): { previous: number[]; current: number[] } {
  const yearRow =
    grid
      .slice(0, headerRows)
      .find((row) => row.some((c) => isYearLabel(norm(c)))) ?? [];

  const previous: number[] = [];
  const current: number[] = [];
  yearRow.forEach((cell, idx) => {
    const label = yearKey(norm(cell));
    if (label === "24-25") previous.push(idx);
    if (label === "25-26") current.push(idx);
  });

  if (current.length >= 2 && previous.length >= 2) {
    return { previous, current };
  }

  const allYears = yearRow
    .map((cell, idx) => ({ idx, key: yearKey(norm(cell)) }))
    .filter((x) => isYearLabel(yearRow[x.idx] ?? ""));

  if (allYears.length >= 2) {
    const lastKey = allYears[allYears.length - 1]?.key;
    const prevKey = allYears.filter((x) => x.key !== lastKey).at(-1)?.key;
    return {
      previous: allYears.filter((x) => x.key === prevKey).map((x) => x.idx),
      current: allYears.filter((x) => x.key === lastKey).map((x) => x.idx),
    };
  }

  return { previous, current };
}

function detectIdentityCols(
  grid: string[][],
  headerRows: number
): { scala: number; apt: number; name: number; cod: number } {
  const rows = grid.slice(0, headerRows);
  const combined = rows[0]?.map((_, col) => headerAt(grid, col, headerRows)) ?? [];

  const scala = combined.findIndex((h) => /scala/i.test(h));
  const apt = combined.findIndex((h) => /\ball\.?\b|\balloggio\b|\bappart/i.test(h));
  const name = combined.findIndex((h) => /nominativ|intestat/i.test(h));
  const cod = combined.findIndex((h) => /^cod\.?$/i.test(h.split(" | ")[0] ?? "") || /\bcod\.\b/i.test(h));

  return {
    scala: scala >= 0 ? scala : 2,
    apt: apt >= 0 ? apt : 3,
    name: name >= 0 ? name : 1,
    cod: cod >= 0 ? cod : 0,
  };
}

function isAcquaHeader(header: string): boolean {
  return /acqua/i.test(header);
}

function isRiscHeader(header: string): boolean {
  return /riscald/i.test(header);
}

function assignTipoColumns(
  grid: string[][],
  headerRows: number,
  previous: number[],
  current: number[]
): { acquaPrec: number; acquaNew: number; riscPrec: number; riscNew: number } | null {
  if (current.length < 2 || previous.length < 2) return null;

  const typed = current.map((col, i) => {
    const header = headerAt(grid, col, headerRows);
    const tipo: MeterTipo | null = isAcquaHeader(header)
      ? "acqua"
      : isRiscHeader(header)
        ? "riscaldamento"
        : null;
    return { col, prev: previous[i] ?? previous[0], tipo, i };
  });

  const acquaNew =
    typed.find((x) => x.tipo === "acqua")?.col ?? current[0];
  const riscNew =
    typed.find((x) => x.tipo === "riscaldamento")?.col ?? current[1];
  const acquaPrec =
    typed.find((x) => x.tipo === "acqua")?.prev ?? previous[0];
  const riscPrec =
    typed.find((x) => x.tipo === "riscaldamento")?.prev ?? previous[1];

  return { acquaPrec, acquaNew, riscPrec, riscNew };
}

function parseTitle(grid: string[][]): { condominio?: string; gestione?: string } {
  const title = norm(grid[0]?.[0]);
  if (!title) return {};
  const gestioneMatch = title.match(/gestione\s*(\d{4}\s*[/\-]\s*\d{2,4})/i);
  const condoMatch = title.match(/condominio\s+([^/]+)/i);
  return {
    condominio: condoMatch
      ? `Condominio ${condoMatch[1].replace(/\s*-\s*$/, "").trim()}`
      : title.split("/")[0]?.trim(),
    gestione: gestioneMatch?.[1]?.replace(/\s+/g, ""),
  };
}

function meterRecord(params: {
  scala: ScalaId;
  appartamento: string;
  intestatario?: string;
  codice?: string;
  note?: string;
  tipo: MeterTipo;
  letturaPrecedente: number;
  nuovaLettura: number | null;
}): MeterRecord {
  return {
    id: `${params.scala}-${params.appartamento}-${params.tipo}`,
    scala: params.scala,
    appartamento: params.appartamento,
    codiceContatore: TIPO_LABEL[params.tipo],
    tipo: params.tipo,
    intestatario: params.intestatario,
    codice: params.codice,
    note: params.note,
    letturaPrecedente: params.letturaPrecedente,
    nuovaLettura: params.nuovaLettura,
  };
}

export function parseAcquaRiscaldamentoGrid(
  grid: string[][],
  sheetName?: string
): SheetParseResult {
  const warnings: string[] = [];
  if (grid.length < 4) {
    return { records: [], warnings: ["Foglio troppo corto o vuoto."], sheetName };
  }

  const headerRows = detectHeaderRows(grid);
  const cols = detectIdentityCols(grid, headerRows);
  const years = pickYearColumns(grid, headerRows);
  const typedCols = assignTipoColumns(
    grid,
    headerRows,
    years.previous,
    years.current
  );
  const meta = parseTitle(grid);

  if (!typedCols) {
    return {
      records: [],
      warnings: [
        "Impossibile trovare le colonne 24/25 e 25/26 per acqua e riscaldamento.",
      ],
      sheetName,
      ...meta,
    };
  }

  const records: MeterRecord[] = [];

  for (let r = headerRows; r < grid.length; r++) {
    const row = grid[r] ?? [];
    const scalaRaw = norm(row[cols.scala]).toUpperCase();
    const scala = SCALA_VALUES.includes(scalaRaw as ScalaId)
      ? (scalaRaw as ScalaId)
      : null;
    const appartamento = formatApt(norm(row[cols.apt]));
    const intestatario = norm(row[cols.name]);

    if (!scala || !appartamento || !intestatario) {
      continue;
    }

    const codice = formatApt(norm(row[cols.cod])) || undefined;
    const noteParts = [norm(row[40]), norm(row[41])].filter(Boolean);
    const note = noteParts.length ? noteParts.join(" ") : undefined;

    const acquaPrec = parseNumber(row[typedCols.acquaPrec]) ?? 0;
    const riscPrec = parseNumber(row[typedCols.riscPrec]) ?? 0;
    const acquaNew = parseNumber(row[typedCols.acquaNew]);
    const riscNew = parseNumber(row[typedCols.riscNew]);

    records.push(
      meterRecord({
        scala,
        appartamento,
        intestatario,
        codice,
        note,
        tipo: "acqua",
        letturaPrecedente: acquaPrec,
        nuovaLettura: acquaNew,
      }),
      meterRecord({
        scala,
        appartamento,
        intestatario,
        codice,
        note,
        tipo: "riscaldamento",
        letturaPrecedente: riscPrec,
        nuovaLettura: riscNew,
      })
    );
  }

  if (records.length === 0) {
    warnings.push("Nessun appartamento valido nel foglio 25/26.");
  }

  return { records, warnings, sheetName, ...meta };
}

export function pickYearSheet(names: string[]): string | null {
  const exact = names.find((n) => /^25\s*[/\-]\s*26$/.test(n.trim()));
  if (exact) return exact;
  const years = names.filter((n) => /^\d{2}-\d{2}$/.test(n.trim()));
  return years.at(-1) ?? names.at(-1) ?? null;
}
