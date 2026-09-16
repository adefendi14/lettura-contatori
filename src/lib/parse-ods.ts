import JSZip from "jszip";
import {
  parseAcquaRiscaldamentoGrid,
  pickYearSheet,
  type SheetParseResult,
} from "./parse-acqua-sheet";

const TABLE_NS = "urn:oasis:names:tc:opendocument:xmlns:table:1.0";
const OFFICE_NS = "urn:oasis:names:tc:opendocument:xmlns:office:1.0";

function localName(node: Element): string {
  return node.localName || node.nodeName.replace(/^.*:/, "");
}

function attr(el: Element, local: string, ns?: string): string | null {
  if (ns) {
    const namespaced = el.getAttributeNS(ns, local);
    if (namespaced != null) return namespaced;
  }
  return (
    el.getAttribute(local) ||
    el.getAttribute(`table:${local}`) ||
    el.getAttribute(`office:${local}`) ||
    el.getAttribute(`text:${local}`)
  );
}

function repeatCount(el: Element, name: string): number {
  const raw = attr(el, name, TABLE_NS);
  const n = raw ? parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function cellValue(cell: Element): string {
  const valueType = attr(cell, "value-type", OFFICE_NS);
  const numeric = attr(cell, "value", OFFICE_NS);
  if (numeric != null && (valueType === "float" || valueType === "percentage")) {
    return numeric;
  }
  const parts: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      parts.push(node.textContent ?? "");
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    if (localName(el) === "p" && parts.length) parts.push(" ");
    el.childNodes.forEach(walk);
  };
  cell.childNodes.forEach(walk);
  return parts.join("").replace(/\s+/g, " ").trim();
}

function tableToGrid(table: Element): string[][] {
  const rows: string[][] = [];
  for (const child of Array.from(table.children)) {
    if (localName(child) !== "table-row") continue;
    const rowRepeat = Math.min(repeatCount(child, "number-rows-repeated"), 20);
    const cells: string[] = [];
    for (const cell of Array.from(child.children)) {
      const name = localName(cell);
      if (name !== "table-cell" && name !== "covered-table-cell") continue;
      const rawRepeat = repeatCount(cell, "number-columns-repeated");
      const value = name === "covered-table-cell" ? "" : cellValue(cell);
      const colRepeat =
        rawRepeat > 80 && !value ? 0 : Math.min(rawRepeat, 80);
      for (let i = 0; i < colRepeat; i++) cells.push(value);
    }
    for (let i = 0; i < rowRepeat; i++) {
      rows.push(cells);
      if (rows.length > 400) return rows;
    }
  }
  return rows;
}

function listTables(doc: Document): { name: string; el: Element }[] {
  const tables = Array.from(doc.getElementsByTagNameNS(TABLE_NS, "table"));
  const fallback =
    tables.length > 0
      ? tables
      : Array.from(doc.getElementsByTagName("table:table"));
  return fallback.map((el) => ({
    name: attr(el, "name", TABLE_NS) ?? "Foglio",
    el,
  }));
}

export async function parseOdsFile(
  buffer: ArrayBuffer
): Promise<SheetParseResult | { message: string }> {
  let xml: string;
  try {
    const zip = await JSZip.loadAsync(buffer);
    const file = zip.file("content.xml");
    if (!file) return { message: "File ODS non valido: manca content.xml." };
    xml = await file.async("string");
  } catch {
    return { message: "Impossibile aprire il file ODS." };
  }

  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) {
    return { message: "XML del foglio di calcolo non valido." };
  }

  const tables = listTables(doc);
  if (tables.length === 0) {
    return { message: "Nessun foglio trovato nel file ODS." };
  }

  const chosen = pickYearSheet(tables.map((t) => t.name));
  const table = tables.find((t) => t.name === chosen) ?? tables[tables.length - 1];
  const grid = tableToGrid(table.el);
  const parsed = parseAcquaRiscaldamentoGrid(grid, table.name);

  if (parsed.records.length === 0) {
    return {
      message: parsed.warnings[0] ??
        "Nessun contatore letto dal foglio 25/26. Verifica il file.",
    };
  }

  return parsed;
}
