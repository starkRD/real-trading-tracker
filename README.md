# Real Trading Tracker V2

Personal-first tracker focused on **7Bar vs actual trading performance**.

## Included now
- Live public 7Bar Google Sheet fetch on dashboard/refresh
- 7Bar booked and running PF in % and ₹
- Manual BUY/SELL transaction ledger
- Automatic quantity, average buy, invested amount, realized P&L, running P&L and cash
- Import existing TRADES CSV/XLSX into transactions
- Edit/delete transactions
- Active positions table
- Ticker aliases such as LTIM → LTM
- Browser localStorage only

## Deliberately NOT included
- Supabase/cloud memory/login
- Broker API integration
- STT/GST/brokerage import

Broker integration is planned for V4.

## Run
npm install
npm run dev

## Deploy
Push to GitHub and connect to Vercel. No environment variables are required.
