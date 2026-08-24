"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveActuals, actuals } from "@/lib/store";
import { ActualTrade } from "@/lib/types";
import { save7BarSnapshot } from "@/lib/7bar";

const clean = (v: unknown) => String(v ?? "").toLowerCase().replace(/\uFEFF/g, "").replace(/[^a-z0-9]+/g, "");
const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const x = Number(String(v).replace(/[₹,%\s,]/g, ""));
  return Number.isFinite(x) ? x : undefined;
};

function findHeader(rows: unknown[][]) {
  for (let r = 0; r < Math.min(rows.length, 100); r++) {
    const cells = rows[r].map(clean);
    if (cells.some(c => c === "tradename" || c === "ticker" || c === "qty")) return r;
  }
  return -1;
}
function readRows(matrix: unknown[][]) {
  const h = findHeader(matrix);
  if (h < 0) return [];
  const headers = matrix[h].map(clean);
  const idx = (names: string[]) => names.map(clean).map(n => headers.indexOf(n)).find(i => i >= 0) ?? -1;
  const ix = {
    ticker: idx(["Trade Name", "Ticker", "Symbol"]), qty: idx(["QTY", "Qty", "Quantity"]), buy: idx(["Buy Range", "Buy Price", "Buy"]),
    date: idx(["Buy Date", "Date"]), sell1: idx(["Sold AT", "Sell Price", "Sell"]), sellQty1: idx(["Sell qty L1", "Sell Qty 1", "Sell Quantity 1"]),
    sell2: idx(["SOLD (2nd lot)", "Sell Price 2", "Sold 2"]), sellQty2: idx(["Sell qty L2", "Sell Qty 2", "Sell Quantity 2"]), status: idx(["Trade Status", "Status"])
  };
  return matrix.slice(h + 1).map(r => ({
    ticker: ix.ticker >= 0 ? text(r[ix.ticker]) : "", qty: ix.qty >= 0 ? num(r[ix.qty]) || 0 : 0, buy: ix.buy >= 0 ? num(r[ix.buy]) || 0 : 0,
    date: ix.date >= 0 ? text(r[ix.date]) : "", sell1: ix.sell1 >= 0 ? num(r[ix.sell1]) : undefined, sellQty1: ix.sellQty1 >= 0 ? num(r[ix.sellQty1]) : undefined,
    sell2: ix.sell2 >= 0 ? num(r[ix.sell2]) : undefined, sellQty2: ix.sellQty2 >= 0 ? num(r[ix.sellQty2]) : undefined,
    status: ix.status >= 0 ? text(r[ix.status]) : "booked"
  })).filter(r => r.ticker && r.qty > 0 && r.buy > 0);
}
async function readActualFile(file: File) {
  if (file.name.toLowerCase().endsWith(".csv")) {
    const parsed = Papa.parse<string[]>(await file.text(), { skipEmptyLines: true });
    return readRows(parsed.data as unknown[][]);
  }
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", raw: false });
  return workbook.SheetNames.flatMap(name => readRows(XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, defval: "", raw: false })));
}

export default function Import() {
  const [msg, setMsg] = useState("");
  const [syncing, setSyncing] = useState(false);

  async function sync7Bar() {
    setSyncing(true); setMsg("");
    try {
      const res = await fetch("/api/7bar", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not fetch 7Bar");
      save7BarSnapshot({ active: data.active, closed: data.closed, fetchedAt: data.fetchedAt, total: data.total });
      setMsg(`7Bar synced: ${data.active.length} active + ${data.closed.length} closed = ${data.total} model rows.`);
      window.dispatchEvent(new Event("rtt:7bar-sync"));
    } catch (e) { setMsg(`7Bar sync failed: ${e instanceof Error ? e.message : "Unknown error"}`); }
    finally { setSyncing(false); }
  }

  async function importActual(file?: File) {
    if (!file) return;
    setSyncing(true); setMsg("");
    try {
      const rows = await readActualFile(file);
      const incoming: ActualTrade[] = rows.map((r, i) => ({ id: `a-${Date.now()}-${i}`, ticker: r.ticker, qty: r.qty, buy: r.buy, date: r.date, sell1: r.sell1, sellQty1: r.sellQty1, sell2: r.sell2, sellQty2: r.sellQty2, status: r.status || "booked" }));
      saveActuals([...actuals(), ...incoming]);
      setMsg(`Imported ${incoming.length} actual TRADES rows.`);
    } catch (e) { setMsg(`TRADES import failed: ${e instanceof Error ? e.message : "Unknown error"}`); }
    finally { setSyncing(false); }
  }

  useEffect(() => { sync7Bar(); }, []);

  return <>
    <h1 className="text-3xl font-bold">Data Sources</h1>
    <p className="mt-2 text-sm text-zinc-400">7Bar is now fetched directly from its public Google Sheet. Your TRADES file remains an upload.</p>
    <div className="grid gap-5 md:grid-cols-2 mt-7">
      <div className="card p-6"><b>7Bar model — Live Google Sheet</b><p className="mt-2 text-sm text-zinc-500">No upload or Google account is required. The app fetches the public sheet from the server.</p><button className="primary mt-5" disabled={syncing} onClick={sync7Bar}>{syncing ? "Syncing..." : "Refresh 7Bar"}</button></div>
      <div className="card p-6"><b>Your TRADES</b><p className="mt-2 text-sm text-zinc-500">Upload your actual TRADES CSV/XLSX. Broker charges will be a separate data source later.</p><label className="primary inline-block mt-5 cursor-pointer">{syncing ? "Working..." : "Import TRADES"}<input className="hidden" type="file" accept=".csv,.xlsx,.xls" disabled={syncing} onChange={e => importActual(e.target.files?.[0])}/></label></div>
    </div>
    {msg && <div className="mt-5 rounded-xl border border-emerald-900 bg-emerald-950/30 p-4 text-sm text-emerald-300">{msg}</div>}
    <div className="card mt-6 p-6 text-sm text-zinc-400"><b className="text-white">Broker data:</b> STT, GST, brokerage, exchange charges, stamp duty and DP charges will come from a separate broker report. They are not expected in either 7Bar or TRADES.</div>
  </>;
}
