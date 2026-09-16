import type { ImportMode, MeterRecord, ScalaId } from "./types";

const SCALA_VALUES: ScalaId[] = ["A", "B", "C"];

export interface ImportResult {
  records: MeterRecord[];
  warnings: string[];
}

export interface ParseError {
  message: string;
}

function normalizeScala(value: unknown): ScalaId | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().toUpperCase();
  if (s === "A" || s === "B" || s === "C") return s;
  if (s.startsWith("SCALA")) {
    const letter = s.replace(/SCALA\s*/i, "").charAt(0);
    if (letter === "A" || letter === "B" || letter === "C") return letter;
  }
  return null;
}

function pickField(
  row: Record<string, unknown>,
  keys: string[]
): unknown {
  for (const key of keys) {
    const found = Object.keys(row).find(
      (k) => k.toLowerCase().replace(/\s+/g, "") === key.toLowerCase()
    );
    if (found !== undefined && row[found] !== "" && row[found] != null) {
      return row[found];
    }
  }
  return undefined;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

function rowToRecord(
  row: Record<string, unknown>,
  index: number
): MeterRecord | null {
  const scala = normalizeScala(
    pickField(row, ["scala", "stairwell", "scale"])
  );
  const appartamento = pickField(row, [
    "appartamento",
    "apt",
    "apartment",
    "unit",
  ]);
  const codice = pickField(row, [
    "codicecontatore",
    "codice_contatore",
    "codice",
    "meter",
    "metercode",
    "contatore",
  ]);
  if (!scala || !appartamento || !codice) return null;

  const precedente =
    parseNumber(
      pickField(row, [
        "letturaprecedente",
        "lettura_precedente",
        "precedente",
        "previous",
        "lastreading",
      ])
    ) ?? 0;

  const nuova = parseNumber(
    pickField(row, [
      "nuovalettura",
      "nuova_lettura",
      "lettura",
      "reading",
      "newreading",
    ])
  );

  const intestatario = pickField(row, [
    "intestatario",
    "nomeintestatario",
    "nome_intestatario",
    "name",
    "holder",
  ]);

  const id =
    pickField(row, ["id"])?.toString() ||
    `${scala}-${String(appartamento)}-${String(codice)}-${index}`;

  return {
    id: String(id),
    scala,
    appartamento: String(appartamento),
    codiceContatore: String(codice),
    intestatario: intestatario ? String(intestatario) : undefined,
    letturaPrecedente: precedente,
    nuovaLettura: nuova,
  };
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function csvToRows(text: string): Record<string, unknown>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = parseCsvLine(lines[0], delimiter).map((h) =>
    h.replace(/^"|"$/g, "").trim()
  );

  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i], delimiter).map((c) =>
      c.replace(/^"|"$/g, "").trim()
    );
    const row: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function jsonToRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((x) => x && typeof x === "object") as Record<
      string,
      unknown
    >[];
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.records)) return jsonToRows(obj.records);
    if (Array.isArray(obj.meters)) return jsonToRows(obj.meters);
    if (Array.isArray(obj.data)) return jsonToRows(obj.data);
  }
  return [];
}

export function parseImportFile(
  text: string,
  filename: string
): ImportResult | ParseError {
  const trimmed = text.trim();
  if (!trimmed) {
    return { message: "Il file è vuoto." };
  }

  let rows: Record<string, unknown>[] = [];
  const isJson =
    filename.toLowerCase().endsWith(".json") || trimmed.startsWith("[") || trimmed.startsWith("{");

  try {
    if (isJson) {
      rows = jsonToRows(JSON.parse(trimmed));
    } else {
      rows = csvToRows(trimmed);
    }
  } catch {
    return { message: "Impossibile analizzare il file. Verifica formato CSV o JSON." };
  }

  if (rows.length === 0) {
    return { message: "Nessuna riga valida trovata nel file." };
  }

  const records: MeterRecord[] = [];
  const warnings: string[] = [];
  rows.forEach((row, index) => {
    const record = rowToRecord(row, index);
    if (record) {
      if (!SCALA_VALUES.includes(record.scala)) {
        warnings.push(`Riga ${index + 1}: scala non valida, ignorata.`);
        return;
      }
      records.push(record);
    } else {
      warnings.push(`Riga ${index + 1}: dati incompleti, ignorata.`);
    }
  });

  if (records.length === 0) {
    return {
      message:
        "Nessun contatore importato. Servono almeno scala, appartamento e codice contatore.",
    };
  }

  return { records, warnings };
}

export function mergeRecords(
  existing: MeterRecord[],
  imported: MeterRecord[],
  mode: ImportMode
): MeterRecord[] {
  if (mode === "replace") return imported;

  const byKey = new Map<string, MeterRecord>();
  for (const r of existing) {
    byKey.set(recordKey(r), r);
  }
  for (const r of imported) {
    const key = recordKey(r);
    const prev = byKey.get(key);
    if (prev) {
      byKey.set(key, {
        ...prev,
        ...r,
        nuovaLettura: r.nuovaLettura ?? prev.nuovaLettura,
        letturaPrecedente: r.letturaPrecedente ?? prev.letturaPrecedente,
      });
    } else {
      byKey.set(key, r);
    }
  }
  return Array.from(byKey.values());
}

function recordKey(r: MeterRecord): string {
  return `${r.scala}|${r.appartamento}|${r.codiceContatore}`;
}

export function exportToJson(records: MeterRecord[]): string {
  const payload = records.map((r) => ({
    scala: r.scala,
    appartamento: r.appartamento,
    codiceContatore: r.codiceContatore,
    intestatario: r.intestatario ?? "",
    letturaPrecedente: r.letturaPrecedente,
    nuovaLettura: r.nuovaLettura,
    consumo:
      r.nuovaLettura !== null ? r.nuovaLettura - r.letturaPrecedente : null,
  }));
  return JSON.stringify({ exportedAt: new Date().toISOString(), records: payload }, null, 2);
}

export function exportToCsv(records: MeterRecord[]): string {
  const headers = [
    "scala",
    "appartamento",
    "codiceContatore",
    "intestatario",
    "letturaPrecedente",
    "nuovaLettura",
    "consumo",
  ];
  const lines = [headers.join(";")];
  for (const r of records) {
    const consumo =
      r.nuovaLettura !== null ? r.nuovaLettura - r.letturaPrecedente : "";
    const row = [
      r.scala,
      r.appartamento,
      r.codiceContatore,
      r.intestatario ?? "",
      r.letturaPrecedente,
      r.nuovaLettura ?? "",
      consumo,
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`);
    lines.push(row.join(";"));
  }
  return lines.join("\n");
}

export function downloadFile(
  content: string,
  filename: string,
  mime: string
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
