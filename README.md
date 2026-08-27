# Real Trading Tracker v0.5

## Source of truth
- 7Bar: public Google Sheet, fetched fresh from the server.
- TRADES: public Google Sheet URL, fetched fresh from the server.
- No environment variables are required.
- No browser localStorage persistence is used; manual transactions are session-only until a future database/broker version.

## Calculation rules
- 7Bar Booked and 7Bar Running are read from the 7Bar summary row.
- Actual booked = sum of TRADES `Profit %` column minus sum of TRADES `Loss` column. These columns are rupee amounts in the supplied workbook despite the legacy `Profit %` heading.
- Actual running = sum of current value minus current allocation for rows whose Trade Status is Active and Current Holding > 0.
- Actual running % = actual running / current invested cost.
- Cash = starting capital + actual booked - current invested cost.
- Equity = cash + current market value.
- LTIM is normalized to LTM for matching.
- Active comparison uses only rows marked Active in 7Bar and current holdings in TRADES.
- Partial sells remain part of the same TRADES position.
