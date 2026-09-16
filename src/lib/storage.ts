import { SAMPLE_RECORDS } from "./sample-data";
import type { AppState, MeterRecord, ScalaId } from "./types";

const STORAGE_KEY = "lettura-contatori-state-v1";

export function createInitialState(): AppState {
  return {
    records: SAMPLE_RECORDS,
    selectedScala: null,
    lastSavedAt: null,
    dataSource: "sample",
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
    if (!parsed.records || !Array.isArray(parsed.records)) {
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
  return {
    ...record,
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
    .sort((a, b) =>
      a.appartamento.localeCompare(b.appartamento, "it", { numeric: true })
    );
}

export function consumption(
  precedente: number,
  nuova: number | null
): number | null {
  if (nuova === null || nuova === undefined || Number.isNaN(nuova)) return null;
  return nuova - precedente;
}
