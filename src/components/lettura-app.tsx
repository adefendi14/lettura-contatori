"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  FileDown,
  FileUp,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MeterList, MeterTable } from "@/components/meter-list";
import { InstallPrompt } from "@/components/install-prompt";
import {
  downloadFile,
  exportToCsv,
  exportToJson,
  mergeRecords,
  parseImportFile,
} from "@/lib/import-export";
import {
  createInitialState,
  loadState,
  recordsForScala,
  saveState,
  updateRecordReading,
} from "@/lib/storage";
import type { AppState, ImportMode, ScalaId } from "@/lib/types";
import { cn } from "@/lib/utils";

const SCALA_OPTIONS: ScalaId[] = ["A", "B", "C"];

export function LetturaApp() {
  const [state, setState] = useState<AppState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    records: AppState["records"];
    warnings: string[];
  } | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Ripristino da localStorage dopo l'idratazione
    // eslint-disable-next-line react-hooks/set-state-in-effect -- caricamento client-only
    setState(loadState());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: AppState) => {
    setState(next);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveState(next);
    }, 300);
  }, []);

  const filtered = useMemo(() => {
    if (!state?.selectedScala) return [];
    return recordsForScala(state.records, state.selectedScala);
  }, [state]);

  const completedCount = useMemo(() => {
    return filtered.filter((r) => r.nuovaLettura !== null).length;
  }, [filtered]);

  const selectScala = (scala: ScalaId) => {
    if (!state) return;
    persist({ ...state, selectedScala: scala });
  };

  const backToHome = () => {
    if (!state) return;
    persist({ ...state, selectedScala: null });
  };

  const handleReadingChange = (id: string, raw: string) => {
    if (!state) return;
    const nuova =
      raw === "" ? null : Number(raw.replace(",", "."));
    const nextRecords = updateRecordReading(
      state.records,
      id,
      nuova !== null && Number.isNaN(nuova) ? null : nuova
    );
    persist({ ...state, records: nextRecords });
  };

  const handleFile = async (file: File) => {
    setImportError(null);
    const text = await file.text();
    const result = parseImportFile(text, file.name);
    if ("message" in result) {
      setImportError(result.message);
      toast.error(result.message);
      return;
    }
    setPendingImport(result);
  };

  const confirmImport = () => {
    if (!state || !pendingImport) return;
    const merged = mergeRecords(
      state.records,
      pendingImport.records,
      importMode
    );
    persist({
      ...state,
      records: merged,
      dataSource: "import",
      selectedScala: state.selectedScala,
    });
    if (pendingImport.warnings.length) {
      toast.message("Import completato con avvisi", {
        description: pendingImport.warnings.slice(0, 3).join(" "),
      });
    } else {
      toast.success("Dati importati correttamente");
    }
    setPendingImport(null);
  };

  const handleExport = (format: "csv" | "json") => {
    if (!state) return;
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "json") {
      downloadFile(
        exportToJson(state.records),
        `letture-contatori-${stamp}.json`,
        "application/json"
      );
    } else {
      downloadFile(
        exportToCsv(state.records),
        `letture-contatori-${stamp}.csv`,
        "text/csv;charset=utf-8"
      );
    }
    toast.success("Esportazione avviata");
  };

  if (!hydrated) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <p className="text-sm">Caricamento dati…</p>
      </div>
    );
  }

  const onHome = state.selectedScala === null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            {!onHome && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 mb-0.5 h-9 gap-1"
                onClick={backToHome}
              >
                <ArrowLeft className="h-4 w-4" />
                Scale
              </Button>
            )}
            <h1 className="truncate text-lg font-semibold tracking-tight">
              Lettura Contatori
            </h1>
            <p className="text-xs text-muted-foreground">
              {onHome
                ? "Sopralluogo condominiale"
                : `Scala ${state.selectedScala} · ${completedCount}/${filtered.length} completate`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {state.lastSavedAt && (
              <span
                className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"
                title={state.lastSavedAt}
              >
                <Save className="h-3.5 w-3.5" />
                Salvato
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Importa</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => handleExport("csv")}
            >
              <FileDown className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Esporta</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24">
        {importError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {importError}
          </div>
        )}

        {onHome ? (
          <HomeView
            records={state.records}
            onSelectScala={selectScala}
            onImportClick={() => fileInputRef.current?.click()}
          />
        ) : (
          <>
            <MeterList
              records={filtered}
              onReadingChange={handleReadingChange}
            />
            <MeterTable
              records={filtered}
              onReadingChange={handleReadingChange}
            />
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleExport("json")}
              >
                Esporta JSON (tutte le scale)
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleExport("csv")}
              >
                Esporta CSV (tutte le scale)
              </Button>
            </div>
          </>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,text/csv,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <AlertDialog
        open={pendingImport !== null}
        onOpenChange={(open) => !open && setPendingImport(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma importazione</AlertDialogTitle>
            <AlertDialogDescription>
              Trovati {pendingImport?.records.length ?? 0} contatori nel file.
              Scegli come applicare l&apos;importazione.
            </AlertDialogDescription>
            <div className="flex flex-col gap-2 py-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === "merge"}
                  onChange={() => setImportMode("merge")}
                />
                <span>
                  <span className="font-medium text-foreground">Unisci</span>
                  <span className="block text-xs text-muted-foreground">
                    Aggiorna i contatori esistenti e aggiungi i nuovi
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === "replace"}
                  onChange={() => setImportMode("replace")}
                />
                <span>
                  <span className="font-medium text-foreground">
                    Sostituisci
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Usa solo i dati del file importato
                  </span>
                </span>
              </label>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>
              Importa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InstallPrompt />
    </>
  );
}

function HomeView({
  records,
  onSelectScala,
  onImportClick,
}: {
  records: AppState["records"];
  onSelectScala: (s: ScalaId) => void;
  onImportClick: () => void;
}) {
  const counts = SCALA_OPTIONS.map((scala) => ({
    scala,
    total: records.filter((r) => r.scala === scala).length,
    done: records.filter(
      (r) => r.scala === scala && r.nuovaLettura !== null
    ).length,
  }));

  const empty = records.length === 0;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-medium text-muted-foreground">
          Seleziona scala
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {counts.map(({ scala, total, done }) => (
            <button
              key={scala}
              type="button"
              disabled={total === 0}
              onClick={() => onSelectScala(scala)}
              className={cn(
                "flex min-h-[88px] flex-col items-start justify-center rounded-xl border border-border bg-card px-5 py-4 text-left shadow-sm transition-colors",
                "hover:border-foreground/20 hover:bg-muted/40 active:scale-[0.99]",
                "disabled:cursor-not-allowed disabled:opacity-40"
              )}
            >
              <span className="text-2xl font-semibold tracking-tight">
                Scala {scala}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">
                {total === 0
                  ? "Nessun contatore"
                  : `${done} / ${total} letture`}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-border bg-muted/30 p-5">
        <h2 className="text-sm font-medium text-foreground">
          Importa documento precedente
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Carica un file CSV o JSON con appartamenti, codici contatore e letture
          precedenti. I dati di esempio restano disponibili finché non
          sostituisci l&apos;elenco.
        </p>
        <Button
          type="button"
          className="mt-4 h-11 w-full sm:w-auto"
          variant="secondary"
          onClick={onImportClick}
        >
          <FileUp className="mr-2 h-4 w-4" />
          Scegli file CSV / JSON
        </Button>
      </section>

      {empty && (
        <p
          role="status"
          className="text-center text-sm text-muted-foreground"
        >
          Nessun dato presente. Importa un file per iniziare.
        </p>
      )}
    </div>
  );
}
