import { SAMPLE_RECORDS } from "./sample-data";
import { SAMPLE_META, type AppState, type MeterRecord, type ScalaId } from "./types";

const STORAGE_KEY = "lettura-contatori-state-v2";

export function createInitialState(): AppState {
  return {
    records: SAMPLE_RECORDS,
    selectedScala: null,
    lastSavedAt: null,
    dataSource: "sample",
    condominio: SAMPLE_META.condominio,
    gestione: SAMPLE_META.gestione,
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") {
    return createInitialState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.records || !Array.isArray(parsed.records) || parsed.records.length === 0) {
      return createInitialState();
    }
    return {
      ...createInitialState(),
      ...parsed,
      records: parsed.records.map(normalizeRecord),
    };
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  const payload: AppState = {
    ...state,
    lastSavedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function normalizeRecord(record: MeterRecord): MeterRecord {
  const tipo =
    record.tipo === "riscaldamento" || record.tipo === "acqua"
      ? record.tipo
      : record.codiceContatore?.toLowerCase().includes("risc")
        ? "riscaldamento"
        : "acqua";
  return {
    ...record,
    tipo,
    nuovaLettura:
      record.nuovaLettura === null || record.nuovaLettura === undefined
        ? null
        : Number(record.nuovaLettura),
    letturaPrecedente: Number(record.letturaPrecedente),
  };
}

export function updateRecordReading(
  records: MeterRecord[],
  id: string,
  nuovaLettura: number | null
): MeterRecord[] {
  return records.map((r) =>
    r.id === id ? { ...r, nuovaLettura } : r
  );
}

export function recordsForScala(
  records: MeterRecord[],
  scala: ScalaId
): MeterRecord[] {
  return records
    .filter((r) => r.scala === scala)
    .sort((a, b) => {
      const apt = a.appartamento.localeCompare(b.appartamento, "it", {
        numeric: true,
      });
      if (apt !== 0) return apt;
      return a.tipo.localeCompare(b.tipo);
    });
}

export function consumption(
  precedente: number,
  nuova: number | null
): number | null {
  if (nuova === null || nuova === undefined || Number.isNaN(nuova)) return null;
  return nuova - precedente;
}

export interface ApartmentGroup {
  key: string;
  scala: ScalaId;
  appartamento: string;
  intestatario?: string;
  note?: string;
  meters: MeterRecord[];
}

export function groupByApartment(records: MeterRecord[]): ApartmentGroup[] {
  const map = new Map<string, ApartmentGroup>();
  for (const record of records) {
    const key = `${record.scala}|${record.appartamento}`;
    const existing = map.get(key);
    if (existing) {
      existing.meters.push(record);
      existing.note = existing.note || record.note;
      existing.intestatario = existing.intestatario || record.intestatario;
    } else {
      map.set(key, {
        key,
        scala: record.scala,
        appartamento: record.appartamento,
        intestatario: record.intestatario,
        note: record.note,
        meters: [record],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.appartamento.localeCompare(b.appartamento, "it", { numeric: true })
  );
}

export function formatReading(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("it-IT");
}
