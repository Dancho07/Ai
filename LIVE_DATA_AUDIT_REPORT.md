# Live Data Audit Report

## Data flow diagram (end-to-end)

```
UI (index.html, live.html)
  └─> AppCore initTradePage/initLivePage (core.js)
        ├─> marketState/watchlist stores + caches
        ├─> refresh cycle (runRefreshCycle -> refreshVisibleQuotes)
        │     └─> fetchYahooQuotes (core.js)
        │           └─> fetchJson -> fetchJsonWithFallback -> fetchJsonWithRetry
        │                 ├─> /api/quote (server proxy, if present)
        │                 ├─> https://corsproxy.io/?<Yahoo quote URL>
        │                 ├─> https://cors.isomorphic-git.org/<Yahoo quote URL>
        │                 └─> https://api.allorigins.win/raw?url=<Yahoo quote URL>
        │
        └─> fetchHistoricalSeries (Yahoo chart endpoint + proxy chain)
              └─> normalized + cached historical series

Normalized quote + chart data
  ├─> normalizeQuote/buildQuoteFromYahoo
  ├─> updateStockWithQuote/updateStockWithHistorical
  ├─> compute header quality + badges
  └─> UI render (tables, status pill, result card)
```

## Live-data UI entry points

- **Trade page (single symbol):** `index.html` renders the live price and quote badges, driven by `initTradePage()` and `updateResultLivePriceDisplay()` in `core.js`.【F:index.html†L1-L160】【F:core.js†L3440-L3762】【F:core.js†L6466-L6469】
- **Market Pulse dashboard (watchlist):** `live.html` renders the live watchlist table and market indicators through `initLivePage()` and `renderMarketTable()` in `core.js`.【F:live.html†L1-L240】【F:core.js†L6408-L6624】【F:core.js†L5969-L6210】

## State/store layer and update triggers

- **State containers:** `marketState`, `marketStateIndex`, `watchlistStore`, `favoritesStore`, and cache maps (`quoteCache`, `lastKnownQuotes`, `historicalCache`).【F:core.js†L185-L326】
- **Update triggers:**
  - **User actions:** form submit, watchlist add/remove, filter inputs, and manual refresh trigger `runRefreshCycle()` or `refreshVisibleQuotes()`.【F:core.js†L6011-L6203】【F:core.js†L6408-L6693】
  - **Automatic refresh:** `scheduleNextMarketRefresh()` schedules polling based on session-specific intervals and visibility state.【F:core.js†L5386-L5484】

## Networking layer (REST/polling) + backend endpoints

- **Polling:** `scheduleNextMarketRefresh()` triggers a refresh cycle, which in turn calls `refreshVisibleQuotes()` and `fetchYahooQuotes()` to retrieve quote updates at dynamic intervals per market session.【F:core.js†L5386-L5484】【F:core.js†L4895-L5178】
- **Yahoo quote endpoint (source of truth):** `https://query1.finance.yahoo.com/v7/finance/quote?symbols=...` (REST).【F:core.js†L267-L269】【F:core.js†L4015-L4188】
- **Yahoo chart endpoint (history):** `https://query1.finance.yahoo.com/v8/finance/chart/<symbol>?range=<range>&interval=<interval>&includePrePost=false`.【F:core.js†L269-L271】【F:core.js†L4217-L4232】
- **Proxy chain (browser):** `/api/quote` (if implemented), `corsproxy.io`, `cors.isomorphic-git.org`, `api.allorigins.win/raw`. These are used to bypass CORS in the browser. The chain is ordered and retried on failure.【F:core.js†L273-L299】【F:core.js†L4015-L4103】

## External providers/APIs + auth

- **Provider:** Yahoo Finance (no API key used). Requests are anonymous and unauthenticated; no secrets are stored in repo. URLs are constructed directly in code.【F:core.js†L229-L270】
- **Proxies:** Public CORS proxies listed above (no keys). If a proxy returns HTML or malformed JSON, the fetch layer detects and surfaces a provider error.【F:core.js†L1560-L1718】【F:core.js†L4015-L4103】

## Caching layers + TTLs

- **Quote cache (per-symbol):** in-memory cache with TTL based on session (regular: 5s, pre/post: 12s, closed: 5m).【F:core.js†L233-L235】【F:core.js†L1262-L1271】【F:core.js†L3985-L3992】
- **Batch quote cache:** in-memory cache for quote batches (8s).【F:core.js†L228-L229】【F:core.js†L4075-L4090】
- **Historical cache:** in-memory + persisted with TTLs (daily: 24h, intraday: 1h).【F:core.js†L236-L237】【F:core.js†L1296-L1304】【F:core.js†L3993-L4013】
- **Last-known quote persistence:** stored in local storage under `market_quote_cache_v1`.【F:core.js†L231-L232】【F:core.js†L1275-L1356】

## Authoritative “source of truth”

- **Origin of values:** Yahoo Finance quote endpoint provides the live price and market session data; the chart endpoint provides historical data used for 1D/1M/1Y changes and indicators.【F:core.js†L267-L271】【F:core.js†L4015-L4232】
- **Update frequency:** polling intervals are session-based (regular 5s, pre/post 12s, closed 5m), adjusted for rate-limit backoff and page visibility.【F:core.js†L238-L247】【F:core.js†L1450-L1485】【F:core.js†L5386-L5484】
- **Freshness handling:** quotes are normalized to classify source (REALTIME/DELAYED/CACHED/LAST_CLOSE) and compute badge state, with staleness thresholds and warning flags.【F:core.js†L1729-L2068】
- **Error handling:** retried requests with exponential backoff and proxy fallback; failures surface banner messages and cached data fallback when possible.【F:core.js†L1597-L1759】【F:core.js†L5181-L5360】

## Bugs found + fixes

1) **Bug:** `fetchJsonWithRetry()` attempted `response.json()` first, then attempted `response.text()` on the same response when JSON parsing failed. For non-JSON responses (HTML from proxies), the body can be consumed by the failed JSON read, preventing fallback parsing and causing avoidable failures.  
   - **Root cause:** missing `response.clone()` before reading JSON.  
   - **Minimal reproduction:** a proxy returning HTML or malformed JSON causes `response.json()` to throw; fallback `response.text()` then fails due to a consumed body.  
   - **Fix:** clone the response before JSON parsing and use the clone for fallback text parsing.  
   - **Tests:** added a test to assert JSON parsing from the text body when `response.json()` throws.  
   - **Files:** `core.js`, `tests/app.test.js`.【F:core.js†L1608-L1677】【F:tests/app.test.js†L69-L96】【F:tests/app.test.js†L798-L830】

## How to verify locally

1) **Run tests:** `node tests/app.test.js`  
   - **Expected:** all tests pass, including the new JSON-from-text parsing test.
2) **Manual UI check (optional):** open `live.html` in a browser and ensure the refresh pill updates every ~5s during market hours and shows the “REALTIME” badge when quotes are fresh.

