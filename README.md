# Real Trading Tracker V2

## Scope
- Imports the user's `TRADES.xlsx` as the initial source of truth.
- Reads the `Trades` and `P&L` sheets instead of reconstructing historical P&L from guessed transactions.
- Uses the public 7Bar Google Sheet directly through a Next.js server route.
- Shows booked, running, cash, invested and equity.
- Active comparison is only the intersection of actual current holdings and 7Bar ACTIVE trades.
- LTIM and LTM are treated as the same ticker.
- Manual BUY/SELL transactions update the imported portfolio immediately.
- Fully sold positions disappear automatically.
- No Supabase/cloud memory and no broker integration in this version.

## Expected initial values from the supplied workbook
- Starting capital: ₹3,00,000
- Active investment: ₹2,83,291.17
- Current value: ₹2,77,077.30
- Profit: ₹45,115.45
- Loss: ₹49,982.32
- Net booked P&L: -₹4,866.87
- Current running P&L: -₹6,213.87

## 7Bar source
Public Google Sheet:
https://docs.google.com/spreadsheets/d/1uLyXG-BXWTjQ7secLVmQkSXduO8EaQIHT6GWQQ4Oe4g/edit?gid=2061682406#gid=2061682406

No environment variable is required.

## Deploy
Push the repository to GitHub and import it into Vercel. Vercel will run `npm install` and `npm run build`.
