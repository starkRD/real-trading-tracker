# Real Trading Tracker V2

Personal tracker built around the user's actual two source files.

## Sources

1. **7Bar** — fetched live from the public Google Sheet. No API key, OAuth, or environment variable is required.
2. **TRADES** — user uploads CSV/XLSX containing the actual execution and the existing `PF Booked` and `Running PF` columns.
3. **Broker report** — intentionally not implemented in V2. It will be a separate source for brokerage, STT, GST, exchange charges, stamp duty, DP charges, etc.

## V2 dashboard

- 7Bar Booked % and ₹
- My Booked % and ₹
- Booked difference
- 7Bar Running PF % and ₹
- My Running PF % and ₹
- Running difference
- Missing tickers
- Missed model contribution
- Active trade comparison
- Live 7Bar refresh

## Current files were inspected

7Bar CSV:
- 97 rows
- Active section with 9 active stocks + cash
- Closed section with 73 model entries
- Summary: 7Bar Booked 0.42%, 7Bar Running -1.58%

TRADES CSV:
- 110 rows
- 67 Booked rows
- 9 Active rows
- PF Booked total -1.63%
- Running PF total -1.75%

With the supplied files, conservative ticker-level matching identifies:
- LIQUIDCASE — missing
- POWERINDIA — missing

LTIM is matched to LTM.
Partial exits remain a single TRADES row and are not counted as separate missing trades.

## No env vars

The 7Bar Google Sheet is public. The server fetches:
`https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:json&gid=<GID>`

Keep the sheet public for this to work.

## Run

npm install
npm run dev

Then import the TRADES CSV/XLSX from `/import`.

## Ticker name changes
The tracker canonicalizes symbols before matching. LTIM → LTM is included by default. Future symbol changes can be added from Settings (for example OLD → NEW), so historical TRADES and current 7Bar data continue to match as one stock.
