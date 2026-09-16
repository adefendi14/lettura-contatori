"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { consumption } from "@/lib/storage";
import type { MeterRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MeterListProps {
  records: MeterRecord[];
  onReadingChange: (id: string, value: string) => void;
}

export function MeterList({ records, onReadingChange }: MeterListProps) {
  if (records.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
        Nessun contatore per questa scala. Importa un file o scegli un&apos;altra
        scala.
      </p>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      {records.map((record) => (
        <MeterCard
          key={record.id}
          record={record}
          onReadingChange={onReadingChange}
        />
      ))}
    </div>
  );
}

function MeterCard({
  record,
  onReadingChange,
}: {
  record: MeterRecord;
  onReadingChange: (id: string, value: string) => void;
}) {
  const diff = consumption(record.letturaPrecedente, record.nuovaLettura);
  const hasReading =
    record.nuovaLettura !== null && !Number.isNaN(record.nuovaLettura);
  const isLower =
    hasReading && record.nuovaLettura! < record.letturaPrecedente;

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        hasReading && !isLower && "border-emerald-200/80 bg-emerald-50/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-foreground">
            App. {record.appartamento}
          </p>
          <p className="text-xs text-muted-foreground">
            {record.codiceContatore}
          </p>
          {record.intestatario && (
            <p className="mt-1 text-sm text-foreground/80">
              {record.intestatario}
            </p>
          )}
        </div>
        {hasReading && !isLower && (
          <CheckCircle2
            className="h-5 w-5 shrink-0 text-emerald-600"
            aria-label="Lettura inserita"
          />
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Lettura precedente</dt>
          <dd className="mt-1 font-mono text-base tabular-nums">
            {record.letturaPrecedente}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Consumo</dt>
          <dd
            className={cn(
              "mt-1 font-mono text-base tabular-nums",
              isLower && "text-destructive"
            )}
          >
            {diff !== null ? diff : "—"}
          </dd>
        </div>
      </dl>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-foreground">
          Nuova lettura
        </span>
        <Input
          type="number"
          inputMode="decimal"
          placeholder="Inserisci valore"
          className="mt-1.5 h-12 text-base"
          value={record.nuovaLettura ?? ""}
          onChange={(e) => onReadingChange(record.id, e.target.value)}
        />
      </label>

      {isLower && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          Valore inferiore alla lettura precedente: controlla eventuali errori.
        </p>
      )}
    </article>
  );
}

export function MeterTable({
  records,
  onReadingChange,
}: MeterListProps) {
  if (records.length === 0) return null;

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Appartamento</th>
            <th className="px-4 py-3 font-medium">Codice contatore</th>
            <th className="px-4 py-3 font-medium">Intestatario</th>
            <th className="px-4 py-3 font-medium">Lettura prec.</th>
            <th className="px-4 py-3 font-medium">Nuova lettura</th>
            <th className="px-4 py-3 font-medium">Consumo</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const diff = consumption(
              record.letturaPrecedente,
              record.nuovaLettura
            );
            const hasReading =
              record.nuovaLettura !== null &&
              !Number.isNaN(record.nuovaLettura);
            const isLower =
              hasReading && record.nuovaLettura! < record.letturaPrecedente;

            return (
              <tr
                key={record.id}
                className={cn(
                  "border-b border-border last:border-0",
                  hasReading && !isLower && "bg-emerald-50/40"
                )}
              >
                <td className="px-4 py-3 font-medium">{record.appartamento}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {record.codiceContatore}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {record.intestatario ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {record.letturaPrecedente}
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    className="h-10 max-w-[140px] font-mono"
                    value={record.nuovaLettura ?? ""}
                    onChange={(e) =>
                      onReadingChange(record.id, e.target.value)
                    }
                  />
                  {isLower && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Sotto precedente
                    </span>
                  )}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 font-mono tabular-nums",
                    isLower && "text-destructive"
                  )}
                >
                  {diff !== null ? diff : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
