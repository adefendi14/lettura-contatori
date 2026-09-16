export type ScalaId = "A" | "B" | "C";

export type MeterTipo = "acqua" | "riscaldamento";

export interface MeterRecord {
  id: string;
  scala: ScalaId;
  appartamento: string;
  codiceContatore: string;
  tipo: MeterTipo;
  intestatario?: string;
  codice?: string;
  note?: string;
  letturaPrecedente: number;
  nuovaLettura: number | null;
}

export interface AppState {
  records: MeterRecord[];
  selectedScala: ScalaId | null;
  lastSavedAt: string | null;
  dataSource: "sample" | "import";
  condominio?: string;
  gestione?: string;
}

export type ImportMode = "merge" | "replace";

export const TIPO_LABEL: Record<MeterTipo, string> = {
  acqua: "Acqua calda",
  riscaldamento: "Riscaldamento",
};

export const SAMPLE_META = {
  condominio: "Condominio Via Maffucci 53 — Milano",
  gestione: "2025/2026",
};
