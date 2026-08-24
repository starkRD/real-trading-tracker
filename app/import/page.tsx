"use client";

import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveActuals, saveModels, actuals, models } from "@/lib/store";
import { ActualTrade, ModelTrade } from "@/lib/types";

const clean = (v: unknown) => String(v ?? "").toLowerCase().replace(/\uFEFF/g, "").replace(/[^a-z0-9]+/g, "");
const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const x = Number(String(v).replace(/[₹,%\s,]/g, ""));
  return Number.isFinite(x) ? x : undefined;
};

const ALIASES: Record<string, string[]> = {
  ticker: ["Ticker", "Trade Name", "Symbol", "Stock", "Scrip", "Company"],
  date: ["Date", "Trade Date", "Entry Date"],
  buy: ["Buy Price", "Buy", "Buy Range", "Entry", "Entry Price"],
  target: ["Target", "Target Price", "TGT"],
  stop: ["Stoploss", "Stop Loss", "Stop", "SL", "Stoploss Price"],
  position: ["Position %", "Position", "Position Percent", "Allocation %", "Weight %"],
  exit: ["Model Exit", "Exit", "Exit Price", "Sold At", "Sell Price"],
  booked: ["Booked PF", "Model PF", "Booked", "Booked %", "PF Booked"],
  status: ["Trade Status", "Status", "Action", "Result"],
  notes: ["Remarks", "Notes", "Remark", "Comments"]
};

function findColumn(row: unknown[], aliases: string[]) {
  const cells = row.map(clean);
  for (const alias of aliases) {
    const a = clean(alias);
    const idx = cells.findIndex(c => c === a || (c && (c.includes(a) || a.includes(c))));
    if (idx >= 0) return idx;
  }
  return -1;
}

function findHeader(rows: unknown[][]) {
  for (let r = 0; r < Math.min(rows.length, 100); r++) {
    const row = rows[r] || [];
    const ticker = findColumn(row, ALIASES.ticker);
    if (ticker >= 0) {
      const columns: Record<string, number> = {};
      for (const [key, aliases] of Object.entries(ALIASES)) columns[key] = findColumn(row, aliases);
      return { rowIndex: r, columns };
    }
  }
  return null;
}

function looksLikeTicker(v: unknown) {
  const s = text(v);
  if (!s || s.length > 30) return false;
  if (/^(active trades|closed trades|index calculations|ticker|cash)$/i.test(s)) return false;
  return /^[A-Za-z0-9][A-Za-z0-9._&-]{1,29}$/.test(s);
}

function matrixToRows(matrix: unknown[][]) {
  const header = findHeader(matrix);
  if (header) {
    const rows = matrix.slice(header.rowIndex + 1).filter(r => r.some(v => text(v) !== ""));
    return rows.map(r => {
      const o: Record<string, unknown> = {};
      for (const [key, idx] of Object.entries(header.columns)) o[key] = idx >= 0 ? r[idx] ?? "" : "";
      return o;
    });
  }

  // Fallback for XLSX exports where merged/formatting causes the header row to disappear.
  // 7Bar layout: Ticker, CMP/status, Buy, Target, Stoploss, Position %, Trade Status, Booked PF, Running PF, Remarks.
  return matrix.filter(r => {
    const ticker = text(r[0]);
    return looksLikeTicker(ticker) && (text(r[3]) !== "" || text(r[6]) !== "" || text(r[8]) !== "");
  }).map(r => ({
    ticker: r[0] ?? "",
    date: "",
    buy: r[3] ?? "",
    target: r[4] ?? "",
    stop: r[5] ?? "",
    position: r[6] ?? "",
    status: r[7] ?? "",
    booked: r[8] ?? "",
    notes: r[10] ?? ""
  }));
}

async function readFile(file: File) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".csv")) {
    const raw = await file.text();
    const parsed = Papa.parse<string[]>(raw, { header: false, skipEmptyLines: true });
    return matrixToRows(parsed.data as unknown[][]);
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true, raw: false });
  const all: Record<string, unknown>[] = [];
  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: false });
    all.push(...matrixToRows(matrix));
  }
  return all;
}

const get = (row: Record<string, unknown>, aliases: string[]) => {
  for (const alias of aliases) {
    const key = clean(alias);
    if (row[key] !== undefined && row[key] !== "") return row[key];
  }
  return undefined;
};

export default function Import() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function importActual(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const rows = await readFile(file);
      const incoming: ActualTrade[] = rows.map((r, i) => ({
        id: `a-${Date.now()}-${i}`,
        ticker: text(get(r, ["Trade Name", "Ticker", "Symbol"]) ?? r.ticker),
        qty: num(get(r, ["QTY", "Qty", "Quantity"])) || 0,
        buy: num(get(r, ["Buy Range", "Buy Price", "Buy"])) || 0,
        date: text(get(r, ["Buy Date", "Date"])),
        sell1: num(get(r, ["Sold AT", "Sell Price", "Sell"])),
        sellQty1: num(get(r, ["Sell qty L1", "Sell Qty 1", "Sell Quantity 1"])),
        sell2: num(get(r, ["SOLD (2nd lot)", "Sell Price 2", "Sold 2"])),
        sellQty2: num(get(r, ["Sell qty L2", "Sell Qty 2", "Sell Quantity 2"])),
        status: text(get(r, ["Trade Status", "Status"])) || "booked"
      })).filter(t => t.ticker && t.qty > 0 && t.buy > 0);
      saveActuals([...actuals(), ...incoming]);
      setMsg(`Imported ${incoming.length} actual trades.`);
    } catch (e) {
      setMsg(`Import failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally { setBusy(false); }
  }

  async function importModel(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const rows = await readFile(file);
      const incoming: ModelTrade[] = rows.map((r, i) => ({
        id: `m-${Date.now()}-${i}`,
        ticker: text(r.ticker ?? get(r, ALIASES.ticker)),
        date: text(r.date ?? get(r, ALIASES.date)),
        buy: num(r.buy ?? get(r, ALIASES.buy)),
        target: num(r.target ?? get(r, ALIASES.target)),
        stop: num(r.stop ?? get(r, ALIASES.stop)),
        positionPct: num(r.position ?? get(r, ALIASES.position)),
        exit: num(r.exit ?? get(r, ALIASES.exit)),
        bookedPct: num(r.booked ?? get(r, ALIASES.booked)),
        status: text(r.status ?? get(r, ALIASES.status)) || "booked",
        notes: text(r.notes ?? get(r, ALIASES.notes))
      })).filter(t => t.ticker);

      if (!incoming.length) {
        setMsg(`0 imported. The file was read, but no 7Bar trade rows were recognised. The importer expects the Ticker column or the standard 7Bar table layout.`);
      } else {
        saveModels([...models(), ...incoming]);
        setMsg(`Imported ${incoming.length} 7Bar model rows.`);
      }
    } catch (e) {
      setMsg(`Import failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally { setBusy(false); }
  }

  return <>
    <h1 className="text-3xl font-bold">Import</h1>
    <p className="mt-2 text-sm text-zinc-400">Reads the 7Bar table directly, including title rows, merged headers and multiple XLSX sheets.</p>
    <div className="grid gap-5 md:grid-cols-2 mt-7">
      <div className="card p-6"><b>Your TRADES</b><p className="mt-2 text-sm text-zinc-500">Supports Trade Name, QTY, Buy Range, Sold AT and partial-lot columns.</p><label className="primary inline-block mt-5 cursor-pointer">{busy ? "Importing..." : "Import actual"}<input className="hidden" type="file" accept=".csv,.xlsx,.xls" disabled={busy} onChange={e => importActual(e.target.files?.[0])}/></label></div>
      <div className="card p-6"><b>7Bar model</b><p className="mt-2 text-sm text-zinc-500">Reads the 7Bar Active Trades and Closed Trades tables.</p><label className="primary inline-block mt-5 cursor-pointer">{busy ? "Importing..." : "Import 7Bar"}<input className="hidden" type="file" accept=".csv,.xlsx,.xls" disabled={busy} onChange={e => importModel(e.target.files?.[0])}/></label></div>
    </div>
    {msg && <div className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/30 p-4 text-sm text-emerald-300">{msg}</div>}
    <div className="card mt-6 p-6 text-sm text-zinc-400"><b className="text-white">Important:</b> partial sells remain one actual trade; actual execution prices are never replaced by 7Bar model prices.</div>
  </>;
}
