"use client";

import { CheckCircle2, FileDown, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExportActions({
  allDone,
  scalaDone,
  scala,
  onExport,
  variant = "inline",
}: {
  allDone: boolean;
  scalaDone: boolean;
  scala: string | null;
  onExport: (format: "csv" | "json") => void;
  variant?: "inline" | "sticky";
}) {
  const ready = allDone || scalaDone;
  const title = allDone
    ? "Sopralluogo completato"
    : scalaDone
      ? `Scala ${scala} completata`
      : "Quando hai finito";
  const copy = allDone
    ? "Scarica il CSV da inviare in amministrazione: contiene tutte le scale, le nuove letture e i consumi."
    : scalaDone
      ? "Puoi già scaricare il file: include anche le altre scale, anche se non sono finite."
      : "Il lavoro si salva da solo sul telefono. A letture finite, usa il pulsante grande per scaricare il file da inviare.";

  const buttons = (
    <div className="mt-3 grid grid-cols-1 gap-2">
      <Button
        type="button"
        className="h-12 w-full text-base font-semibold"
        onClick={() => onExport("csv")}
      >
        <FileSpreadsheet className="mr-2 h-5 w-5" />
        {ready ? "Scarica file CSV" : "Esporta CSV"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full text-base"
        onClick={() => onExport("json")}
      >
        <FileJson className="mr-2 h-5 w-5" />
        {ready ? "Scarica copia JSON" : "Esporta JSON"}
      </Button>
    </div>
  );

  const inner = (
    <>
      <div className="flex items-start gap-2">
        {ready ? (
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
        ) : (
          <FileDown className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">
            {copy}
          </p>
        </div>
      </div>
      {buttons}
    </>
  );

  if (variant === "sticky") {
    return (
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] md:hidden",
          ready && "border-emerald-200 bg-emerald-50/95"
        )}
      >
        <div className="mx-auto max-w-5xl">{inner}</div>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        ready && "border-emerald-200 bg-emerald-50/40"
      )}
    >
      {inner}
    </section>
  );
}
