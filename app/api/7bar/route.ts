import { NextResponse } from "next/server";
import Papa from "papaparse";

const SHEET_ID = "1uLyXG-BXWTjQ7secLVmQkSXduO8EaQIHT6GWQQ4Oe4g";
const GID = "2061682406";

const clean = (v: unknown) => String(v ?? "").toLowerCase().replace(/\uFEFF/g, "").replace(/[^a-z0-9]+/g, "");
const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  const x = Number(String(v).replace(/[₹,%\s,]/g, ""));
  return Number.isFinite(x) ? x : undefined;
};

function findHeader(rows: string[][], start: number) {
  for (let r = start; r < Math.min(rows.length, start + 10); r++) {
    const cells = rows[r].map(clean);
    if (cells.some(c => c === "ticker")) return r;
  }
  return -1;
}

function parseTable(rows: string[][], section: "active" | "closed") {
  const sectionRow = rows.findIndex(r => r.some(c => clean(c) === `${section}trades`));
  if (sectionRow < 0) return [];
  const headerRow = findHeader(rows, sectionRow + 1);
  if (headerRow < 0) return [];
  const headers = rows[headerRow].map(clean);
  const index = (names: string[]) => {
    for (const n of names) {
      const i = headers.indexOf(clean(n));
      if (i >= 0) return i;
    }
    return -1;
  };
  const ix = {
    ticker: index(["Ticker"]), buy: index(["Buy Price"]), target: index(["Target"]),
    stop: index(["Stoploss", "Stop Loss"]), position: index(["Position %"]),
    status: index(["Trade Status"]), booked: index(["Booked PF"]), running: index(["Running PF"]),
    peak: index(["Peak PF"]), notes: index(["Remarks"]), cmp: index(["CMP"])
  };
  const out = [] as Record<string, unknown>[];
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    const ticker = ix.ticker >= 0 ? text(row[ix.ticker]) : "";
    if (!ticker) continue;
    const normalized = clean(ticker);
    if (["closedtrades", "activetrades", "indexcalculations"].includes(normalized)) break;
    if (ticker === "CASH") continue;
    out.push({
      id: `${section}-${r}-${ticker}`,
      ticker,
      buy: num(row[ix.buy]), target: num(row[ix.target]), stop: num(row[ix.stop]),
      positionPct: num(row[ix.position]), status: text(row[ix.status]) || (section === "active" ? "Active" : "Booked"),
      bookedPct: num(row[ix.booked]), runningPct: num(row[ix.running]), peakPct: num(row[ix.peak]),
      notes: text(row[ix.notes]), cmp: num(row[ix.cmp]), section
    });
  }
  return out;
}

export async function GET() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status}`);
    const csv = await response.text();
    const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: false });
    const rows = parsed.data as string[][];
    const active = parseTable(rows, "active");
    const closed = parseTable(rows, "closed");
    return NextResponse.json({
      ok: true,
      source: "Google Sheets",
      fetchedAt: new Date().toISOString(),
      sheetId: SHEET_ID,
      gid: GID,
      active,
      closed,
      total: active.length + closed.length
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to fetch 7Bar sheet" }, { status: 502 });
  }
}
