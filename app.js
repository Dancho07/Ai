const isBrowser = typeof document !== "undefined";
const form = isBrowser ? document.getElementById("trade-form") : null;
const errors = isBrowser ? document.getElementById("errors") : null;
const statusNotice = isBrowser ? document.getElementById("status") : null;
const resultCard = isBrowser ? document.getElementById("result") : null;

const resultSymbol = isBrowser ? document.getElementById("result-symbol") : null;
const resultAction = isBrowser ? document.getElementById("result-action") : null;
const resultConfidence = isBrowser ? document.getElementById("result-confidence") : null;
const resultShares = isBrowser ? document.getElementById("result-shares") : null;
const resultLivePrice = isBrowser ? document.getElementById("result-live-price") : null;
const resultPrice = isBrowser ? document.getElementById("result-price") : null;
const resultThesis = isBrowser ? document.getElementById("result-thesis") : null;
const resultGenerated = isBrowser ? document.getElementById("result-generated") : null;
const resultDisclaimer = isBrowser ? document.getElementById("result-disclaimer") : null;

const marketBody = isBrowser ? document.getElementById("market-body") : null;
const filterSearch = isBrowser ? document.getElementById("filter-search") : null;
const filterSector = isBrowser ? document.getElementById("filter-sector") : null;
const filterCap = isBrowser ? document.getElementById("filter-cap") : null;
const filterSignal = isBrowser ? document.getElementById("filter-signal") : null;
const filterMin = isBrowser ? document.getElementById("filter-min") : null;
const filterMax = isBrowser ? document.getElementById("filter-max") : null;
const filterMonth = isBrowser ? document.getElementById("filter-month") : null;
const filterYear = isBrowser ? document.getElementById("filter-year") : null;

const riskLimits = {
  low: 0.2,
  moderate: 0.4,
  high: 0.6,
};

const confidenceLabels = {
  buy: "medium",
  sell: "medium",
  hold: "low",
};

const marketWatchlist = [
  { symbol: "AAPL", name: "Apple", sector: "Technology", cap: "Large" },
  { symbol: "MSFT", name: "Microsoft", sector: "Technology", cap: "Large" },
  { symbol: "NVDA", name: "NVIDIA", sector: "Technology", cap: "Large" },
  { symbol: "TSLA", name: "Tesla", sector: "Consumer", cap: "Large" },
  { symbol: "AMZN", name: "Amazon", sector: "Consumer", cap: "Large" },
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Finance", cap: "Large" },
  { symbol: "V", name: "Visa", sector: "Finance", cap: "Large" },
  { symbol: "UNH", name: "UnitedHealth", sector: "Healthcare", cap: "Large" },
  { symbol: "PFE", name: "Pfizer", sector: "Healthcare", cap: "Large" },
  { symbol: "XOM", name: "Exxon Mobil", sector: "Energy", cap: "Large" },
  { symbol: "OXY", name: "Occidental", sector: "Energy", cap: "Mid" },
  { symbol: "PLTR", name: "Palantir", sector: "Technology", cap: "Mid" },
  { symbol: "SHOP", name: "Shopify", sector: "Technology", cap: "Mid" },
  { symbol: "SQ", name: "Block", sector: "Finance", cap: "Mid" },
  { symbol: "ROKU", name: "Roku", sector: "Consumer", cap: "Mid" },
  { symbol: "F", name: "Ford", sector: "Consumer", cap: "Mid" },
  { symbol: "DKNG", name: "DraftKings", sector: "Consumer", cap: "Small" },
  { symbol: "ENPH", name: "Enphase", sector: "Energy", cap: "Small" },
  { symbol: "CRSP", name: "CRISPR", sector: "Healthcare", cap: "Small" },
  { symbol: "UPST", name: "Upstart", sector: "Finance", cap: "Small" },
];

const marketState = marketWatchlist.map((stock) => ({
  ...stock,
  history: [],
  lastPrice: null,
  previousClose: null,
  dailyChange: null,
  monthlyChange: null,
  yearlyChange: null,
  lastUpdated: null,
  lastUpdatedAt: null,
  quoteAsOf: null,
  quoteSession: null,
  isRealtime: false,
  dataSource: "live",
}));
const extraSymbolData = new Map();

const quoteFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const PROVIDER = "Yahoo Finance";
const MAX_RETRIES = 4;
const REQUEST_TIMEOUT_MS = 8000;
const BACKOFF_BASE_MS = 500;
const RETRYABLE_STATUS = new Set([429, 503, 504]);
const RETRYABLE_ERRORS = new Set(["timeout", "rate_limit", "unavailable"]);
const LAST_KNOWN_CACHE_KEY = "market_quote_cache_v1";
const MARKET_OPEN_TTL_MS = 30 * 1000;
const MARKET_CLOSED_TTL_MS = 5 * 60 * 1000;
const HISTORICAL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const YAHOO_QUOTE_URL = (symbols) =>
  `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
const YAHOO_CHART_URL = (symbol, range) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d&includePrePost=false`;

const quoteCache = new Map();
const lastKnownQuotes = new Map();
const historicalCache = new Map();

class MarketDataError extends Error {
  constructor(type, message, details = {}) {
    super(message);
    this.name = "MarketDataError";
    this.type = type;
    this.details = details;
  }
}

function createRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function logMarketDataEvent(level, payload) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...payload,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
}

function isValidSymbol(symbol) {
  const symbolPattern = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;
  return symbolPattern.test(symbol);
}

function formatTime(timestamp) {
  if (!timestamp) {
    return "unknown time";
  }
  return new Date(timestamp).toLocaleTimeString();
}

function formatAsOf(timestamp) {
  if (!timestamp) {
    return "unknown time";
  }
  return new Date(timestamp).toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function getCacheTtl(session) {
  if (session === "REGULAR" || session === "PRE" || session === "POST") {
    return MARKET_OPEN_TTL_MS;
  }
  return MARKET_CLOSED_TTL_MS;
}

function loadPersistentQuoteCache() {
  if (!isBrowser || typeof localStorage === "undefined") {
    return;
  }
  try {
    const raw = localStorage.getItem(LAST_KNOWN_CACHE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([symbol, entry]) => {
      if (entry?.quote?.price !== null) {
        lastKnownQuotes.set(symbol, entry);
      }
    });
  } catch (error) {
    console.warn("Unable to read cached quotes.", error);
  }
}

function persistLastKnownQuotes() {
  if (!isBrowser || typeof localStorage === "undefined") {
    return;
  }
  const payload = {};
  lastKnownQuotes.forEach((value, symbol) => {
    payload[symbol] = value;
  });
  try {
    localStorage.setItem(LAST_KNOWN_CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Unable to persist cached quotes.", error);
  }
}

function setLastKnownQuote(symbol, quote) {
  lastKnownQuotes.set(symbol, { quote, savedAt: Date.now() });
  persistLastKnownQuotes();
}

function resetQuoteCache() {
  quoteCache.clear();
  lastKnownQuotes.clear();
  historicalCache.clear();
  if (isBrowser && typeof localStorage !== "undefined") {
    localStorage.removeItem(LAST_KNOWN_CACHE_KEY);
  }
}

function getCachedQuote(symbol) {
  const entry = quoteCache.get(symbol);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.quote;
  }
  return null;
}

function getLastKnownQuote(symbol) {
  const entry = lastKnownQuotes.get(symbol);
  return entry?.quote ?? null;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseProviderError(payload) {
  const chartError = payload?.chart?.error;
  const quoteError = payload?.quoteResponse?.error;
  return chartError || quoteError || null;
}

async function fetchWithTimeout(fetchFn, url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchFn(url, { signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new MarketDataError("timeout", "Request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchJsonWithRetry(
  url,
  { fetchFn = fetch, timeoutMs = REQUEST_TIMEOUT_MS, maxAttempts = MAX_RETRIES, provider, symbol },
) {
  const requestId = createRequestId();
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(fetchFn, url, timeoutMs);
      if (!response.ok) {
        const errorType = RETRYABLE_STATUS.has(response.status) ? "unavailable" : "http_error";
        throw new MarketDataError(errorType, `Request failed: ${response.status}`, {
          statusCode: response.status,
        });
      }
      const payload = await response.json();
      const providerError = parseProviderError(payload);
      if (providerError) {
        const errorType = providerError?.code === "Not Found" ? "invalid_symbol" : "provider_error";
        throw new MarketDataError(errorType, providerError?.description || "Provider error.", {
          providerCode: providerError?.code,
        });
      }
      return payload;
    } catch (error) {
      const marketError =
        error instanceof MarketDataError
          ? error
          : new MarketDataError("network_error", error.message || "Network error.");
      const shouldRetry = RETRYABLE_ERRORS.has(marketError.type) && attempt < maxAttempts;
      logMarketDataEvent(shouldRetry ? "warn" : "error", {
        event: "market_data_fetch_failure",
        provider,
        symbol,
        requestId,
        attempt,
        maxAttempts,
        errorType: marketError.type,
        statusCode: marketError.details?.statusCode ?? null,
        message: marketError.message,
      });
      if (!shouldRetry) {
        throw marketError;
      }
      const jitter = Math.random() * 150;
      const delay = BACKOFF_BASE_MS * 2 ** (attempt - 1) + jitter;
      await sleep(delay);
    }
  }
  throw new MarketDataError("unavailable", "Failed to fetch market data.");
}

function resolveMarketSession(quote) {
  const state = quote?.regularMarketState;
  if (["REGULAR", "PRE", "POST", "CLOSED"].includes(state)) {
    return state;
  }
  if (quote?.preMarketPrice != null) {
    return "PRE";
  }
  if (quote?.postMarketPrice != null) {
    return "POST";
  }
  if (quote?.regularMarketPrice != null) {
    return "DELAYED";
  }
  return "CLOSED";
}

function buildQuoteFromYahoo(quote) {
  if (!quote) {
    return null;
  }
  let session = resolveMarketSession(quote);
  const selectFields = (sessionType) => {
    if (sessionType === "PRE") {
      return {
        price: quote.preMarketPrice,
        change: quote.preMarketChange,
        changePct: quote.preMarketChangePercent,
        timestamp: quote.preMarketTime,
      };
    }
    if (sessionType === "POST") {
      return {
        price: quote.postMarketPrice,
        change: quote.postMarketChange,
        changePct: quote.postMarketChangePercent,
        timestamp: quote.postMarketTime,
      };
    }
    return {
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePct: quote.regularMarketChangePercent,
      timestamp: quote.regularMarketTime,
    };
  };

  let fields = selectFields(session);
  if (fields.price == null && session !== "REGULAR") {
    session = "CLOSED";
    fields = selectFields("CLOSED");
  }
  if (fields.price == null) {
    return null;
  }

  const previousClose = quote.regularMarketPreviousClose ?? null;
  const computedChange =
    fields.change != null
      ? fields.change
      : previousClose != null
        ? fields.price - previousClose
        : null;
  const computedChangePct =
    fields.changePct != null
      ? fields.changePct
      : previousClose != null && computedChange != null
        ? (computedChange / previousClose) * 100
        : null;

  return {
    price: fields.price,
    change: computedChange,
    changePct: computedChangePct,
    asOfTimestamp: fields.timestamp ? fields.timestamp * 1000 : null,
    isRealtime: session === "REGULAR" || session === "PRE" || session === "POST",
    session,
    previousClose,
    name: quote.shortName ?? quote.longName ?? null,
  };
}

function getSessionBadge(quote, source) {
  if (source === "cache") {
    return { label: "CACHED", className: "cached", tooltip: "Cached last-known quote." };
  }
  if (source === "historical") {
    return { label: "LAST CLOSE", className: "closed", tooltip: "Last close from historical data." };
  }
  if (quote.session === "REGULAR") {
    return { label: "REALTIME", className: "realtime", tooltip: "Regular trading session." };
  }
  if (quote.session === "PRE" || quote.session === "POST") {
    return { label: "AFTER HOURS", className: "afterhours", tooltip: "Extended-hours session." };
  }
  if (quote.session === "DELAYED") {
    return { label: "DELAYED", className: "delayed", tooltip: "Delayed quote." };
  }
  return { label: "MARKET CLOSED", className: "closed", tooltip: "Market closed quote." };
}

function calculateSignal(prices) {
  if (!prices || prices.length < 10) {
    return "hold";
  }
  const recent = prices[prices.length - 1];
  const average = prices.slice(-10).reduce((total, value) => total + value, 0) / 10;
  if (recent > average * 1.03) {
    return "sell";
  }
  if (recent < average * 0.97) {
    return "buy";
  }
  return "hold";
}

function analyzeTrade({ symbol, cash, risk }) {
  const marketEntry = getStockEntry(symbol);
  const prices = marketEntry?.history ?? [];
  const livePrice = marketEntry?.lastPrice ?? null;
  const recent = livePrice ?? prices[prices.length - 1] ?? null;
  const hasHistory = prices.length >= 10;
  const average = hasHistory
    ? prices.slice(-10).reduce((a, b) => a + b, 0) / 10
    : recent;
  const riskLimit = riskLimits[risk];

  let action = "hold";
  let allocation = riskLimit * 0.25;
  let thesis = [
    "Price is near the short-term average.",
    "No strong edge detected for aggressive trades.",
  ];

  if (!recent) {
    return {
      symbol,
      action: "hold",
      shares: 0,
      estimatedPrice: null,
      confidence: confidenceLabels.hold,
      thesis: [
        "Live pricing data is unavailable for this symbol.",
        "Signals are paused until a fresh quote is retrieved.",
      ],
      disclaimer: "Educational demo only — not financial advice. Always validate with professional guidance.",
      generatedAt: new Date().toLocaleString(),
    };
  }

  if (!hasHistory) {
    thesis = [
      "Live pricing is available, but full 10-day history has not loaded.",
      "Signals remain neutral until the latest history refreshes.",
    ];
  } else if (recent > average * 1.03) {
    action = "sell";
    allocation = riskLimit * 0.5;
    thesis = [
      "Price is extended above the short-term average.",
      "Momentum suggests trimming exposure.",
    ];
  } else if (recent < average * 0.97) {
    action = "buy";
    allocation = riskLimit;
    thesis = [
      "Price is below the short-term average.",
      "Mean reversion offers a potential entry.",
    ];
  }

  const budget = cash * allocation;
  const shares = Math.max(Math.floor(budget / recent), 0);

  return {
    symbol,
    action,
    shares,
    estimatedPrice: recent,
    confidence: confidenceLabels[action],
    thesis,
    disclaimer: "Educational demo only — not financial advice. Always validate with professional guidance.",
    generatedAt: new Date().toLocaleString(),
  };
}

function getLivePriceForSymbol(symbol) {
  const match = getStockEntry(symbol);
  return match ? match.lastPrice : null;
}

function getStockEntry(symbol) {
  const cachedExtra = extraSymbolData.get(symbol);
  return cachedExtra ?? marketState.find((stock) => stock.symbol === symbol);
}

function resetSymbolCache() {
  extraSymbolData.clear();
}

function showErrors(messages) {
  if (!errors) {
    return;
  }
  if (messages.length === 0) {
    errors.classList.add("hidden");
    errors.innerHTML = "";
    return;
  }

  errors.classList.remove("hidden");
  errors.innerHTML = `<strong>Check the input:</strong><ul>${messages
    .map((message) => `<li>${message}</li>`)
    .join("")}</ul>`;
}

function showStatus(message) {
  if (!statusNotice) {
    return;
  }
  if (!message) {
    statusNotice.classList.add("hidden");
    statusNotice.textContent = "";
    return;
  }
  statusNotice.textContent = message;
  statusNotice.classList.remove("hidden");
}

function renderResult(result) {
  if (!resultCard) {
    return;
  }
  resultSymbol.textContent = result.symbol;
  resultAction.textContent = result.action.toUpperCase();
  resultAction.className = `signal ${result.action}`;
  resultConfidence.textContent = `Confidence: ${result.confidence}`;
  resultShares.textContent = `${result.shares} shares`;
  updateResultLivePriceDisplay(result.symbol);
  resultPrice.textContent = result.estimatedPrice
    ? `Estimated price: ${quoteFormatter.format(result.estimatedPrice)}`
    : "Estimated price: Not available";
  resultThesis.innerHTML = result.thesis.map((line) => `<li>${line}</li>`).join("");
  resultGenerated.textContent = `Generated ${result.generatedAt}`;
  resultDisclaimer.textContent = result.disclaimer;
  resultCard.classList.remove("hidden");
}

function updateResultLivePriceDisplay(symbol) {
  if (!resultLivePrice) {
    return;
  }
  const marketEntry = getStockEntry(symbol);
  const livePrice = marketEntry?.lastPrice ?? null;
  const badge = livePrice
    ? getSessionBadge(
        { session: marketEntry?.quoteSession ?? "CLOSED" },
        marketEntry?.dataSource ?? "cache",
      )
    : null;
  const asOf = livePrice
    ? `as of ${formatAsOf(marketEntry?.quoteAsOf || marketEntry?.lastUpdatedAt)}`
    : "awaiting quote";
  resultLivePrice.innerHTML = livePrice
    ? `Live price: ${quoteFormatter.format(livePrice)} <span class="session-badge ${badge.className}" title="${badge.tooltip}">${badge.label}</span> <span class="price-meta">${asOf}</span>`
    : "Live price: Not available";
}

async function fetchJson(url, options = {}) {
  const cacheBust = Date.now();
  return fetchJsonWithRetry(
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&cache=${cacheBust}`,
    options,
  );
}

function calculatePercentChange(latest, previous) {
  if (!latest || !previous) {
    return null;
  }
  return ((latest - previous) / previous) * 100;
}

function extractCloseSeries(chart) {
  const closes = chart?.indicators?.quote?.[0]?.close ?? [];
  const timestamps = chart?.timestamp ?? [];
  const paired = closes
    .map((value, index) => ({
      value,
      timestamp: timestamps[index] ? timestamps[index] * 1000 : null,
    }))
    .filter((entry) => typeof entry.value === "number");
  return {
    closes: paired.map((entry) => entry.value),
    timestamps: paired.map((entry) => entry.timestamp),
  };
}

function applyChartMetrics(stock, closeSeries, timestamps) {
  if (!closeSeries.length) {
    return;
  }
  const latest = closeSeries[closeSeries.length - 1];
  const monthIndex = Math.max(closeSeries.length - 22, 0);
  const monthClose = closeSeries[monthIndex];
  const yearClose = closeSeries[0];
  stock.history = closeSeries;
  stock.dailyChange =
    closeSeries.length >= 2
      ? calculatePercentChange(latest, closeSeries[closeSeries.length - 2])
      : null;
  stock.monthlyChange = calculatePercentChange(latest, monthClose);
  stock.yearlyChange = calculatePercentChange(latest, yearClose);
  stock.lastHistoricalTimestamp = timestamps?.[timestamps.length - 1] ?? stock.lastHistoricalTimestamp;
}

function updateStockWithQuote(stock, quote) {
  if (!quote) {
    return;
  }
  if (quote.name) {
    stock.name = quote.name;
  }
  stock.lastPrice = quote.price ?? stock.lastPrice;
  if (quote.previousClose != null) {
    stock.previousClose = quote.previousClose;
  } else if (quote.change != null && quote.price != null) {
    stock.previousClose = quote.price - quote.change;
  }
  if (quote.changePct != null && (quote.isRealtime || stock.dailyChange == null)) {
    stock.dailyChange = quote.changePct;
  }
  stock.quoteAsOf = quote.asOfTimestamp ?? stock.quoteAsOf;
  stock.quoteSession = quote.session ?? stock.quoteSession;
  stock.isRealtime = quote.isRealtime ?? stock.isRealtime;
  stock.lastUpdated = formatTime(stock.quoteAsOf);
  stock.lastUpdatedAt = quote.asOfTimestamp ?? stock.lastUpdatedAt ?? Date.now();
  stock.dataSource = quote.source ?? stock.dataSource;
}

function updateStockWithHistorical(stock, historyPayload) {
  if (!historyPayload?.closes?.length) {
    return;
  }
  applyChartMetrics(stock, historyPayload.closes, historyPayload.timestamps);
  const latestClose = historyPayload.closes[historyPayload.closes.length - 1];
  const previousClose =
    historyPayload.closes.length >= 2 ? historyPayload.closes[historyPayload.closes.length - 2] : null;
  if (!stock.lastPrice) {
    stock.lastPrice = latestClose;
  }
  if (!stock.previousClose && previousClose != null) {
    stock.previousClose = previousClose;
  }
  if (!stock.dailyChange && latestClose != null && previousClose != null) {
    stock.dailyChange = calculatePercentChange(latestClose, previousClose);
  }
}

function updateQuoteCache(symbol, quote) {
  const ttl = getCacheTtl(quote.session);
  quoteCache.set(symbol, { quote, expiresAt: Date.now() + ttl });
}

function cacheHistorical(symbol, payload) {
  historicalCache.set(symbol, { payload, storedAt: Date.now() });
}

function getCachedHistorical(symbol) {
  const entry = historicalCache.get(symbol);
  if (entry && Date.now() - entry.storedAt < HISTORICAL_CACHE_TTL_MS) {
    return entry.payload;
  }
  return null;
}

function isHistoricalStale(symbol) {
  const entry = historicalCache.get(symbol);
  return !entry || Date.now() - entry.storedAt >= HISTORICAL_CACHE_TTL_MS;
}

async function fetchYahooQuotes(symbols, options = {}) {
  const quoteData = await fetchJson(YAHOO_QUOTE_URL(symbols), {
    provider: PROVIDER,
    symbol: symbols.join(","),
    fetchFn: options.fetchFn,
    maxAttempts: options.maxAttempts,
    timeoutMs: options.timeoutMs,
  });
  return quoteData?.quoteResponse?.result ?? [];
}

async function fetchHistoricalSeries(symbol, options = {}) {
  const cached = getCachedHistorical(symbol);
  if (cached) {
    return cached;
  }
  const chartData = await fetchJson(YAHOO_CHART_URL(symbol, "1y"), {
    provider: PROVIDER,
    symbol,
    fetchFn: options.fetchFn,
    maxAttempts: options.maxAttempts,
    timeoutMs: options.timeoutMs,
  });
  const chart = chartData?.chart?.result?.[0];
  const { closes, timestamps } = extractCloseSeries(chart);
  const payload = { closes, timestamps };
  cacheHistorical(symbol, payload);
  return payload;
}

function deriveHistoricalQuote(closes, timestamps) {
  if (!closes.length) {
    return null;
  }
  const latest = closes[closes.length - 1];
  const previous = closes.length >= 2 ? closes[closes.length - 2] : null;
  const change = previous != null ? latest - previous : null;
  const changePct = previous != null ? (change / previous) * 100 : null;
  const asOfTimestamp = timestamps?.[timestamps.length - 1] ?? null;
  return {
    price: latest,
    change,
    changePct,
    asOfTimestamp,
    isRealtime: false,
    session: "CLOSED",
    previousClose: previous,
  };
}

async function getQuote(symbol, options = {}) {
  if (!isValidSymbol(symbol)) {
    throw new MarketDataError("invalid_symbol", "Invalid symbol format.");
  }
  const cachedQuote = getCachedQuote(symbol);
  if (cachedQuote && options.useCache !== false) {
    return { ...cachedQuote, source: cachedQuote.source ?? "cache" };
  }

  let providerQuote = options.prefetchedQuote ?? null;
  let providerError = null;
  if (!providerQuote && options.allowFetch !== false) {
    try {
      const quotes = await fetchYahooQuotes([symbol], options);
      providerQuote = quotes.find((entry) => entry.symbol === symbol) ?? null;
    } catch (error) {
      providerError = error;
    }
  }

  if (!providerQuote && !providerError && options.allowFetch !== false) {
    providerError = new MarketDataError("invalid_symbol", "No data returned for symbol.");
  }

  if (providerQuote) {
    const builtQuote = buildQuoteFromYahoo(providerQuote);
    if (builtQuote) {
      const source =
        builtQuote.session === "REGULAR"
          ? "primary"
          : builtQuote.session === "PRE" || builtQuote.session === "POST"
            ? "extended"
            : builtQuote.session === "DELAYED"
              ? "delayed"
              : "closed";
      const fullQuote = { ...builtQuote, source };
      updateQuoteCache(symbol, fullQuote);
      setLastKnownQuote(symbol, fullQuote);
      return fullQuote;
    }
  }

  if (providerError instanceof MarketDataError && providerError.type === "invalid_symbol") {
    throw providerError;
  }

  const lastKnown = getLastKnownQuote(symbol);
  if (lastKnown) {
    return { ...lastKnown, source: "cache" };
  }

  try {
    const historical = await fetchHistoricalSeries(symbol, options);
    const derived = deriveHistoricalQuote(historical.closes, historical.timestamps);
    if (derived) {
      const fullQuote = { ...derived, source: "historical" };
      setLastKnownQuote(symbol, fullQuote);
      return fullQuote;
    }
  } catch (error) {
    if (error instanceof MarketDataError && error.type === "invalid_symbol") {
      throw error;
    }
    providerError = providerError ?? error;
  }

  throw providerError ?? new MarketDataError("unavailable", "Quote unavailable.");
}

async function loadInitialMarketData() {
  const symbols = marketState.map((stock) => stock.symbol);
  const quoteResults = await fetchYahooQuotes(symbols);
  const quoteMap = new Map(quoteResults.map((quote) => [quote.symbol, quote]));

  await Promise.all(
    marketState.map(async (stock) => {
      const prefetchedQuote = quoteMap.get(stock.symbol);
      try {
        const quote = await getQuote(stock.symbol, { prefetchedQuote, allowFetch: false });
        updateStockWithQuote(stock, quote);
      } catch (error) {
        logMarketDataEvent("warn", {
          event: "market_data_quote_failure",
          provider: PROVIDER,
          symbol: stock.symbol,
          errorType: error.type ?? "unknown",
          message: error.message,
        });
      }

      try {
        const historyPayload = await fetchHistoricalSeries(stock.symbol);
        updateStockWithHistorical(stock, historyPayload);
      } catch (error) {
        logMarketDataEvent("warn", {
          event: "market_data_chart_failure",
          provider: PROVIDER,
          symbol: stock.symbol,
          errorType: error.type ?? "unknown",
          message: error.message,
        });
      }
    }),
  );
}

async function loadSymbolSnapshot(symbol, options = {}) {
  let quote = null;
  let historyPayload = null;
  const cachedEntry = getStockEntry(symbol);
  const hasCachedData = Boolean(cachedEntry?.lastPrice || cachedEntry?.history?.length);

  try {
    quote = await getQuote(symbol, options);
  } catch (error) {
    if (error.type === "invalid_symbol") {
      throw error;
    }
    logMarketDataEvent("warn", {
      event: "market_data_quote_failure",
      provider: PROVIDER,
      symbol,
      errorType: error.type ?? "unknown",
      message: error.message ?? "Quote fetch failed.",
    });
  }

  try {
    historyPayload = await fetchHistoricalSeries(symbol, options);
  } catch (error) {
    logMarketDataEvent("warn", {
      event: "market_data_chart_failure",
      provider: PROVIDER,
      symbol,
      errorType: error.type ?? "unknown",
      message: error.message ?? "Chart fetch failed.",
    });
  }

  if (!quote && !historyPayload) {
    if (hasCachedData) {
      return { status: "cache", entry: cachedEntry };
    }
    throw new MarketDataError("unavailable", "Quote and chart requests failed.");
  }

  const entry = extraSymbolData.get(symbol) ?? {
    symbol,
    name: quote?.name ?? symbol,
    sector: "Unknown",
    cap: "—",
    history: [],
    lastPrice: null,
    previousClose: null,
    monthlyChange: null,
    yearlyChange: null,
    dailyChange: null,
    lastUpdated: null,
    lastUpdatedAt: null,
    quoteAsOf: null,
    quoteSession: null,
    isRealtime: false,
    dataSource: "live",
  };

  if (quote) {
    updateStockWithQuote(entry, quote);
  }
  if (historyPayload) {
    updateStockWithHistorical(entry, historyPayload);
  }

  extraSymbolData.set(symbol, entry);
  const status = quote?.source ?? entry.dataSource ?? "cache";
  return { status, entry, dataSource: status };
}

function matchesFilters(stock) {
  const searchValue = filterSearch.value.trim().toUpperCase();
  const sectorValue = filterSector.value;
  const capValue = filterCap.value;
  const signalValue = filterSignal.value;
  const minValue = Number(filterMin.value);
  const maxValue = Number(filterMax.value);
  const minMonthValue = Number(filterMonth.value);
  const minYearValue = Number(filterYear.value);
  const signal = calculateSignal(stock.history);

  if (searchValue && !stock.symbol.includes(searchValue)) {
    return false;
  }
  if (sectorValue !== "all" && stock.sector !== sectorValue) {
    return false;
  }
  if (capValue !== "all" && stock.cap !== capValue) {
    return false;
  }
  if (signalValue !== "all" && signal !== signalValue) {
    return false;
  }
  if (!Number.isNaN(minValue) && minValue > 0 && stock.lastPrice < minValue) {
    return false;
  }
  if (!Number.isNaN(maxValue) && maxValue > 0 && stock.lastPrice > maxValue) {
    return false;
  }
  if (
    !Number.isNaN(minMonthValue) &&
    minMonthValue !== 0 &&
    (stock.monthlyChange === null || stock.monthlyChange < minMonthValue)
  ) {
    return false;
  }
  if (
    !Number.isNaN(minYearValue) &&
    minYearValue !== 0 &&
    (stock.yearlyChange === null || stock.yearlyChange < minYearValue)
  ) {
    return false;
  }
  return true;
}

function getVisibleSymbols() {
  const filtered = marketState.filter(matchesFilters);
  return filtered.length ? filtered.map((stock) => stock.symbol) : marketState.map((stock) => stock.symbol);
}

async function refreshVisibleQuotes() {
  const symbols = getVisibleSymbols();
  const symbolsToFetch = symbols.filter((symbol) => !getCachedQuote(symbol));
  if (!symbolsToFetch.length) {
    renderMarketTable();
    return;
  }

  try {
    const quoteResults = await fetchYahooQuotes(symbolsToFetch);
    const quoteMap = new Map(quoteResults.map((quote) => [quote.symbol, quote]));
    await Promise.all(
      symbolsToFetch.map(async (symbol) => {
        const stock = getStockEntry(symbol);
        if (!stock) {
          return;
        }
        const prefetchedQuote = quoteMap.get(symbol);
        try {
          const quote = await getQuote(symbol, {
            prefetchedQuote,
            allowFetch: false,
          });
          updateStockWithQuote(stock, quote);
        } catch (error) {
          logMarketDataEvent("warn", {
            event: "market_data_refresh_failure",
            provider: PROVIDER,
            symbol,
            errorType: error.type ?? "unknown",
            message: error.message,
          });
        }
      }),
    );
  } catch (error) {
    logMarketDataEvent("warn", {
      event: "market_data_refresh_failure",
      provider: PROVIDER,
      symbol: symbolsToFetch.join(","),
      errorType: error.type ?? "unknown",
      message: error.message,
    });
  }

  await Promise.all(
    symbols
      .filter((symbol) => isHistoricalStale(symbol))
      .map(async (symbol) => {
        try {
          const historyPayload = await fetchHistoricalSeries(symbol);
          const stock = getStockEntry(symbol);
          if (stock) {
            updateStockWithHistorical(stock, historyPayload);
          }
        } catch (error) {
          logMarketDataEvent("warn", {
            event: "market_data_chart_failure",
            provider: PROVIDER,
            symbol,
            errorType: error.type ?? "unknown",
            message: error.message,
          });
        }
      }),
  );

  renderMarketTable();
  if (resultCard && !resultCard.classList.contains("hidden")) {
    updateResultLivePriceDisplay(resultSymbol.textContent);
  }
}

function renderMarketTable() {
  if (!marketBody) {
    return;
  }
  const rows = marketState
    .filter(matchesFilters)
    .map((stock) => {
      const signal = calculateSignal(stock.history);
      const change =
        stock.lastPrice !== null && stock.previousClose !== null
          ? stock.lastPrice - stock.previousClose
          : null;
      const changePercent =
        change !== null && stock.previousClose !== null
          ? (change / stock.previousClose) * 100
          : null;
      const changeClass = change === null ? "" : change >= 0 ? "positive" : "negative";
      const dayClass =
        stock.dailyChange === null ? "" : stock.dailyChange >= 0 ? "positive" : "negative";
      const monthClass =
        stock.monthlyChange === null ? "" : stock.monthlyChange >= 0 ? "positive" : "negative";
      const yearClass =
        stock.yearlyChange === null ? "" : stock.yearlyChange >= 0 ? "positive" : "negative";
      const priceDisplay = stock.lastPrice ? quoteFormatter.format(stock.lastPrice) : "Price unavailable";
      const badge = stock.lastPrice
        ? getSessionBadge(
            {
              session: stock.quoteSession ?? "CLOSED",
            },
            stock.dataSource,
          )
        : null;
      const meta = stock.lastPrice
        ? `As of ${formatAsOf(stock.quoteAsOf || stock.lastUpdatedAt)}`
        : "Awaiting quote";
      return `<tr>
        <td>${stock.symbol}</td>
        <td>${stock.name}</td>
        <td>${stock.sector}</td>
        <td>${stock.cap}</td>
        <td><span class="signal-pill ${signal}">${signal}</span></td>
        <td>
          <div class="price-cell">
            <div class="price-main">
              <span>${priceDisplay}</span>
              ${
                badge
                  ? `<span class="session-badge ${badge.className}" title="${badge.tooltip}">${badge.label}</span>`
                  : ""
              }
            </div>
            <div class="price-meta">${meta}</div>
          </div>
        </td>
        <td class="price-change ${changeClass}">${
          change !== null && changePercent !== null
            ? `${change >= 0 ? "+" : ""}${change.toFixed(2)} (${change >= 0 ? "+" : ""}${percentFormatter.format(
                changePercent,
              )}%)`
            : "n/a"
        }</td>
        <td class="price-change ${dayClass}">${
          stock.dailyChange === null
            ? "n/a"
            : `${stock.dailyChange >= 0 ? "+" : ""}${percentFormatter.format(stock.dailyChange)}%`
        }</td>
        <td class="price-change ${monthClass}">${
          stock.monthlyChange === null
            ? "n/a"
            : `${stock.monthlyChange >= 0 ? "+" : ""}${percentFormatter.format(stock.monthlyChange)}%`
        }</td>
        <td class="price-change ${yearClass}">${
          stock.yearlyChange === null
            ? "n/a"
            : `${stock.yearlyChange >= 0 ? "+" : ""}${percentFormatter.format(stock.yearlyChange)}%`
        }</td>
      </tr>`;
    })
    .join("");

  marketBody.innerHTML = rows || `<tr><td colspan="10">No stocks match these filters.</td></tr>`;
}

async function refreshMarketBoard() {
  const symbols = marketState.map((stock) => stock.symbol);
  try {
    const quoteResults = await fetchYahooQuotes(symbols);
    const quoteMap = new Map(quoteResults.map((quote) => [quote.symbol, quote]));
    await Promise.all(
      marketState.map(async (stock) => {
        const prefetchedQuote = quoteMap.get(stock.symbol);
        try {
          const quote = await getQuote(stock.symbol, {
            prefetchedQuote,
            allowFetch: false,
          });
          updateStockWithQuote(stock, quote);
        } catch (error) {
          logMarketDataEvent("warn", {
            event: "market_data_refresh_failure",
            provider: PROVIDER,
            symbol: stock.symbol,
            errorType: error.type ?? "unknown",
            message: error.message,
          });
        }
      }),
    );
  } catch (error) {
    logMarketDataEvent("warn", {
      event: "market_data_refresh_failure",
      provider: PROVIDER,
      symbol: symbols.join(","),
      errorType: error.type ?? "unknown",
      message: error.message,
    });
  }

  renderMarketTable();
  if (resultCard && !resultCard.classList.contains("hidden")) {
    updateResultLivePriceDisplay(resultSymbol.textContent);
  }
}

if (form) {
  form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const symbol = formData.get("symbol").toString().trim().toUpperCase();
  const cashValue = Number(formData.get("cash"));
  const risk = formData.get("risk").toString();

  const validationErrors = [];
  if (!symbol) {
    validationErrors.push("Please enter a stock symbol.");
  } else if (!isValidSymbol(symbol)) {
    validationErrors.push("Stock symbols can include 1-5 letters and an optional suffix (e.g. BRK.B).");
  }
  if (!Number.isFinite(cashValue) || cashValue <= 0) {
    validationErrors.push("Cash balance must be greater than zero.");
  }
  if (!Object.keys(riskLimits).includes(risk)) {
    validationErrors.push("Risk tolerance must be low, moderate, or high.");
  }

  if (validationErrors.length > 0) {
    showErrors(validationErrors);
    showStatus("");
    resultCard.classList.add("hidden");
    return;
  }

  try {
    const snapshot = await loadSymbolSnapshot(symbol);
    showErrors([]);
    if (snapshot?.status === "cache") {
      const lastUpdated = formatTime(snapshot.entry?.lastUpdatedAt);
      showStatus(`Live data unavailable — showing cached price from ${lastUpdated}.`);
    } else if (snapshot?.dataSource === "historical") {
      const lastUpdated = formatTime(snapshot.entry?.lastUpdatedAt);
      showStatus(`Live data unavailable — showing last close from ${lastUpdated}.`);
    } else if (snapshot?.dataSource === "delayed" || snapshot?.dataSource === "closed") {
      const lastUpdated = formatTime(snapshot.entry?.lastUpdatedAt);
      showStatus(`Market closed — showing last close from ${lastUpdated}.`);
    } else {
      showStatus("");
    }
  } catch (error) {
    if (error.type === "invalid_symbol") {
      showErrors([`We couldn't find data for ${symbol}. Double-check the symbol and try again.`]);
      showStatus("");
      resultCard.classList.add("hidden");
      return;
    }
    logMarketDataEvent("error", {
      event: "market_data_snapshot_failure",
      provider: PROVIDER,
      symbol,
      errorType: error.type ?? "unknown",
      message: error.message,
    });
    showErrors([]);
    showStatus("Live data unavailable — please try again shortly.");
    resultCard.classList.add("hidden");
    return;
  }
  const result = analyzeTrade({ symbol, cash: cashValue, risk });
  renderResult(result);
  });
}

[
  filterSearch,
  filterSector,
  filterCap,
  filterSignal,
  filterMin,
  filterMax,
  filterMonth,
  filterYear,
].forEach((input) => {
  if (input) {
    input.addEventListener("input", renderMarketTable);
  }
});

if (isBrowser) {
  loadPersistentQuoteCache();
  renderMarketTable();
  loadInitialMarketData()
    .then(renderMarketTable)
    .catch((error) => {
      logMarketDataEvent("error", {
        event: "market_data_initial_failure",
        provider: PROVIDER,
        errorType: error.type ?? "unknown",
        message: error.message,
      });
    });
  setInterval(refreshVisibleQuotes, 30000);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MarketDataError,
    fetchJsonWithRetry,
    fetchWithTimeout,
    isValidSymbol,
    getQuote,
    loadSymbolSnapshot,
    resetSymbolCache,
    extraSymbolData,
    resetQuoteCache,
    setLastKnownQuote,
  };
}
