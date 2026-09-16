"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  consumption,
  formatReading,
  groupByApartment,
} from "@/lib/storage";
import { TIPO_LABEL, type MeterRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MeterListProps {
  records: MeterRecord[];
  onReadingChange: (id: string, value: string) => void;
}

export function MeterList({ records, onReadingChange }: MeterListProps) {
  const groups = groupByApartment(records);

  if (groups.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
        Nessun contatore per questa scala. Importa un file o scegli un&apos;altra
        scala.
      </p>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      {groups.map((group) => (
        <ApartmentCard
          key={group.key}
          appartamento={group.appartamento}
          intestatario={group.intestatario}
          note={group.note}
          meters={group.meters}
          onReadingChange={onReadingChange}
        />
      ))}
    </div>
  );
}

function ApartmentCard({
  appartamento,
  intestatario,
  note,
  meters,
  onReadingChange,
}: {
  appartamento: string;
  intestatario?: string;
  note?: string;
  meters: MeterRecord[];
  onReadingChange: (id: string, value: string) => void;
}) {
  const ordered = [...meters].sort((a, b) => a.tipo.localeCompare(b.tipo));
  const complete = ordered.every(
    (m) => m.nuovaLettura !== null && !Number.isNaN(m.nuovaLettura)
  );
  const hasWarning = ordered.some(
    (m) =>
      m.nuovaLettura !== null && m.nuovaLettura < m.letturaPrecedente
  );

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        complete && !hasWarning && "border-emerald-200/80 bg-emerald-50/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-foreground">
            All. {appartamento}
          </p>
          {intestatario && (
            <p className="mt-0.5 text-sm text-foreground/80">{intestatario}</p>
          )}
        </div>
        {complete && !hasWarning && (
          <CheckCircle2
            className="h-5 w-5 shrink-0 text-emerald-600"
            aria-label="Letture inserite"
          />
        )}
      </div>

      <div className="mt-4 space-y-4">
        {ordered.map((meter) => (
          <MeterFields
            key={meter.id}
            record={meter}
            onReadingChange={onReadingChange}
          />
        ))}
      </div>

      {note && (
        <p className="mt-3 text-xs text-muted-foreground">{note}</p>
      )}
    </article>
  );
}

function MeterFields({
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
    <div className="rounded-lg border border-border/70 bg-background/60 p-3">
      <p className="text-sm font-medium text-foreground">
        {TIPO_LABEL[record.tipo]}
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Lettura prec. 24/25</dt>
          <dd className="mt-1 font-mono text-base tabular-nums">
            {formatReading(record.letturaPrecedente)}
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
            {diff !== null ? formatReading(diff) : "—"}
          </dd>
        </div>
      </dl>
      <label className="mt-3 block">
        <span className="text-sm font-medium text-foreground">
          Nuova lettura 25/26
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
          Valore inferiore alla precedente: controlla eventuali errori.
        </p>
      )}
    </div>
  );
}

export function MeterTable({ records, onReadingChange }: MeterListProps) {
  const groups = groupByApartment(records);
  if (groups.length === 0) return null;

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Alloggio</th>
            <th className="px-4 py-3 font-medium">Intestatario</th>
            <th className="px-4 py-3 font-medium">Acqua 24/25</th>
            <th className="px-4 py-3 font-medium">Acqua 25/26</th>
            <th className="px-4 py-3 font-medium">Cons. acqua</th>
            <th className="px-4 py-3 font-medium">Risc. 24/25</th>
            <th className="px-4 py-3 font-medium">Risc. 25/26</th>
            <th className="px-4 py-3 font-medium">Cons. risc.</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const acqua = group.meters.find((m) => m.tipo === "acqua");
            const risc = group.meters.find((m) => m.tipo === "riscaldamento");
            const complete = group.meters.every(
              (m) => m.nuovaLettura !== null && !Number.isNaN(m.nuovaLettura)
            );
            const warn =
              (acqua &&
                acqua.nuovaLettura !== null &&
                acqua.nuovaLettura < acqua.letturaPrecedente) ||
              (risc &&
                risc.nuovaLettura !== null &&
                risc.nuovaLettura < risc.letturaPrecedente);

            return (
              <tr
                key={group.key}
                className={cn(
                  "border-b border-border last:border-0",
                  complete && !warn && "bg-emerald-50/40"
                )}
              >
                <td className="px-4 py-3 font-medium">{group.appartamento}</td>
                <td className="px-4 py-3">
                  <div>{group.intestatario ?? "—"}</div>
                  {group.note && (
                    <div className="text-xs text-muted-foreground">
                      {group.note}
                    </div>
                  )}
                </td>
                <ReadingCells
                  record={acqua}
                  onReadingChange={onReadingChange}
                />
                <ReadingCells
                  record={risc}
                  onReadingChange={onReadingChange}
                />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReadingCells({
  record,
  onReadingChange,
}: {
  record?: MeterRecord;
  onReadingChange: (id: string, value: string) => void;
}) {
  if (!record) {
    return (
      <>
        <td className="px-4 py-3 text-muted-foreground">—</td>
        <td className="px-4 py-2 text-muted-foreground">—</td>
        <td className="px-4 py-3 text-muted-foreground">—</td>
      </>
    );
  }
  const diff = consumption(record.letturaPrecedente, record.nuovaLettura);
  const isLower =
    record.nuovaLettura !== null &&
    record.nuovaLettura < record.letturaPrecedente;

  return (
    <>
      <td className="px-4 py-3 font-mono tabular-nums">
        {formatReading(record.letturaPrecedente)}
      </td>
      <td className="px-4 py-2">
        <Input
          type="number"
          className="h-10 max-w-[140px] font-mono"
          value={record.nuovaLettura ?? ""}
          onChange={(e) => onReadingChange(record.id, e.target.value)}
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
        {diff !== null ? formatReading(diff) : "—"}
      </td>
    </>
  );
}
