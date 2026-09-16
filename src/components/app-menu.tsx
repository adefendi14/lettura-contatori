"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FileDown, FileUp, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppMenu({
  onImport,
  onExport,
}: {
  onImport: () => void;
  onExport: (format: "csv" | "json") => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const chooseFile = () => {
    setOpen(false);
    onImport();
  };

  return (
    <div className="relative" ref={wrapRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Menu className="h-4 w-4 sm:mr-1.5" />
        <span className="hidden sm:inline">Menu</span>
      </Button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-md"
        >
          <p className="px-2 pt-1 text-sm font-medium text-foreground">
            Importa documento
          </p>
          <p className="px-2 pb-2 pt-1 text-xs leading-snug text-muted-foreground">
            ODS (foglio <span className="font-medium">25/26</span>), CSV o JSON.
            Per <span className="font-medium">acqua_riscaldamento.ods</span> si
            usa solo il foglio della gestione corrente: le 24/25 restano
            precedenti, le 25/26 da compilare.
          </p>
          <button
            type="button"
            role="menuitem"
            className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-muted"
            onClick={chooseFile}
          >
            <FileUp className="h-4 w-4" />
            Scegli file ODS / CSV / JSON
          </button>
          <div className="my-2 h-px bg-border" />
          <p className="px-2 pb-1 text-sm font-medium text-foreground">
            Esporta letture
          </p>
          <button
            type="button"
            role="menuitem"
            className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-muted"
            onClick={() => {
              setOpen(false);
              onExport("csv");
            }}
          >
            <FileDown className="h-4 w-4" />
            Esporta CSV
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-muted"
            onClick={() => {
              setOpen(false);
              onExport("json");
            }}
          >
            <FileDown className="h-4 w-4" />
            Esporta JSON
          </button>
        </div>
      )}
    </div>
  );
}
