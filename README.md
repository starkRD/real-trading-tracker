# Real Trading Tracker V1

Personal tracker for 7Bar model vs actual broker execution.

## V1
Next.js 14.2.5, TypeScript, Tailwind, CSV/XLSX import, browser localStorage. No broker API, login or multi-user system.

## Run
npm install
npm run dev

## GitHub → Vercel
Push this folder to GitHub, import the repo into Vercel, deploy. No environment variables are required for V1.

## Accounting rule
Never replace actual execution with the model price. If a GTT at ₹3,215 fails and the real manual exit is ₹3,171.56, ₹3,171.56 remains the actual result. Partial exits remain one trade record.

## Next priorities
Exact matching by ticker/date/lot; missed-trade records; partial fills; broker charge import; Groww API; Supabase persistence; model → replicated → actual gross → costs → actual net attribution.
