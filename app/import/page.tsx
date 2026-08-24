"use client";

import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveActuals, saveModels, actuals, models } from "@/lib/store";
import { ActualTrade, ModelTrade } from "@/lib/types";

const cleanKey = (v: unknown) => String(v ?? "")
  .toLowerCase()
  .replace(/\uFEFF/g, "")
  .replace(/[^a-z0-9]+/g, "")
  .trim();

const text = (v: unknown) => String(v ?? "").trim();

const num = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const x = Number(String(v).replace(/[₹,%\s,]/g, ""));
  return Number.isFinite(x) ? x : undefined;
};

function normaliseRow(header: unknown[], values: unknown[]) {
  const out: Record<string, unknown> = {};
  header.forEach((h, i) => {
    const key = cleanKey(h);
    if (key) out[key] = values[i] ?? "";
  });
  return out;
}

function findHeaderIndex(rows: unknown[][], required: string[]) {
  const wanted = required.map(cleanKey);
  return rows.findIndex(row => {
    const keys = row.map(cleanKey);
    return wanted.every(w => keys.some(k => k === w || k.includes(w) || w.includes(k)));
  });
}

function sheetRows(rows: unknown[][]) {
  if (!rows.length) return [] as Record<string, unknown>[];
  const headerIndex = findHeaderIndex(rows, ["Ticker"]);
  if (headerIndex < 0) return [];
  const header = rows[headerIndex];
  return rows.slice(headerIndex + 1)
    .filter(r => r.some(v => String(v ?? "").trim() !== ""))
    .map(r => normaliseRow(header, r));
}

async function readFile(file: File): Promise<Record<string, unknown>[]> {
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".csv")) {
    const raw = await file.text();
    const parsed = Papa.parse<unknown[]>(raw, {
      header: false,
      skipEmptyLines: true,
      encoding: "UTF-8"
    });
    return sheetRows(parsed.data);
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const all: Record<string, unknown>[] = [];

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: "",
      raw: false
    });
    all.push(...sheetRows(raw));
  }

  return all;
}

const get = (row: Record<string, unknown>, aliases: string[]) => {
  for (const alias of aliases) {
    const key = cleanKey(alias);
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
        ticker: text(get(r, ["Trade Name", "Ticker", "Symbol"])),
        qty: num(get(r, ["QTY", "Qty", "Quantity"])) || 0,
        buy: num(get(r, ["Buy Range", "Buy Price", "Buy"] )) || 0,
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
    } finally {
      setBusy(false);
    }
  }

  async function importModel(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const rows = await readFile(file);
      const incoming: ModelTrade[] = rows.map((r, i) => ({
        id: `m-${Date.now()}-${i}`,
        ticker: text(get(r, ["Ticker", "Trade Name", "Symbol"])),
        date: text(get(r, ["Date", "Trade Date"])),
        buy: num(get(r, ["Buy Price", "Buy"])),
        target: num(get(r, ["Target"])),
        stop: num(get(r, ["Stoploss", "Stop Loss", "Stop"])),
        positionPct: num(get(r, ["Position %", "Position", "Position Percent"])),
        exit: num(get(r, ["Model Exit", "Exit", "Exit Price"])),
        bookedPct: num(get(r, ["Booked PF", "Model PF", "Booked"])),
        status: text(get(r, ["Trade Status", "Status"])) || "booked",
        notes: text(get(r, ["Remarks", "Notes"]))
      })).filter(t => t.ticker);

      saveModels([...models(), ...incoming]);
      setMsg(`Imported ${incoming.length} 7Bar model trades.`);
    } catch (e) {
      setMsg(`Import failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  return <>
    <h1 className="text-3xl font-bold">Import</h1>
    <p className="mt-2 text-sm text-zinc-400">
      The importer now scans CSVs and every XLSX sheet for the real header row, so title rows and multiple sheets are supported.
    </p>

    <div className="grid gap-5 md:grid-cols-2 mt-7">
      <div className="card p-6">
        <b>Your TRADES</b>
        <p className="mt-2 text-sm text-zinc-500">Supports your existing Trade Name, QTY, Buy Range, Sold AT and partial-lot columns.</p>
        <label className="primary inline-block mt-5 cursor-pointer">
          {busy ? "Importing..." : "Import actual"}
          <input className="hidden" type="file" accept=".csv,.xlsx,.xls" disabled={busy} onChange={e => importActual(e.target.files?.[0])}/>
        </label>
      </div>

      <div className="card p-6">
        <b>7Bar model</b>
        <p className="mt-2 text-sm text-zinc-500">Works with XLSX/CSV containing Ticker, Buy Price, Target, Stoploss, Position %, Trade Status, Booked PF and Remarks.</p>
        <label className="primary inline-block mt-5 cursor-pointer">
          {busy ? "Importing..." : "Import 7Bar"}
          <input className="hidden" type="file" accept=".csv,.xlsx,.xls" disabled={busy} onChange={e => importModel(e.target.files?.[0])}/>
        </label>
      </div>
    </div>

    {msg && <div className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/30 p-4 text-sm text-emerald-300">{msg}</div>}

    <div className="card mt-6 p-6 text-sm text-zinc-400">
      <b className="text-white">Important:</b> partial sells remain one actual trade; the actual execution price is never replaced by the 7Bar model price.
    </div>
  </>;
}
