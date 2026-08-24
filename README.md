# Real Trading Tracker

Personal tracker for comparing 7Bar model performance with actual execution.

## Data sources

1. **7Bar**: fetched automatically from the public Google Sheet configured in `app/api/7bar/route.ts`. No Google login, OAuth or environment variable is required because the sheet is publicly readable.
2. **TRADES**: your actual execution sheet, uploaded as CSV/XLSX.
3. **Broker report**: planned as a separate source for brokerage, STT, GST, exchange charges, stamp duty, DP charges and other real execution costs.

## 7Bar Google Sheet

The current public source is hardcoded for this personal V1:
- Spreadsheet ID: `1uLyXG-BXWTjQ7secLVmQkSXduO8EaQIHT6GWQQ4Oe4g`
- GID: `2061682406`

The server fetches the Google Visualization CSV endpoint with `cache: no-store`, so the tracker can refresh the latest sheet data.

## Run

```bash
npm install
npm run dev
```

## Vercel

No environment variables are required for the 7Bar source in this personal version. Deploy the GitHub repository normally.

## Important

The sheet must remain publicly readable. If its owner makes it private or changes the tab/GID, the sync will stop working.

Actual broker costs are intentionally not mixed into 7Bar or TRADES. They will be imported separately later.
