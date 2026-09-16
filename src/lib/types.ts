export type ScalaId = "A" | "B" | "C";

export interface MeterRecord {
  id: string;
  scala: ScalaId;
  appartamento: string;
  codiceContatore: string;
  intestatario?: string;
  letturaPrecedente: number;
  nuovaLettura: number | null;
}

export interface AppState {
  records: MeterRecord[];
  selectedScala: ScalaId | null;
  lastSavedAt: string | null;
  dataSource: "sample" | "import";
}

export type ImportMode = "merge" | "replace";
