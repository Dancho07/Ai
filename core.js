const isBrowser = typeof document !== "undefined";
const form = isBrowser ? document.getElementById("trade-form") : null;
const errors = isBrowser ? document.getElementById("errors") : null;
const statusNotice = isBrowser ? document.getElementById("status") : null;
const resultCard = isBrowser ? document.getElementById("signalResult") : null;
const symbolInput = isBrowser ? document.getElementById("symbol-input") : null;
const cashInput = isBrowser ? document.querySelector('input[name="cash"]') : null;
const riskInput = isBrowser ? document.querySelector('select[name="risk"]') : null;
const positionSizingInput = isBrowser ? document.querySelector('select[name="positionSizing"]') : null;
const riskPercentInput = isBrowser ? document.querySelector('input[name="riskPercent"]') : null;
const riskPercentField = isBrowser ? document.getElementById("risk-percent-field") : null;
const riskPercentError = isBrowser ? document.getElementById("risk-percent-error") : null;
const symbolError = isBrowser ? document.getElementById("symbol-error") : null;
const symbolChips = isBrowser ? document.getElementById("symbol-chips") : null;
const submitButton = isBrowser ? form?.querySelector('button[type="submit"]') : null;
const autoRunToggle = isBrowser ? document.getElementById("auto-run-toggle") : null;

const strategyModule =
  typeof module !== "undefined" && module.exports
    ? require("./strategy")
    : typeof window !== "undefined"
      ? window.Strategy
      : null;
const computeIndicators = strategyModule?.computeIndicators ?? null;
const scoreSignal = strategyModule?.scoreSignal ?? null;

const resultSymbol = isBrowser ? document.getElementById("result-symbol") : null;
const resultAction = isBrowser ? document.getElementById("result-action") : null;
const resultConfidence = isBrowser ? document.getElementById("result-confidence") : null;
const resultConfidenceBadge = isBrowser ? document.getElementById("result-confidence-badge") : null;
const resultConfidenceScore = isBrowser ? document.getElementById("result-confidence-score") : null;
const resultConfidenceCaution = isBrowser ? document.getElementById("result-confidence-caution") : null;
const resultSignalScore = isBrowser ? document.getElementById("result-signal-score") : null;
const resultSignalLabel = isBrowser ? document.getElementById("result-signal-label") : null;
const resultSignalBreakdown = isBrowser ? document.getElementById("result-signal-breakdown") : null;
const resultTimeHorizon = isBrowser ? document.getElementById("result-time-horizon") : null;
const resultShares = isBrowser ? document.getElementById("result-shares") : null;
const resultLivePrice = isBrowser ? document.getElementById("result-live-price") : null;
const resultPrice = isBrowser ? document.getElementById("result-price") : null;
const resultThesis = isBrowser ? document.getElementById("result-thesis") : null;
const resultGenerated = isBrowser ? document.getElementById("result-generated") : null;
const resultDisclaimer = isBrowser ? document.getElementById("result-disclaimer") : null;
const resultReasoning = isBrowser ? document.getElementById("result-reasoning") : null;
const resultInvalidation = isBrowser ? document.getElementById("result-invalidation") : null;
const resultBacktestStatus = isBrowser ? document.getElementById("result-backtest-status") : null;
const resultBacktestList = isBrowser ? document.getElementById("result-backtest-list") : null;
const resultBacktestTrades = isBrowser ? document.getElementById("result-backtest-trades") : null;
const resultBacktestWinRate = isBrowser ? document.getElementById("result-backtest-win-rate") : null;
const resultBacktestAvgReturn = isBrowser ? document.getElementById("result-backtest-avg-return") : null;
const resultBacktestDrawdown = isBrowser ? document.getElementById("result-backtest-drawdown") : null;
const resultBacktestBuyHold = isBrowser ? document.getElementById("result-backtest-buy-hold") : null;
const resultBacktestDisclaimer = isBrowser ? document.getElementById("result-backtest-disclaimer") : null;
const planEntry = isBrowser ? document.getElementById("plan-entry") : null;
const planEntryMeta = isBrowser ? document.getElementById("plan-entry-meta") : null;
const planStopLossRow = isBrowser ? document.getElementById("plan-stop-loss-row") : null;
const planStopLoss = isBrowser ? document.getElementById("plan-stop-loss") : null;
const planTakeProfitRow = isBrowser ? document.getElementById("plan-take-profit-row") : null;
const planTakeProfit = isBrowser ? document.getElementById("plan-take-profit") : null;
const planPosition = isBrowser ? document.getElementById("plan-position") : null;
const planRiskAmount = isBrowser ? document.getElementById("plan-risk-amount") : null;
const planStopDistance = isBrowser ? document.getElementById("plan-stop-distance") : null;
const planRiskRewardRow = isBrowser ? document.getElementById("plan-risk-reward-row") : null;
const planRiskReward = isBrowser ? document.getElementById("plan-risk-reward") : null;
const planHoldLevels = isBrowser ? document.getElementById("plan-hold-levels") : null;
const planHoldNote = isBrowser ? document.getElementById("plan-hold-note") : null;
const planHoldBreakout = isBrowser ? document.getElementById("plan-hold-breakout") : null;
const planHoldBreakoutTrigger = isBrowser
  ? document.getElementById("plan-hold-breakout-trigger")
  : null;
const planHoldBreakdown = isBrowser ? document.getElementById("plan-hold-breakdown") : null;
const planHoldBreakdownTrigger = isBrowser
  ? document.getElementById("plan-hold-breakdown-trigger")
  : null;

const marketBody = isBrowser ? document.getElementById("market-body") : null;
const marketEmptyState = isBrowser ? document.getElementById("market-empty-state") : null;
const marketEmptyMessage = isBrowser ? document.getElementById("market-empty-message") : null;
const clearFiltersButton = isBrowser ? document.getElementById("clear-filters") : null;
const refreshStatus = isBrowser ? document.getElementById("refresh-status") : null;
const refreshPill = isBrowser ? document.getElementById("refresh-pill") : null;
const quoteStatusBanner = isBrowser ? document.getElementById("quote-status-banner") : null;
const quoteStatusMessage = isBrowser ? document.getElementById("quote-status-message") : null;
const quoteStatusRetry = isBrowser ? document.getElementById("quote-status-retry") : null;
const marketOpenText = isBrowser ? document.getElementById("market-open-text") : null;
const marketSessionBadge = isBrowser ? document.getElementById("market-session-badge") : null;
const marketAsOf = isBrowser ? document.getElementById("market-as-of") : null;
const marketSourceBadge = isBrowser ? document.getElementById("market-source-badge") : null;
const marketCacheNote = isBrowser ? document.getElementById("market-cache-note") : null;
const filterSearch = isBrowser ? document.getElementById("filter-search") : null;
const filterSector = isBrowser ? document.getElementById("filter-sector") : null;
const filterCap = isBrowser ? document.getElementById("filter-cap") : null;
const filterSignal = isBrowser ? document.getElementById("filter-signal") : null;
const filterMin = isBrowser ? document.getElementById("filter-min") : null;
const filterMax = isBrowser ? document.getElementById("filter-max") : null;
const filterMonth = isBrowser ? document.getElementById("filter-month") : null;
const filterFavorites = isBrowser ? document.getElementById("filter-favorites") : null;
const watchlistInput = isBrowser ? document.getElementById("watchlist-input") : null;
const watchlistAddButton = isBrowser ? document.getElementById("watchlist-add-button") : null;
const watchlistError = isBrowser ? document.getElementById("watchlist-error") : null;
let sortBySelect = isBrowser ? document.getElementById("sort-by") : null;
const opportunitiesToggle = isBrowser ? document.getElementById("opportunities-toggle") : null;
const opportunitiesContent = isBrowser ? document.getElementById("opportunities-content") : null;
const opportunityBuyList = isBrowser ? document.getElementById("opportunity-buy-list") : null;
const opportunitySellList = isBrowser ? document.getElementById("opportunity-sell-list") : null;
const opportunityMoversList = isBrowser ? document.getElementById("opportunity-movers-list") : null;
const opportunityBuyNote = isBrowser ? document.getElementById("opportunity-buy-note") : null;
const opportunitySellNote = isBrowser ? document.getElementById("opportunity-sell-note") : null;
const opportunityMoversNote = isBrowser ? document.getElementById("opportunity-movers-note") : null;

const riskLimits = {
  low: 0.2,
  moderate: 0.4,
  high: 0.6,
};

const riskPerTrade = {
  low: 0.005,
  moderate: 0.01,
  high: 0.015,
};

const MARKET_SORT_OPTIONS = [
  { value: "signal", label: "Signal strength (score)" },
  { value: "change1d", label: "1D change" },
  { value: "change1m", label: "1M change" },
  { value: "change1y", label: "1Y change" },
  { value: "liveChange", label: "Live change (%)" },
];
const DEFAULT_SORT_KEY = "signal";
const MARKET_HISTORY_RANGE = "1y";
const MARKET_HISTORY_INTERVAL = "1d";
const MARKET_TABLE_COLUMNS = [
  { key: "favorite", className: "favorite-cell" },
  { key: "symbol" },
  { key: "company", className: "company-cell" },
  { key: "sector" },
  { key: "cap" },
  { key: "signal" },
  { key: "horizon" },
  { key: "price", className: "num-cell" },
  { key: "perf", className: "performance-cell" },
  { key: "actions", className: "actions-cell" },
];

const FORM_STATE_KEY = "trade_form_state_v1";
const WATCHLIST_STORAGE_KEY = "watchlist_v1";
const WATCHLIST_STORAGE_KEYS = [
  WATCHLIST_STORAGE_KEY,
  "watchlist",
  "pulse_watchlist",
  "marketPulse.watchlist",
];
const FAVORITES_STORAGE_KEY = "favorites_v1";
const BACKTEST_CACHE_PREFIX = "backtest30d_v1";
const POSITION_SIZING_MODES = {
  CASH: "cash",
  RISK_PERCENT: "risk_percent",
};
const RISK_PERCENT_LIMITS = {
  min: 0.1,
  max: 5,
  fallback: 1,
};

const ENTRY_RANGE_PCT = 0.003;
const ATR_LOOKBACK = 30;
const SWING_LOOKBACK = 10;
const HOLD_LOOKBACK_MIN = 10;
const HOLD_LOOKBACK_MAX = 20;
const BACKTEST_MIN_CANDLES = 15;

const DEFAULT_WATCHLIST = [
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
];

const DEFAULT_WATCHLIST_SYMBOLS = DEFAULT_WATCHLIST.map((stock) => stock.symbol);
const DEFAULT_WATCHLIST_LOOKUP = new Map(DEFAULT_WATCHLIST.map((stock) => [stock.symbol, stock]));

const storageAdapter =
  isBrowser && typeof localStorage !== "undefined" ? createStorageAdapter(localStorage) : createStorageAdapter(null);
const watchlistStore = createWatchlistStore({
  storage: storageAdapter,
  defaultSymbols: DEFAULT_WATCHLIST_SYMBOLS,
});
const favoritesStore = createFavoritesStore({ storage: storageAdapter });

let marketState = [];
let marketStateIndex = new Map();
let activeWatchlistSymbols = new Set();
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
const REFRESH_TIMEOUT_MS = 10000;
const BACKOFF_BASE_MS = 500;
const RATE_LIMIT_BACKOFF_MS = 5 * 60 * 1000;
const MAX_PARALLEL_REQUESTS = 3;
const QUOTE_BATCH_SIZE = 8;
const RETRYABLE_STATUS = new Set([429, 503, 504]);
const RETRYABLE_ERRORS = new Set(["timeout", "rate_limit", "unavailable"]);
const LAST_KNOWN_CACHE_KEY = "market_quote_cache_v1";
const HISTORICAL_CACHE_KEY = "market_historical_cache_v1";
const MARKET_OPEN_TTL_MS = 5 * 1000;
const MARKET_EXTENDED_TTL_MS = 12 * 1000;
const MARKET_CLOSED_TTL_MS = 5 * 60 * 1000;
const HISTORICAL_DAILY_TTL_MS = 24 * 60 * 60 * 1000;
const HISTORICAL_INTRADAY_TTL_MS = 60 * 60 * 1000;
const MARKET_DEBUG_SYMBOLS = new Set(["AAPL", "SPY"]);
const MARKET_DEBUG_PARAM = "debug";
const MARKET_DEBUG_ENABLED =
  isBrowser && typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get(MARKET_DEBUG_PARAM) === "1"
    : false;
const DEBUG = true;
const PERF_DEBUG_ENABLED = MARKET_DEBUG_ENABLED;
const QUOTE_FAST_FALLBACK_MS = 800;
const INDICATOR_CACHE_TTL_MS = 60 * 1000;
const REFRESH_INTERVALS = {
  REGULAR: 5 * 1000,
  PRE: 12 * 1000,
  POST: 12 * 1000,
  CLOSED: 5 * 60 * 1000,
  DELAYED: 12 * 1000,
  UNKNOWN: 12 * 1000,
};

const YAHOO_QUOTE_URL = (symbols) =>
  `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
const YAHOO_CHART_URL = (symbol, range, interval = "1d") =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}&includePrePost=false`;
const QUOTE_PROXY_CHAIN = [
  {
    label: "Server proxy",
    build: (symbols) => `/api/quote?symbols=${encodeURIComponent(symbols.join(","))}`,
  },
  {
    label: "Corsproxy",
    build: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  },
  {
    label: "Isomorphic proxy",
    build: (url) => `https://cors.isomorphic-git.org/${url}`,
  },
  {
    label: "AllOrigins",
    build: (url, cacheBust) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&cache=${cacheBust}`,
  },
];
const CHART_PROXY_CHAIN = [
  {
    label: "Corsproxy",
    build: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  },
  {
    label: "Isomorphic proxy",
    build: (url) => `https://cors.isomorphic-git.org/${url}`,
  },
  {
    label: "AllOrigins",
    build: (url, cacheBust) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&cache=${cacheBust}`,
  },
];

const quoteCache = new Map();
const lastKnownQuotes = new Map();
const historicalCache = new Map();
const inflightHistoricalRequests = new Map();
const inflightQuoteRequests = new Map();
const analysisCache = new Map();

const ANALYSIS_CACHE_PREFIX = "analysis_cache_v1_";
const ANALYSIS_CACHE_TTL_MS = 3 * 60 * 1000;
const marketIndicatorState = { usingCached: false };
const refreshState = {
  status: "idle",
  lastAttemptTs: null,
  lastSuccessTs: null,
  lastError: null,
};
let lastRefreshSummary = {
  okCount: 0,
  errorCount: 0,
  lastError: null,
};
const lastQuoteRequestStatus = new Map();
const indicatorCache = new Map();

let refreshTimerId = null;
let refreshInProgress = false;
let rateLimitBackoffUntil = 0;
let isSubmitting = false;
const RESULT_HIGHLIGHT_CLASS = "result-highlight";

function getScrollBehavior() {
  if (!isBrowser || typeof window === "undefined") {
    return "auto";
  }
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  return prefersReducedMotion ? "auto" : "smooth";
}

function scheduleResultScroll(target) {
  if (!target || typeof target.scrollIntoView !== "function") {
    return;
  }
  const behavior = getScrollBehavior();
  const timeoutFn = typeof window !== "undefined" && window.setTimeout ? window.setTimeout : setTimeout;
  const highlight = () => {
    if (!target.classList) {
      return;
    }
    target.classList.add(RESULT_HIGHLIGHT_CLASS);
    timeoutFn(() => target.classList.remove(RESULT_HIGHLIGHT_CLASS), 1200);
  };
  const doScroll = () => {
    target.scrollIntoView({ behavior, block: "start" });
    highlight();
  };
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => requestAnimationFrame(doScroll));
  } else {
    timeoutFn(doScroll, 0);
  }
}

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

function getPerfNow() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function createPerfTracker(enabled = false) {
  const marks = new Map();
  const durations = new Map();
  const start = (label) => {
    if (!enabled) {
      return;
    }
    marks.set(label, getPerfNow());
  };
  const end = (label) => {
    if (!enabled) {
      return null;
    }
    const started = marks.get(label);
    if (started == null) {
      return null;
    }
    const duration = getPerfNow() - started;
    durations.set(label, duration);
    return duration;
  };
  const summary = (totalLabel) => {
    if (!enabled) {
      return null;
    }
    const total = durations.get(totalLabel);
    return {
      total,
      breakdown: Object.fromEntries(durations.entries()),
    };
  };
  return { start, end, summary, enabled };
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

function createConcurrencyLimiter(limit) {
  let active = 0;
  const queue = [];
  const runNext = () => {
    if (active >= limit || queue.length === 0) {
      return;
    }
    const { task, resolve, reject } = queue.shift();
    active += 1;
    task()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        active -= 1;
        runNext();
      });
  };

  return (task) =>
    new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      runNext();
    });
}

const requestLimiter = createConcurrencyLimiter(MAX_PARALLEL_REQUESTS);
const symbolRefreshLimiter = createConcurrencyLimiter(MAX_PARALLEL_REQUESTS);

function isValidSymbol(symbol) {
  const symbolPattern = /^[A-Z][A-Z0-9.-]{0,9}$/;
  return symbolPattern.test(symbol);
}

function normalizeSymbolInput(value) {
  if (typeof value !== "string") {
    return "";
  }
  const withoutWhitespace = value.replace(
    /[\s\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/g,
    "",
  );
  return withoutWhitespace.toUpperCase();
}

function getSymbolValidationMessage(symbol) {
  if (!symbol) {
    return "Please enter a stock symbol.";
  }
  if (!isValidSymbol(symbol)) {
    return "Stock symbols must start with a letter and include up to 10 letters, numbers, dots, or hyphens (e.g. BRK.B).";
  }
  return "";
}

function createStorageAdapter(storage) {
  return {
    get: (key) => {
      if (!storage?.getItem) {
        return null;
      }
      const raw = storage.getItem(key);
      if (!raw) {
        return null;
      }
      try {
        return JSON.parse(raw);
      } catch (error) {
        return null;
      }
    },
    set: (key, value) => {
      if (!storage?.setItem) {
        return;
      }
      storage.setItem(key, JSON.stringify(value));
    },
  };
}

function getAnalysisCacheKey(symbol) {
  return `${ANALYSIS_CACHE_PREFIX}${symbol}`;
}

function getCachedAnalysis(symbol, { now = Date.now(), storage = storageAdapter } = {}) {
  const normalized = normalizeSymbolInput(symbol ?? "");
  if (!normalized) {
    return null;
  }
  const cached = analysisCache.get(normalized);
  if (cached && now - cached.ts < ANALYSIS_CACHE_TTL_MS) {
    return cached.payload;
  }
  if (cached) {
    analysisCache.delete(normalized);
  }
  const stored = storage?.get?.(getAnalysisCacheKey(normalized));
  if (!stored || typeof stored !== "object") {
    return null;
  }
  if (now - stored.ts >= ANALYSIS_CACHE_TTL_MS) {
    return null;
  }
  analysisCache.set(normalized, stored);
  return stored.payload ?? null;
}

function setCachedAnalysis(symbol, payload, { now = Date.now(), storage = storageAdapter } = {}) {
  const normalized = normalizeSymbolInput(symbol ?? "");
  if (!normalized) {
    return null;
  }
  const entry = { ts: now, payload };
  analysisCache.set(normalized, entry);
  storage?.set?.(getAnalysisCacheKey(normalized), entry);
  return entry;
}

function resetAnalysisCache({ storage = storageAdapter } = {}) {
  analysisCache.clear();
  if (!storage?.get) {
    return;
  }
}

function isValidWatchlistSymbol(symbol) {
  const symbolPattern = /^[A-Z0-9.-]{1,10}$/;
  return symbolPattern.test(symbol);
}

function normalizeWatchlistSymbol(value) {
  return normalizeSymbolInput(value ?? "");
}

function sanitizeSymbolList(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  const normalized = list
    .map((entry) => {
      if (typeof entry === "string") {
        return normalizeWatchlistSymbol(entry);
      }
      if (entry && typeof entry === "object" && typeof entry.symbol === "string") {
        return normalizeWatchlistSymbol(entry.symbol);
      }
      return "";
    })
    .filter(Boolean);
  const filtered = normalized.filter((symbol) => isValidWatchlistSymbol(symbol));
  return [...new Set(filtered)];
}

function getWatchlist({ storage = storageAdapter, defaultSymbols = DEFAULT_WATCHLIST_SYMBOLS } = {}) {
  const fallback = sanitizeSymbolList(defaultSymbols);
  const keys = WATCHLIST_STORAGE_KEYS;
  for (const key of keys) {
    const stored = storage?.get?.(key);
    const normalized = sanitizeSymbolList(stored);
    if (normalized.length) {
      return { symbols: normalized, sourceKey: key };
    }
  }
  return { symbols: fallback, sourceKey: "default" };
}

function createWatchlistStore({ storage, defaultSymbols }) {
  let cached = null;
  let sourceKey = "default";
  const defaults = sanitizeSymbolList(defaultSymbols);

  const load = () => {
    if (cached) {
      return cached;
    }
    const loaded = getWatchlist({ storage, defaultSymbols: defaults });
    cached = loaded.symbols.length ? loaded.symbols : defaults;
    sourceKey = loaded.sourceKey;
    return cached;
  };

  const persist = () => {
    storage?.set?.(WATCHLIST_STORAGE_KEY, cached);
  };

  const store = {
    getWatchlist: () => [...load()],
    addSymbol: (symbol) => {
      const normalized = normalizeWatchlistSymbol(symbol);
      if (!normalized || !isValidWatchlistSymbol(normalized)) {
        return { added: false, symbol: normalized, reason: "invalid" };
      }
      const current = load();
      if (current.includes(normalized)) {
        return { added: false, symbol: normalized, reason: "duplicate" };
      }
      cached = [...current, normalized];
      persist();
      return { added: true, symbol: normalized };
    },
    removeSymbol: (symbol) => {
      const normalized = normalizeWatchlistSymbol(symbol);
      const current = load();
      const next = current.filter((entry) => entry !== normalized);
      if (next.length === current.length) {
        return false;
      }
      cached = next;
      persist();
      return true;
    },
    resetToDefault: () => {
      cached = [...defaults];
      persist();
      return [...cached];
    },
    getWatchlistMeta: () => ({ sourceKey, count: cached ? cached.length : 0 }),
  };

  return store;
}

function createFavoritesStore({ storage }) {
  let cached = null;

  const load = () => {
    if (cached) {
      return cached;
    }
    const stored = storage?.get?.(FAVORITES_STORAGE_KEY);
    cached = sanitizeSymbolList(stored);
    return cached;
  };

  const persist = () => {
    storage?.set?.(FAVORITES_STORAGE_KEY, cached);
  };

  const store = {
    getFavorites: () => [...load()],
    isFavorite: (symbol) => {
      const normalized = normalizeWatchlistSymbol(symbol);
      if (!normalized) {
        return false;
      }
      return load().includes(normalized);
    },
    toggleFavorite: (symbol) => {
      const normalized = normalizeWatchlistSymbol(symbol);
      if (!normalized || !isValidWatchlistSymbol(normalized)) {
        return { favorite: false, symbol: normalized, reason: "invalid" };
      }
      const set = new Set(load());
      if (set.has(normalized)) {
        set.delete(normalized);
      } else {
        set.add(normalized);
      }
      cached = [...set];
      persist();
      return { favorite: set.has(normalized), symbol: normalized };
    },
    removeSymbol: (symbol) => {
      const normalized = normalizeWatchlistSymbol(symbol);
      const current = load();
      const next = current.filter((entry) => entry !== normalized);
      if (next.length === current.length) {
        return false;
      }
      cached = next;
      persist();
      return true;
    },
  };

  return store;
}

function persistFormState(storage, { symbol, cash, risk, positionSizing, riskPercent }) {
  if (!storage?.setItem) {
    return;
  }
  const payload = {
    symbol: normalizeSymbolInput(symbol ?? ""),
    cash: typeof cash === "string" ? cash : cash?.toString?.() ?? "",
    risk: Object.keys(riskLimits).includes(risk) ? risk : "moderate",
    positionSizing:
      positionSizing === POSITION_SIZING_MODES.RISK_PERCENT ? POSITION_SIZING_MODES.RISK_PERCENT : POSITION_SIZING_MODES.CASH,
    riskPercent: typeof riskPercent === "string" ? riskPercent : riskPercent?.toString?.() ?? "",
  };
  storage.setItem(FORM_STATE_KEY, JSON.stringify(payload));
}

function loadPersistedFormState(storage) {
  if (!storage?.getItem) {
    return null;
  }
  const raw = storage.getItem(FORM_STATE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      symbol: normalizeSymbolInput(parsed.symbol ?? ""),
      cash: parsed.cash ?? "",
      risk: Object.keys(riskLimits).includes(parsed.risk) ? parsed.risk : "moderate",
      positionSizing:
        parsed.positionSizing === POSITION_SIZING_MODES.RISK_PERCENT
          ? POSITION_SIZING_MODES.RISK_PERCENT
          : POSITION_SIZING_MODES.CASH,
      riskPercent: parsed.riskPercent ?? "",
    };
  } catch (error) {
    return null;
  }
}

function getAnalysisInputDefaults(storage = localStorage) {
  const persisted = loadPersistedFormState(storage);
  const cashValue = persisted?.cash ? Number.parseFloat(persisted.cash) : 10000;
  const riskPercentValue = persisted?.riskPercent ? Number.parseFloat(persisted.riskPercent) : null;
  return {
    cash: Number.isFinite(cashValue) && cashValue > 0 ? cashValue : 10000,
    risk: persisted?.risk ?? "moderate",
    positionSizingMode: persisted?.positionSizing ?? POSITION_SIZING_MODES.CASH,
    riskPercent: Number.isFinite(riskPercentValue) ? riskPercentValue : null,
  };
}

function setRiskPercentError(message, { errorElement = riskPercentError } = {}) {
  if (!errorElement) {
    return;
  }
  if (!message) {
    errorElement.textContent = "";
    errorElement.classList.add("hidden");
    return;
  }
  errorElement.textContent = message;
  errorElement.classList.remove("hidden");
}

function getRiskPercentValidationMessage(mode, value) {
  if (mode !== POSITION_SIZING_MODES.RISK_PERCENT) {
    return "";
  }
  const raw = value?.toString().trim() ?? "";
  if (!raw) {
    return "Risk per trade is required.";
  }
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) {
    return "Risk per trade must be a valid number.";
  }
  if (parsed < RISK_PERCENT_LIMITS.min || parsed > RISK_PERCENT_LIMITS.max) {
    return `Risk per trade must be between ${RISK_PERCENT_LIMITS.min}% and ${RISK_PERCENT_LIMITS.max}%.`;
  }
  return "";
}

function applyRiskPercentVisibility(mode, { field, input, errorElement } = {}) {
  if (!field || !input) {
    return;
  }
  const isRiskPercent = mode === POSITION_SIZING_MODES.RISK_PERCENT;
  field.classList.toggle("hidden", !isRiskPercent);
  input.toggleAttribute("required", isRiskPercent);
  input.toggleAttribute("disabled", !isRiskPercent);
  if (!isRiskPercent) {
    setRiskPercentError("", { errorElement });
  }
}

function updateRiskPercentVisibility(mode) {
  applyRiskPercentVisibility(mode, {
    field: riskPercentField,
    input: riskPercentInput,
    errorElement: riskPercentError,
  });
}

function getFormStateFromInputs() {
  return {
    symbol: symbolInput?.value ?? "",
    cash: cashInput?.value ?? "",
    risk: riskInput?.value ?? "moderate",
    positionSizing: positionSizingInput?.value ?? POSITION_SIZING_MODES.CASH,
    riskPercent: riskPercentInput?.value ?? "",
  };
}

function bindRiskPercentField({
  positionSizingInput,
  riskPercentField,
  riskPercentInput,
  riskPercentError,
  storage,
  getFormState,
} = {}) {
  const updateVisibility = (mode) =>
    applyRiskPercentVisibility(mode, {
      field: riskPercentField,
      input: riskPercentInput,
      errorElement: riskPercentError,
    });
  const persistDraft = () => {
    if (!storage || typeof getFormState !== "function") {
      return;
    }
    persistFormState(storage, getFormState());
  };
  const validateRiskPercent = () => {
    const message = getRiskPercentValidationMessage(
      positionSizingInput?.value ?? POSITION_SIZING_MODES.CASH,
      riskPercentInput?.value ?? "",
    );
    setRiskPercentError(message, { errorElement: riskPercentError });
    return message;
  };

  if (positionSizingInput?.addEventListener) {
    positionSizingInput.addEventListener("change", () => {
      updateVisibility(positionSizingInput.value);
      persistDraft();
    });
  }
  if (riskPercentInput?.addEventListener) {
    riskPercentInput.addEventListener("input", () => {
      persistDraft();
    });
    riskPercentInput.addEventListener("blur", () => {
      validateRiskPercent();
    });
  }

  return {
    updateVisibility,
    validateRiskPercent,
  };
}

function formatTime(timestamp) {
  if (!timestamp) {
    return "unknown time";
  }
  return new Date(timestamp).toLocaleTimeString();
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "unknown";
  }
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(new Date(timestamp));
}

function formatAsOf(timestamp, options = {}) {
  if (!timestamp) {
    return "unknown time";
  }
  const zone = typeof options === "string" ? options : options?.tz ?? "UTC";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: zone,
      timeZoneName: "short",
      hour12: false,
    }).format(new Date(timestamp));
  } catch (error) {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
      hour12: false,
    }).format(new Date(timestamp));
  }
}

function normalizeEpochToMs(timestamp) {
  if (!timestamp || Number.isNaN(timestamp)) {
    return null;
  }
  return timestamp > 1e12 ? timestamp : timestamp * 1000;
}

const QUOTE_SOURCES = {
  REALTIME: "REALTIME",
  DELAYED: "DELAYED",
  CACHED: "CACHED",
  LAST_CLOSE: "LAST_CLOSE",
  UNAVAILABLE: "UNAVAILABLE",
};

const QUOTE_SESSIONS = {
  REGULAR: "REGULAR",
  PRE: "PRE",
  POST: "POST",
  CLOSED: "CLOSED",
};

const REALTIME_FRESHNESS_MS = 2 * 60 * 1000;
const STALE_FRESHNESS_MS = 15 * 60 * 1000;
const CACHE_WARNING_MESSAGE = "Market open but live quote unavailable — using cached data.";

function normalizeSession(session) {
  if (!session) {
    return null;
  }
  const normalized = String(session).toUpperCase();
  if (Object.values(QUOTE_SESSIONS).includes(normalized)) {
    return normalized;
  }
  return null;
}

function normalizeSource(source) {
  if (!source) {
    return null;
  }
  const normalized = String(source).toUpperCase();
  if (Object.values(QUOTE_SOURCES).includes(normalized)) {
    return normalized;
  }
  return null;
}

function shouldShowCacheWarning(session, source) {
  return (
    session === QUOTE_SESSIONS.REGULAR &&
    [QUOTE_SOURCES.CACHED, QUOTE_SOURCES.LAST_CLOSE].includes(source)
  );
}

function getEpochUnit(timestamp) {
  if (!timestamp || Number.isNaN(timestamp)) {
    return "unknown";
  }
  return timestamp > 1e12 ? "ms" : "s";
}

function deriveMarketSession(rawQuote, nowMs = Date.now()) {
  const state = rawQuote?.marketState ?? rawQuote?.regularMarketState ?? null;
  if (typeof state === "string") {
    const normalized = state.toUpperCase();
    if (["REGULAR", "PRE", "POST", "CLOSED"].includes(normalized)) {
      return normalized;
    }
  }
  if (rawQuote?.regularMarketTime) {
    const regularMs = rawQuote.regularMarketTime * 1000;
    if (nowMs - regularMs <= 20 * 60 * 1000) {
      return "REGULAR";
    }
    return "CLOSED";
  }
  return "UNKNOWN";
}

function resolveQuoteSource({ sourceHint, session, asOfTimestamp, nowMs, isRealtime }) {
  const normalizedHint = sourceHint ? String(sourceHint).toUpperCase() : null;
  if (normalizedHint === "CACHE" || normalizedHint === "CACHED") {
    return QUOTE_SOURCES.CACHED;
  }
  if (normalizedHint === "HISTORICAL" || normalizedHint === "LAST_CLOSE") {
    return QUOTE_SOURCES.LAST_CLOSE;
  }
  if (normalizedHint === "DELAYED") {
    return QUOTE_SOURCES.DELAYED;
  }
  if (normalizedHint === "REALTIME" || normalizedHint === "PRIMARY" || normalizedHint === "EXTENDED") {
    return QUOTE_SOURCES.REALTIME;
  }
  if (session === QUOTE_SESSIONS.CLOSED) {
    return QUOTE_SOURCES.LAST_CLOSE;
  }
  if (asOfTimestamp != null && nowMs - asOfTimestamp > REALTIME_FRESHNESS_MS) {
    return QUOTE_SOURCES.DELAYED;
  }
  if (session === QUOTE_SESSIONS.REGULAR || session === QUOTE_SESSIONS.PRE || session === QUOTE_SESSIONS.POST) {
    return QUOTE_SOURCES.REALTIME;
  }
  if (isRealtime) {
    return QUOTE_SOURCES.REALTIME;
  }
  return QUOTE_SOURCES.DELAYED;
}

function getDebugFreshnessLabel(source) {
  if (source === QUOTE_SOURCES.REALTIME) {
    return "REALTIME";
  }
  if (source === QUOTE_SOURCES.DELAYED) {
    return "DELAYED";
  }
  if (source === QUOTE_SOURCES.LAST_CLOSE) {
    return "LAST_CLOSE";
  }
  if (source === QUOTE_SOURCES.CACHED) {
    return "CACHED";
  }
  return "UNAVAILABLE";
}

function getQuoteFallbackLabel(quote) {
  if (!quote) {
    return "unavailable";
  }
  if (quote.source === QUOTE_SOURCES.CACHED) {
    return "cached";
  }
  if (quote.source === QUOTE_SOURCES.LAST_CLOSE) {
    return "last_close";
  }
  if (quote.source === QUOTE_SOURCES.DELAYED) {
    return "delayed";
  }
  if (quote.session === "CLOSED") {
    return "last_close";
  }
  if (quote.session === "PRE" || quote.session === "POST") {
    return "after_hours";
  }
  return "live";
}

function logMarketDebug(symbol, stage, details = {}) {
  if (!MARKET_DEBUG_ENABLED) {
    return;
  }
  console.info("[Market Debug]", {
    symbol,
    stage,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

function logYahooQuoteDebug(rawQuote, derivedSession, source) {
  if (!MARKET_DEBUG_ENABLED || !rawQuote?.symbol) {
    return;
  }
  const symbol = rawQuote.symbol?.toUpperCase?.() ?? rawQuote.symbol;
  const requestStatus = lastQuoteRequestStatus.get(symbol) ?? null;
  const now = new Date();
  const nowUtc = now.toISOString();
  const nowNy = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour12: false,
  });
  const payload = {
    symbol,
    quoteRequestStatus: requestStatus?.status ?? null,
    quoteRequestOk: requestStatus?.ok ?? null,
    quoteRequestAt: requestStatus?.timestamp ?? null,
    marketState: rawQuote.marketState ?? rawQuote.regularMarketState ?? null,
    regularMarketTime: rawQuote.regularMarketTime ?? null,
    preMarketTime: rawQuote.preMarketTime ?? null,
    postMarketTime: rawQuote.postMarketTime ?? null,
    regularMarketTimeUnit: getEpochUnit(rawQuote.regularMarketTime),
    preMarketTimeUnit: getEpochUnit(rawQuote.preMarketTime),
    postMarketTimeUnit: getEpochUnit(rawQuote.postMarketTime),
    exchangeTimezoneName: rawQuote.exchangeTimezoneName ?? null,
    exchangeTimezoneShortName: rawQuote.exchangeTimezoneShortName ?? null,
    regularMarketPrice: rawQuote.regularMarketPrice ?? null,
    preMarketPrice: rawQuote.preMarketPrice ?? null,
    postMarketPrice: rawQuote.postMarketPrice ?? null,
    derivedSession,
    freshnessSource: getDebugFreshnessLabel(source),
    nowUtc,
    nowNy,
    regularMarketTimeMs: normalizeEpochToMs(rawQuote.regularMarketTime),
    preMarketTimeMs: normalizeEpochToMs(rawQuote.preMarketTime),
    postMarketTimeMs: normalizeEpochToMs(rawQuote.postMarketTime),
  };
  console.info("[Market Debug]", payload);
}

function getCacheTtl(session) {
  if (session === QUOTE_SESSIONS.REGULAR) {
    return MARKET_OPEN_TTL_MS;
  }
  if (session === QUOTE_SESSIONS.PRE || session === QUOTE_SESSIONS.POST) {
    return MARKET_EXTENDED_TTL_MS;
  }
  return MARKET_CLOSED_TTL_MS;
}

function loadPersistentQuoteCache(storage = isBrowser ? localStorage : null) {
  if (!storage) {
    return;
  }
  try {
    const raw = storage.getItem(LAST_KNOWN_CACHE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([symbol, entry]) => {
      if (entry?.quote?.price != null) {
        lastKnownQuotes.set(symbol, entry);
      }
    });
  } catch (error) {
    console.warn("Unable to read cached quotes.", error);
  }
}

function getHistoricalCacheKey(symbol, range = "1mo", interval = "1d") {
  return `${symbol}|${range}|${interval}`;
}

function getHistoricalCacheTtl(range = "1mo", interval = "1d") {
  if (interval !== "1d") {
    return HISTORICAL_INTRADAY_TTL_MS;
  }
  if (range === "1mo" || range === "3mo") {
    return HISTORICAL_DAILY_TTL_MS;
  }
  return HISTORICAL_DAILY_TTL_MS;
}

function loadPersistentHistoricalCache(storage = isBrowser ? localStorage : null) {
  if (!storage) {
    return;
  }
  try {
    const raw = storage.getItem(HISTORICAL_CACHE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([key, entry]) => {
      if (!entry?.payload?.closes?.length) {
        return;
      }
      historicalCache.set(key, {
        payload: entry.payload,
        storedAt: entry.storedAt,
        ttlMs: entry.ttlMs ?? HISTORICAL_DAILY_TTL_MS,
      });
    });
  } catch (error) {
    console.warn("Unable to read cached historical data.", error);
  }
}

function persistLastKnownQuotes(storage = isBrowser ? localStorage : null) {
  if (!storage) {
    return;
  }
  const payload = {};
  lastKnownQuotes.forEach((value, symbol) => {
    payload[symbol] = value;
  });
  try {
    storage.setItem(LAST_KNOWN_CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Unable to persist cached quotes.", error);
  }
}

function persistHistoricalCache(storage = isBrowser ? localStorage : null) {
  if (!storage) {
    return;
  }
  const payload = {};
  historicalCache.forEach((value, key) => {
    payload[key] = value;
  });
  try {
    storage.setItem(HISTORICAL_CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Unable to persist cached historical data.", error);
  }
}

function normalizeQuoteForCache(quote) {
  if (!quote) {
    return null;
  }
  return {
    price: quote.price ?? null,
    change: quote.change ?? null,
    changePct: quote.changePct ?? null,
    asOfTimestamp: quote.asOfTimestamp ?? null,
    session: quote.session ?? QUOTE_SESSIONS.CLOSED,
    source: quote.source ?? QUOTE_SOURCES.CACHED,
    currency: quote.currency ?? null,
    previousClose: quote.previousClose ?? null,
    name: quote.name ?? null,
    exchangeTimezoneName: quote.exchangeTimezoneName ?? null,
    exchangeTimezoneShortName: quote.exchangeTimezoneShortName ?? null,
  };
}

function setLastKnownQuote(symbol, quote, storage) {
  const normalized = normalizeQuoteForCache(quote);
  if (!normalized) {
    return;
  }
  lastKnownQuotes.set(symbol, { quote: normalized, savedAt: Date.now() });
  persistLastKnownQuotes(storage);
}

function resetQuoteCache() {
  quoteCache.clear();
  lastKnownQuotes.clear();
  historicalCache.clear();
  inflightHistoricalRequests.clear();
  indicatorCache.clear();
  if (isBrowser && typeof localStorage !== "undefined") {
    localStorage.removeItem(LAST_KNOWN_CACHE_KEY);
    localStorage.removeItem(HISTORICAL_CACHE_KEY);
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

function getLastKnownEntry(symbol) {
  return lastKnownQuotes.get(symbol) ?? null;
}

function isQuoteFresh(symbol, sessionOverride) {
  const cachedQuote = getCachedQuote(symbol);
  if (cachedQuote) {
    return true;
  }
  const entry = getLastKnownEntry(symbol);
  if (!entry) {
    return false;
  }
  const session = sessionOverride ?? entry.quote?.session ?? "CLOSED";
  return Date.now() - entry.savedAt < getCacheTtl(session);
}

function isQuoteFreshForInterval(symbol, sessionOverride) {
  const stock = getStockEntry(symbol);
  const entry = getLastKnownEntry(symbol);
  const session = sessionOverride ?? stock?.quoteSession ?? entry?.quote?.session ?? "CLOSED";
  const interval = getRefreshIntervalForSession(session);
  const timestamp = stock?.quoteAsOf ?? stock?.lastUpdatedAt ?? entry?.savedAt ?? null;
  if (!timestamp) {
    return false;
  }
  return Date.now() - timestamp < interval;
}

function getRefreshIntervalForSession(session) {
  return REFRESH_INTERVALS[session] ?? REFRESH_INTERVALS.CLOSED;
}

function getRefreshIntervalForSymbols(symbols) {
  const intervals = symbols.map((symbol) => {
    const entry = getStockEntry(symbol);
    return getRefreshIntervalForSession(entry?.quoteSession ?? "CLOSED");
  });
  if (!intervals.length) {
    return REFRESH_INTERVALS.CLOSED;
  }
  return Math.min(...intervals);
}

function isPageVisible() {
  if (!isBrowser) {
    return true;
  }
  return document.visibilityState === "visible";
}

function isRateLimitBackoffActive() {
  return Date.now() < rateLimitBackoffUntil;
}

function applyRateLimitBackoff() {
  rateLimitBackoffUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
}

function shouldBackoffFromStatus(statusCode) {
  return statusCode === 429 || statusCode === 503;
}

function getEffectiveRefreshInterval(symbols) {
  const baseInterval = getRefreshIntervalForSymbols(symbols);
  return isRateLimitBackoffActive() ? baseInterval * 2 : baseInterval;
}

function getNextRefreshDelay({ symbols, visible, backoffActive }) {
  if (!visible) {
    return null;
  }
  const baseInterval = getRefreshIntervalForSymbols(symbols);
  return backoffActive ? baseInterval * 2 : baseInterval;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseProviderError(payload) {
  const chartError = payload?.chart?.error;
  const quoteError = payload?.quoteResponse?.error;
  return chartError || quoteError || null;
}

function parseJsonPayload(raw) {
  if (raw == null) {
    return null;
  }
  if (typeof raw === "object") {
    return raw;
  }
  if (typeof raw !== "string") {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function isCorsError(error) {
  const message = error?.message?.toLowerCase?.() ?? "";
  return (
    error?.name === "TypeError" &&
    (message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("cors") ||
      message.includes("fetch"))
  );
}

function classifyFetchError(error) {
  if (error instanceof MarketDataError) {
    return error;
  }
  if (error?.name === "AbortError") {
    return new MarketDataError("timeout", "Request timed out.");
  }
  if (isCorsError(error)) {
    return new MarketDataError("cors", "CORS/proxy error.");
  }
  return new MarketDataError("network_error", error?.message || "Network error.");
}

function shouldFallbackAfterError(error) {
  if (!error) {
    return false;
  }
  if (error.type === "invalid_symbol") {
    return false;
  }
  return true;
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
  {
    fetchFn = fetch,
    timeoutMs = REQUEST_TIMEOUT_MS,
    maxAttempts = MAX_RETRIES,
    provider,
    symbol,
    onStatus,
  },
) {
  const requestId = createRequestId();
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(fetchFn, url, timeoutMs);
      if (onStatus) {
        onStatus({ status: response.status, ok: response.ok });
      }
      if (!response.ok) {
        if (shouldBackoffFromStatus(response.status)) {
          applyRateLimitBackoff();
        }
        const errorType =
          response.status === 429
            ? "rate_limit"
            : RETRYABLE_STATUS.has(response.status)
              ? "unavailable"
              : "http_error";
        throw new MarketDataError(errorType, `Request failed: ${response.status}`, {
          statusCode: response.status,
        });
      }
      let payload = null;
      try {
        payload = await response.json();
      } catch (error) {
        if (typeof response.text === "function") {
          const raw = await response.text();
          if (typeof raw === "string" && raw.trim().startsWith("<")) {
            throw new MarketDataError("provider_error", "HTML response received.", {
              responseSnippet: raw.slice(0, 120),
            });
          }
          payload = parseJsonPayload(raw);
          if (payload?.contents && typeof payload.contents === "string") {
            payload = parseJsonPayload(payload.contents);
          }
        }
      }
      if (!payload || typeof payload !== "object") {
        throw new MarketDataError("provider_error", "Unexpected response payload.", {
          payloadType: payload === null ? "null" : typeof payload,
        });
      }
      const providerError = parseProviderError(payload);
      if (providerError) {
        const errorType = providerError?.code === "Not Found" ? "invalid_symbol" : "provider_error";
        throw new MarketDataError(errorType, providerError?.description || "Provider error.", {
          providerCode: providerError?.code,
          providerMessage: providerError?.description ?? null,
        });
      }
      return payload;
    } catch (error) {
      const marketError = classifyFetchError(error);
      const shouldRetry = RETRYABLE_ERRORS.has(marketError.type) && attempt < maxAttempts;
      logMarketDataEvent(shouldRetry ? "warn" : "error", {
        event: "market_data_fetch_failure",
        provider,
        symbol,
        endpoint: url,
        requestId,
        attempt,
        maxAttempts,
        errorType: marketError.type,
        statusCode: marketError.details?.statusCode ?? null,
        providerMessage: marketError.details?.providerMessage ?? null,
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

async function fetchJsonWithFallback(entries, options = {}) {
  let lastError = null;
  for (const entry of entries) {
    try {
      return await fetchJsonWithRetry(entry.url, { ...options, provider: entry.provider });
    } catch (error) {
      lastError = error;
      if (!shouldFallbackAfterError(error)) {
        throw error;
      }
    }
  }
  throw lastError ?? new MarketDataError("unavailable", "Failed to fetch market data.");
}

function buildQuoteFromYahoo(quote) {
  if (!quote) {
    return null;
  }
  const session = deriveMarketSession(quote);
  const regularFields = {
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePct: quote.regularMarketChangePercent,
    timestamp: quote.regularMarketTime,
  };
  const preFields = {
    price: quote.preMarketPrice,
    change: quote.preMarketChange,
    changePct: quote.preMarketChangePercent,
    timestamp: quote.preMarketTime,
  };
  const postFields = {
    price: quote.postMarketPrice,
    change: quote.postMarketChange,
    changePct: quote.postMarketChangePercent,
    timestamp: quote.postMarketTime,
  };
  const selectFields = (sessionType) => {
    if (sessionType === "PRE") {
      return {
        price: preFields.price ?? regularFields.price,
        change: preFields.change ?? regularFields.change,
        changePct: preFields.changePct ?? regularFields.changePct,
        timestamp: preFields.timestamp ?? regularFields.timestamp,
      };
    }
    if (sessionType === "POST") {
      return {
        price: postFields.price ?? regularFields.price,
        change: postFields.change ?? regularFields.change,
        changePct: postFields.changePct ?? regularFields.changePct,
        timestamp: postFields.timestamp ?? regularFields.timestamp,
      };
    }
    return regularFields;
  };

  const fields = selectFields(session);
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
    asOfTimestamp: normalizeEpochToMs(fields.timestamp),
    isRealtime: session === "REGULAR" || session === "PRE" || session === "POST",
    session,
    previousClose,
    name: quote.shortName ?? quote.longName ?? null,
    currency: quote.currency ?? null,
    exchangeTimezoneName: quote.exchangeTimezoneName ?? null,
    exchangeTimezoneShortName: quote.exchangeTimezoneShortName ?? null,
  };
}

function normalizeQuote(rawQuote, nowMs = Date.now()) {
  if (!rawQuote) {
    return null;
  }
  const isYahooQuote =
    rawQuote?.regularMarketPrice != null ||
    rawQuote?.regularMarketTime != null ||
    rawQuote?.preMarketPrice != null ||
    rawQuote?.postMarketPrice != null ||
    rawQuote?.marketState != null ||
    rawQuote?.regularMarketState != null;
  const base = isYahooQuote ? buildQuoteFromYahoo(rawQuote) : rawQuote;
  if (!base) {
    return null;
  }
  const asOfTimestamp = normalizeEpochToMs(
    base.asOfTimestamp ?? base.timestamp ?? rawQuote.asOfTimestamp ?? rawQuote.timestamp ?? rawQuote.asOfTs,
  );
  const derivedSession = normalizeSession(base.session) ?? normalizeSession(rawQuote.session);
  const inferredSession = normalizeSession(deriveMarketSession(rawQuote, nowMs));
  const explicitState = rawQuote?.marketState ?? rawQuote?.regularMarketState ?? null;
  const explicitSession = normalizeSession(explicitState);
  const lastKnownSession = normalizeSession(rawQuote.lastKnownSession);
  let session =
    derivedSession ?? inferredSession ?? lastKnownSession ?? (base.isRealtime ? QUOTE_SESSIONS.REGULAR : null);
  if (
    session === QUOTE_SESSIONS.CLOSED &&
    explicitSession !== QUOTE_SESSIONS.CLOSED &&
    lastKnownSession &&
    !rawQuote?.source
  ) {
    session = lastKnownSession;
  }
  if (!session) {
    session = QUOTE_SESSIONS.CLOSED;
  }
  const source = resolveQuoteSource({
    sourceHint: rawQuote.source ?? base.source ?? rawQuote.dataSource,
    session,
    asOfTimestamp,
    nowMs,
    isRealtime: base.isRealtime,
  });
  if (source === QUOTE_SOURCES.LAST_CLOSE && session !== QUOTE_SESSIONS.CLOSED) {
    session = QUOTE_SESSIONS.CLOSED;
  }
  const isRealtime = source === QUOTE_SOURCES.REALTIME;
  const isStale = asOfTimestamp != null ? nowMs - asOfTimestamp > STALE_FRESHNESS_MS : true;
  const warnings = shouldShowCacheWarning(session, source) ? [CACHE_WARNING_MESSAGE] : [];
  return {
    symbol: rawQuote.symbol ?? base.symbol ?? null,
    price: base.price ?? null,
    changeAbs: base.change ?? null,
    changePct: base.changePct ?? null,
    asOfTs: asOfTimestamp ?? null,
    source,
    session,
    isRealtime,
    isStale,
    warnings,
    previousClose: base.previousClose ?? null,
    name: base.name ?? rawQuote.name ?? null,
    currency: base.currency ?? rawQuote.currency ?? null,
    exchangeTimezoneName: base.exchangeTimezoneName ?? rawQuote.exchangeTimezoneName ?? null,
    exchangeTimezoneShortName: base.exchangeTimezoneShortName ?? rawQuote.exchangeTimezoneShortName ?? null,
  };
}

function getMarketSessionBadge(session, hasData = true) {
  if (!hasData) {
    return { label: "UNKNOWN", className: "delayed" };
  }
  if (session === "REGULAR") {
    return { label: "REGULAR", className: "realtime" };
  }
  if (session === "PRE" || session === "POST") {
    return { label: session, className: "afterhours" };
  }
  return { label: "CLOSED", className: "closed" };
}

function getMarketSourceBadge(entry, hasData = true) {
  if (!hasData) {
    return { label: "UNAVAILABLE", className: "delayed" };
  }
  const source = entry?.dataSource ?? QUOTE_SOURCES.CACHED;
  if (source === QUOTE_SOURCES.REALTIME) {
    return { label: "REALTIME", className: "realtime" };
  }
  if (source === QUOTE_SOURCES.DELAYED) {
    return { label: "DELAYED", className: "delayed" };
  }
  if (source === QUOTE_SOURCES.CACHED) {
    return { label: "CACHED", className: "cached" };
  }
  if (source === QUOTE_SOURCES.LAST_CLOSE) {
    return { label: "LAST CLOSE", className: "historical" };
  }
  if (source === QUOTE_SOURCES.UNAVAILABLE) {
    return { label: "UNAVAILABLE", className: "delayed" };
  }
  return { label: "UNAVAILABLE", className: "delayed" };
}

function hasMarketIndicatorData(entry) {
  return Boolean(
    entry &&
      (entry.lastPrice != null ||
        entry.quoteAsOf != null ||
        entry.lastHistoricalTimestamp != null ||
        entry.lastUpdatedAt != null),
  );
}

function getMarketIndicatorData(entry, options = {}) {
  const hasData = hasMarketIndicatorData(entry);
  const session = entry?.quoteSession ?? QUOTE_SESSIONS.CLOSED;
  const asOfTimestamp = entry?.quoteAsOf ?? null;
  const sessionBadge = getMarketSessionBadge(session, hasData);
  const sourceBadge = getMarketSourceBadge(entry, hasData);
  let marketStatus = "Unavailable";
  if (hasData) {
    if (session === "PRE" || session === "POST") {
      marketStatus = "After hours";
    } else if (session === "CLOSED") {
      marketStatus = "Closed";
    } else {
      marketStatus = "Open";
    }
  }
  const asOfLabel = asOfTimestamp
    ? `As of ${formatAsOf(asOfTimestamp, { tz: "UTC" })}`
    : "No data";
  return {
    marketStatus,
    sessionBadge,
    sourceBadge,
    asOfLabel,
    usingCached: options.usingCached === true,
  };
}

function getLatestMarketEntry() {
  let latestEntry = null;
  let latestTimestamp = -Infinity;
  marketState.forEach((entry) => {
    const timestamp =
      entry?.quoteAsOf ?? entry?.lastUpdatedAt ?? entry?.lastHistoricalTimestamp ?? null;
    if (!hasMarketIndicatorData(entry)) {
      return;
    }
    if (timestamp != null && timestamp > latestTimestamp) {
      latestTimestamp = timestamp;
      latestEntry = entry;
    }
  });
  return latestEntry;
}

function getReferenceSymbol(symbols = getVisibleSymbols()) {
  if (symbols?.length) {
    return symbols[0];
  }
  return marketState[0]?.symbol ?? null;
}

function getMarketIndicatorEntry() {
  const referenceSymbol = getReferenceSymbol();
  const entry = referenceSymbol ? getStockEntry(referenceSymbol) : null;
  if (hasMarketIndicatorData(entry)) {
    return entry;
  }
  return getLatestMarketEntry();
}

function updateMarketIndicator() {
  if (!marketOpenText || !marketSessionBadge || !marketAsOf || !marketSourceBadge) {
    return;
  }
  const entry = getMarketIndicatorEntry();
  const data = getMarketIndicatorData(entry, {
    usingCached: marketIndicatorState.usingCached,
  });
  marketOpenText.textContent = data.marketStatus;
  marketSessionBadge.textContent = data.sessionBadge.label;
  marketSessionBadge.className = `session-badge ${data.sessionBadge.className}`;
  marketAsOf.textContent = data.asOfLabel;
  marketSourceBadge.textContent = data.sourceBadge.label;
  marketSourceBadge.className = `session-badge ${data.sourceBadge.className}`;
  if (marketCacheNote) {
    marketCacheNote.classList.toggle("hidden", !data.usingCached);
  }
}

function getSourceBadge(source) {
  if (source === QUOTE_SOURCES.CACHED) {
    return { label: "CACHED", className: "cached", tooltip: "Cached last-known quote." };
  }
  if (source === QUOTE_SOURCES.LAST_CLOSE) {
    return { label: "LAST CLOSE", className: "historical", tooltip: "Last close from historical data." };
  }
  if (source === QUOTE_SOURCES.DELAYED) {
    return { label: "DELAYED", className: "delayed", tooltip: "Delayed quote." };
  }
  if (source === QUOTE_SOURCES.REALTIME) {
    return { label: "REALTIME", className: "realtime", tooltip: "Live quote." };
  }
  if (source === QUOTE_SOURCES.UNAVAILABLE) {
    return { label: "UNAVAILABLE", className: "delayed", tooltip: "Live quote unavailable." };
  }
  return { label: "UNAVAILABLE", className: "delayed", tooltip: "Live quote unavailable." };
}

function getSessionBadgeForSession(session) {
  if (session === QUOTE_SESSIONS.REGULAR) {
    return { label: "REGULAR", className: "realtime", tooltip: "Regular trading session." };
  }
  if (session === QUOTE_SESSIONS.PRE || session === QUOTE_SESSIONS.POST) {
    return { label: session, className: "afterhours", tooltip: "Extended-hours session." };
  }
  return { label: "CLOSED", className: "closed", tooltip: "Market closed." };
}

function calculateSignal(prices) {
  if (!prices || prices.length < 5 || !computeIndicators || !scoreSignal) {
    return "hold";
  }
  const recent = prices[prices.length - 1];
  const indicators = computeIndicators(prices);
  const scored = scoreSignal(indicators, { price: recent });
  return scored?.signal ?? "hold";
}

function getBacktestDateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getBacktestCacheKey(symbol, dateStamp) {
  return `${BACKTEST_CACHE_PREFIX}_${symbol}_${dateStamp}`;
}

function formatPercentNoSign(value) {
  if (value == null || Number.isNaN(value)) {
    return "n/a";
  }
  return `${percentFormatter.format(value)}%`;
}

function calculateMaxDrawdown(equityCurve) {
  if (!Array.isArray(equityCurve) || equityCurve.length === 0) {
    return 0;
  }
  let peak = equityCurve[0];
  let maxDrawdown = 0;
  equityCurve.forEach((value) => {
    if (value > peak) {
      peak = value;
    }
    if (peak > 0) {
      const drawdown = (value - peak) / peak;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
  });
  return Math.abs(maxDrawdown) * 100;
}

function runBacktest30d(prices, options = {}) {
  const minCandles = options.minCandles ?? BACKTEST_MIN_CANDLES;
  if (!Array.isArray(prices) || prices.length < minCandles) {
    return {
      hasEnoughData: false,
      trades: 0,
      winRate: 0,
      avgReturn: 0,
      maxDrawdown: 0,
      buyHoldReturn: 0,
      tradeReturns: [],
      equityCurve: [],
    };
  }

  const signalFn = options.signalFn ?? calculateSignal;
  let equity = 1;
  const equityCurve = [equity];
  let positionActive = false;
  let entryPrice = null;
  let entryIndex = null;
  let pendingEntry = false;
  let pendingExit = false;
  const tradeReturns = [];

  for (let index = 0; index < prices.length - 1; index += 1) {
    const slice = prices.slice(0, index + 1);
    const signal = signalFn(slice);

    if (!positionActive && signal === "buy") {
      pendingEntry = true;
    } else if (positionActive && signal === "sell") {
      pendingExit = true;
    }

    const nextIndex = index + 1;
    const hasPositionForInterval = positionActive && entryIndex != null && entryIndex <= index;
    if (hasPositionForInterval) {
      const currentPrice = prices[index];
      const nextPrice = prices[nextIndex];
      if (Number.isFinite(currentPrice) && Number.isFinite(nextPrice) && currentPrice > 0) {
        equity *= nextPrice / currentPrice;
      }
    }

    if (pendingEntry && !positionActive) {
      const entry = prices[nextIndex];
      if (Number.isFinite(entry) && entry > 0) {
        positionActive = true;
        entryPrice = entry;
        entryIndex = nextIndex;
      }
      pendingEntry = false;
    }

    if (pendingExit && positionActive && entryPrice != null && entryIndex != null && nextIndex >= entryIndex) {
      const exitPrice = prices[nextIndex];
      if (Number.isFinite(exitPrice) && entryPrice > 0) {
        tradeReturns.push(((exitPrice - entryPrice) / entryPrice) * 100);
      }
      positionActive = false;
      entryPrice = null;
      entryIndex = null;
      pendingExit = false;
    }

    equityCurve.push(equity);
  }

  const finalPrice = prices[prices.length - 1];
  if (positionActive && entryPrice != null && Number.isFinite(finalPrice) && entryPrice > 0) {
    tradeReturns.push(((finalPrice - entryPrice) / entryPrice) * 100);
  }

  const trades = tradeReturns.length;
  const wins = tradeReturns.filter((value) => value > 0).length;
  const winRate = trades ? (wins / trades) * 100 : 0;
  const avgReturn = trades ? tradeReturns.reduce((sum, value) => sum + value, 0) / trades : 0;
  const buyHoldReturn =
    prices.length >= 2 && Number.isFinite(prices[0]) && prices[0] > 0
      ? ((finalPrice - prices[0]) / prices[0]) * 100
      : 0;

  return {
    hasEnoughData: true,
    trades,
    winRate,
    avgReturn,
    maxDrawdown: calculateMaxDrawdown(equityCurve),
    buyHoldReturn,
    tradeReturns,
    equityCurve,
  };
}

function getBacktestSummary(symbol, prices) {
  const normalizedSymbol = normalizeSymbolInput(symbol ?? "");
  if (!normalizedSymbol) {
    return runBacktest30d(prices ?? []);
  }
  const dateStamp = getBacktestDateStamp();
  const cacheKey = getBacktestCacheKey(normalizedSymbol, dateStamp);
  const cached = storageAdapter.get(cacheKey);
  if (cached?.summary) {
    return cached.summary;
  }
  const summary = runBacktest30d(prices ?? []);
  if (summary.hasEnoughData) {
    storageAdapter.set(cacheKey, { summary, storedAt: Date.now() });
  }
  return summary;
}

function classifyTimeHorizon({ volatilityLevel, trendStrength }) {
  if (volatilityLevel === "high" && trendStrength === "weak") {
    return { label: "Scalp (minutes–hours)", shortLabel: "Scalp" };
  }
  if (volatilityLevel === "medium" && trendStrength === "moderate") {
    return { label: "Swing (days)", shortLabel: "Swing" };
  }
  if (volatilityLevel === "low" && trendStrength === "strong") {
    return { label: "Position (weeks)", shortLabel: "Position" };
  }
  if (trendStrength === "strong" && volatilityLevel !== "high") {
    return { label: "Position (weeks)", shortLabel: "Position" };
  }
  if (volatilityLevel === "high") {
    return { label: "Scalp (minutes–hours)", shortLabel: "Scalp" };
  }
  return { label: "Swing (days)", shortLabel: "Swing" };
}

function getTrendStrengthLabel(trendPercent) {
  if (trendPercent == null) {
    return "moderate";
  }
  const absoluteTrend = Math.abs(trendPercent);
  if (absoluteTrend < 2) {
    return "weak";
  }
  if (absoluteTrend < 5) {
    return "moderate";
  }
  return "strong";
}

function getVolatilityLevel(atrPercent) {
  if (atrPercent == null) {
    return "medium";
  }
  if (atrPercent <= 2.5) {
    return "low";
  }
  if (atrPercent <= 4.5) {
    return "medium";
  }
  return "high";
}

function calculateTimeHorizon(prices, atrLikeOverride) {
  if (!prices || prices.length < 2) {
    return { label: "Swing (days)", shortLabel: "Swing" };
  }
  const lookback = Math.min(ATR_LOOKBACK, prices.length);
  const slice = prices.slice(-lookback);
  const start = slice[0];
  const end = slice[slice.length - 1];
  const trendPercent = start ? ((end - start) / start) * 100 : null;
  const atrLike = atrLikeOverride ?? calculateAtrLike(prices, ATR_LOOKBACK);
  const atrPercent = atrLike && end ? (atrLike / end) * 100 : null;
  const trendStrength = getTrendStrengthLabel(trendPercent);
  const volatilityLevel = getVolatilityLevel(atrPercent);
  return classifyTimeHorizon({ volatilityLevel, trendStrength });
}

function formatPercent(value) {
  if (value == null || Number.isNaN(value)) {
    return "n/a";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${percentFormatter.format(value)}%`;
}

function calculateAtrLike(prices, lookback = ATR_LOOKBACK) {
  if (!prices || prices.length < 2) {
    return null;
  }
  const sliceStart = Math.max(prices.length - (lookback + 1), 0);
  const slice = prices.slice(sliceStart);
  const ranges = slice.slice(1).map((price, index) => Math.abs(price - slice[index]));
  if (!ranges.length) {
    return null;
  }
  const total = ranges.reduce((sum, value) => sum + value, 0);
  return total / ranges.length;
}

function getIndicatorCacheKey(symbol, timestamp) {
  return `${symbol}|${timestamp ?? "unknown"}`;
}

function getCachedIndicatorSnapshot(symbol, prices, lastTimestamp) {
  const key = getIndicatorCacheKey(symbol, lastTimestamp);
  const cached = indicatorCache.get(key);
  if (cached && Date.now() - cached.storedAt < INDICATOR_CACHE_TTL_MS) {
    return cached.snapshot;
  }
  if (!prices?.length) {
    return null;
  }
  const length = prices.length;
  const maxLookback = Math.max(ATR_LOOKBACK + 1, 10, 6);
  const sliceStart = Math.max(length - maxLookback, 0);
  let atrSum = 0;
  let atrCount = 0;
  let averageSum = 0;
  let averageCount = 0;
  const recentReturns = [];
  for (let index = sliceStart + 1; index < length; index += 1) {
    const current = prices[index];
    const previous = prices[index - 1];
    if (typeof current === "number" && typeof previous === "number") {
      if (index >= length - (ATR_LOOKBACK + 1)) {
        atrSum += Math.abs(current - previous);
        atrCount += 1;
      }
      if (index >= length - 5) {
        recentReturns.push(((current - previous) / previous) * 100);
      }
    }
  }
  for (let index = Math.max(length - 10, 0); index < length; index += 1) {
    const value = prices[index];
    if (typeof value === "number") {
      averageSum += value;
      averageCount += 1;
    }
  }
  const snapshot = {
    recent: prices[length - 1] ?? null,
    average10: averageCount ? averageSum / averageCount : null,
    atrLike: atrCount ? atrSum / atrCount : null,
    recentReturns,
  };
  indicatorCache.set(key, { snapshot, storedAt: Date.now() });
  return snapshot;
}

function getSwingLevels(prices, lookback = SWING_LOOKBACK) {
  if (!prices || !prices.length) {
    return { low: null, high: null };
  }
  const slice = prices.slice(-lookback);
  return {
    low: Math.min(...slice),
    high: Math.max(...slice),
  };
}

function getHoldWatchLevels(prices) {
  const length = prices?.length ?? 0;
  const lookback = Math.min(Math.max(length, HOLD_LOOKBACK_MIN), HOLD_LOOKBACK_MAX);
  return getSwingLevels(prices ?? [], lookback);
}

function resolvePriceContext(marketEntry) {
  const history = marketEntry?.history ?? [];
  const historyPrice = history.length ? history[history.length - 1] : null;
  const livePrice = marketEntry?.lastPrice ?? null;
  const price = livePrice ?? historyPrice ?? null;
  if (price == null) {
    return {
      price: null,
      label: "Price unavailable",
      asOf: null,
      isLive: false,
    };
  }
  const isLive = marketEntry?.isRealtime || marketEntry?.quoteSession === "REGULAR";
  const dataSource = marketEntry?.dataSource ?? QUOTE_SOURCES.LAST_CLOSE;
  let label = "Live quote";
  if (!isLive) {
    if (dataSource === QUOTE_SOURCES.CACHED) {
      label = "Cached quote";
    } else if (dataSource === QUOTE_SOURCES.DELAYED) {
      label = "Delayed quote";
    } else {
      label = "Last close";
    }
  }
  return {
    price,
    label,
    asOf: marketEntry?.quoteAsOf ?? marketEntry?.lastHistoricalTimestamp ?? null,
    isLive,
  };
}

function buildSignalReasons({
  action,
  recent,
  average,
  dailyChange,
  monthlyChange,
  atrPercent,
}) {
  const reasons = [];
  if (recent != null && average != null) {
    const diffPct = ((recent - average) / average) * 100;
    reasons.push(
      `Price is ${Math.abs(diffPct).toFixed(2)}% ${diffPct >= 0 ? "above" : "below"} the 10-day average.`,
    );
  }
  if (dailyChange != null) {
    reasons.push(`Latest session move: ${formatPercent(dailyChange)}.`);
  }
  if (monthlyChange != null) {
    reasons.push(`1-month trend: ${formatPercent(monthlyChange)}.`);
  }
  if (atrPercent != null) {
    reasons.push(`30-day volatility avg: ${formatPercent(atrPercent)}.`);
  }
  if (action === "buy") {
    reasons.push("Signal favors a mean-reversion entry after a short-term pullback.");
  } else if (action === "sell") {
    reasons.push("Signal flags an overextended move versus recent averages.");
  } else {
    reasons.push("Signal sits near the short-term mean with no clear edge.");
  }
  const unique = [...new Set(reasons)];
  const trimmed = unique.slice(0, 5);
  while (trimmed.length < 3) {
    trimmed.push("Signal uses the last 30 sessions of pricing history for context.");
  }
  return trimmed;
}

function buildInvalidationRules({
  action,
  recent,
  average,
  dailyChange,
  monthlyChange,
  atrPercent,
}) {
  const maThreshold = 1;
  const volatilityThreshold = 5;
  const volatilityHoldThreshold = 6;
  const momentumDirection = calculateMomentumDirection([dailyChange, monthlyChange]);
  const rules = [];

  if (action === "buy") {
    rules.push(
      `If price closes >${maThreshold}% above the 10-day MA => downgrade to HOLD.`,
    );
    rules.push(
      "If 1D/1M momentum flips positive => mean-reversion edge fades.",
    );
    rules.push(
      `If volatility spikes above ${volatilityThreshold}% ATR => reduce size or wait.`,
    );
  } else if (action === "sell") {
    rules.push(
      `If price closes >${maThreshold}% below the 10-day MA => downgrade to HOLD.`,
    );
    rules.push(
      "If 1D/1M momentum turns negative => cover and reassess.",
    );
    rules.push(
      `If volatility spikes above ${volatilityThreshold}% ATR => reduce size or wait.`,
    );
  } else {
    rules.push(
      `If price closes >${maThreshold}% above the 10-day MA => upgrade to BUY.`,
    );
    rules.push(
      `If price closes >${maThreshold}% below the 10-day MA => downgrade to SELL.`,
    );
    rules.push(
      `If volatility spikes above ${volatilityHoldThreshold}% ATR => stay on the sidelines.`,
    );
  }

  if (momentumDirection !== 0 && rules.length) {
    rules[1] =
      momentumDirection > 0
        ? rules[1].replace("positive", "decisively positive")
        : rules[1].replace("negative", "decisively negative");
  }

  const unique = [...new Set(rules)].filter((rule) => rule && rule.trim().length);
  const trimmed = unique.slice(0, 3);
  while (trimmed.length < 2) {
    trimmed.push("If key indicators reverse, scale back risk and revisit the signal.");
  }
  return trimmed;
}

function getConfidenceLabel(score) {
  if (score >= 70) {
    return "High";
  }
  if (score >= 40) {
    return "Medium";
  }
  return "Low";
}

function clampNumber(value, min = 0, max = 1) {
  if (value == null || Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function getRecentReturns(prices, lookback = 5) {
  if (!prices || prices.length < 2) {
    return [];
  }
  const slice = prices.slice(-1 * (lookback + 1));
  return slice.slice(1).map((price, index) => {
    const previous = slice[index];
    if (!previous) {
      return 0;
    }
    return ((price - previous) / previous) * 100;
  });
}

function redistributeWeights(weights, excludedKey) {
  const remainingKeys = Object.keys(weights).filter((key) => key !== excludedKey);
  const remainingTotal = remainingKeys.reduce((sum, key) => sum + weights[key], 0);
  return remainingKeys.reduce((acc, key) => {
    acc[key] = weights[key] + (weights[excludedKey] * (weights[key] / remainingTotal));
    return acc;
  }, {});
}

function getSignalScoreLabel(score) {
  if (score >= 65) {
    return "Strong";
  }
  if (score > 35) {
    return "Ok";
  }
  return "Weak";
}

function calculateMomentumDirection(changes) {
  const valid = changes.filter((value) => typeof value === "number");
  if (!valid.length) {
    return 0;
  }
  const average = valid.reduce((sum, value) => sum + value, 0) / valid.length;
  if (Math.abs(average) < 0.15) {
    return 0;
  }
  return average > 0 ? 1 : -1;
}

function calculateSignalScore({ prices, price, indicators, signalResult } = {}) {
  if (!computeIndicators || !scoreSignal) {
    return { total: 0, label: getSignalScoreLabel(0), components: [] };
  }
  const resolvedIndicators =
    indicators ?? computeIndicators(Array.isArray(prices) ? prices : []);
  const resolvedPrice =
    price ?? (Array.isArray(prices) && prices.length ? prices[prices.length - 1] : null);
  const scored = signalResult ?? scoreSignal(resolvedIndicators, { price: resolvedPrice });
  const totalScore = scored?.score ?? 0;
  return {
    total: totalScore,
    label: getSignalScoreLabel(totalScore),
    components: Array.isArray(scored?.components) ? scored.components : [],
  };
}

function getVolatilityRegime(atrPercent) {
  if (atrPercent == null) {
    return { label: "Unknown", score: 12, caution: "Volatility data limited: manage risk conservatively." };
  }
  if (atrPercent <= 2) {
    return {
      label: "Low",
      score: 25,
      caution: "Low volatility: avoid overly tight stops and confirm the move.",
    };
  }
  if (atrPercent <= 4) {
    return {
      label: "Moderate",
      score: 18,
      caution: "Moderate volatility: keep sizing balanced and stops at planned levels.",
    };
  }
  if (atrPercent <= 6) {
    return {
      label: "High",
      score: 10,
      caution: "High volatility: widen stop or reduce position size.",
    };
  }
  return {
    label: "Very High",
    score: 5,
    caution: "Very high volatility: reduce size and wait for calmer price action.",
  };
}

function calculateSignalConfidence({
  prices,
  price,
  indicators,
  signalResult,
}) {
  if (!computeIndicators || !scoreSignal) {
    return {
      score: 25,
      label: "Low",
      reasons: [
        "Signal confidence is unavailable while strategy modules load.",
        "Trend confirmation is pending additional data.",
      ],
      caution: "Limited data: keep size small until fresh history loads.",
    };
  }
  const resolvedIndicators =
    indicators ?? computeIndicators(Array.isArray(prices) ? prices : []);
  const resolvedPrice =
    price ?? (Array.isArray(prices) && prices.length ? prices[prices.length - 1] : null);
  const scored = signalResult ?? scoreSignal(resolvedIndicators, { price: resolvedPrice });
  const confidenceScore = scored?.confidence ?? 0;
  const label = getConfidenceLabel(confidenceScore);
  const reasons = [
    `Aligned factors: ${Array.isArray(scored?.components) ? scored.components.length : 0} indicators weighted.`,
    `Signal distance: ${Math.abs((scored?.score ?? 50) - 50).toFixed(1)} from neutral.`,
    scored?.caution ?? "Volatility regime is stable enough to trade with caution.",
  ];

  return {
    score: confidenceScore,
    label,
    reasons,
    caution: scored?.caution ?? "Stay disciplined with sizing.",
  };
}

function calculateTradePlan({
  action,
  entryPrice,
  priceLabel,
  priceAsOf,
  prices,
  cash,
  risk,
  positionSizingMode,
  riskPercent,
  atrLike,
}) {
  const entryMeta = priceLabel
    ? `Based on ${priceLabel}${priceAsOf ? ` (${formatAsOf(priceAsOf, { tz: "UTC" })})` : ""}`
    : "";
  const safePrices = Array.isArray(prices) ? prices : [];
  const fallbackEntry = safePrices.length ? safePrices[safePrices.length - 1] : null;
  const resolvedEntryPrice = entryPrice ?? fallbackEntry;

  if (action === "hold") {
    const watchLevels = getHoldWatchLevels(safePrices);
    const breakoutLevel = watchLevels.high ?? resolvedEntryPrice;
    const breakdownLevel = watchLevels.low ?? resolvedEntryPrice;
    const breakoutDisplay =
      breakoutLevel != null ? quoteFormatter.format(breakoutLevel) : "Awaiting history";
    const breakdownDisplay =
      breakdownLevel != null ? quoteFormatter.format(breakdownLevel) : "Awaiting history";
    return {
      entryDisplay: "No position recommended",
      entryMeta,
      stopLossDisplay: "",
      takeProfitDisplay: "",
      positionSizeDisplay: "No position recommended",
      riskAmountDisplay: "—",
      stopDistanceDisplay: "—",
      riskRewardDisplay: "",
      positionSize: 0,
      riskAmount: 0,
      stopDistance: 0,
      isHold: true,
      holdNotice: "No position recommended",
      holdLevels: {
        breakoutLevel,
        breakdownLevel,
        breakoutDisplay,
        breakdownDisplay,
        breakoutTrigger: `If price breaks above ${breakoutDisplay} => BUY`,
        breakdownTrigger: `If price breaks below ${breakdownDisplay} => SELL`,
      },
    };
  }

  if (!resolvedEntryPrice) {
    return {
      entryDisplay: "Not available",
      entryMeta,
      stopLossDisplay: "Not available",
      takeProfitDisplay: "Not available",
      positionSizeDisplay: "0 shares",
      riskAmountDisplay: "Not available",
      stopDistanceDisplay: "Not available",
      riskRewardDisplay: "Not available",
      positionSize: 0,
      riskAmount: 0,
      stopDistance: 0,
      isHold: false,
      holdLevels: null,
    };
  }

  const entryRangeLow = resolvedEntryPrice * (1 - ENTRY_RANGE_PCT);
  const entryRangeHigh = resolvedEntryPrice * (1 + ENTRY_RANGE_PCT);
  const resolvedAtrLike = atrLike ?? calculateAtrLike(safePrices);
  const fallbackAtr = Math.max(resolvedEntryPrice * 0.02, 0.01);
  const atrValue = resolvedAtrLike ?? fallbackAtr;
  const swingLevels = getSwingLevels(safePrices);
  let stopLoss = null;
  if (action === "buy") {
    const atrStop = resolvedEntryPrice - atrValue * 1.2;
    const candidates = [atrStop, swingLevels.low].filter(
      (value) => value != null && value < resolvedEntryPrice,
    );
    stopLoss = candidates.length ? Math.max(...candidates) : resolvedEntryPrice * 0.97;
  } else if (action === "sell") {
    const atrStop = resolvedEntryPrice + atrValue * 1.2;
    const candidates = [atrStop, swingLevels.high].filter(
      (value) => value != null && value > resolvedEntryPrice,
    );
    stopLoss = candidates.length ? Math.min(...candidates) : resolvedEntryPrice * 1.03;
  }

  if (stopLoss == null) {
    stopLoss =
      action === "buy"
        ? resolvedEntryPrice - atrValue
        : action === "sell"
          ? resolvedEntryPrice + atrValue
          : resolvedEntryPrice;
  }

  const riskPerShare = stopLoss != null ? Math.abs(resolvedEntryPrice - stopLoss) : null;
  const safePositionSizing =
    positionSizingMode === POSITION_SIZING_MODES.RISK_PERCENT
      ? POSITION_SIZING_MODES.RISK_PERCENT
      : POSITION_SIZING_MODES.CASH;
  const normalizedRiskPercent = Number.isFinite(riskPercent)
    ? clampNumber(riskPercent, RISK_PERCENT_LIMITS.min, RISK_PERCENT_LIMITS.max)
    : RISK_PERCENT_LIMITS.fallback;
  const riskBudget =
    safePositionSizing === POSITION_SIZING_MODES.RISK_PERCENT
      ? cash * (normalizedRiskPercent / 100)
      : cash * (riskPerTrade[risk] ?? riskPerTrade.moderate);
  const maxShares = Math.max(Math.floor(cash / resolvedEntryPrice), 0);
  const positionSize =
    riskPerShare && riskPerShare > 0
      ? Math.min(Math.floor(riskBudget / riskPerShare), maxShares)
      : 0;
  const stopDistance = riskPerShare && riskPerShare > 0 ? riskPerShare : 0;

  let takeProfit = null;
  let riskReward = null;
  if (stopLoss != null) {
    if (action === "buy") {
      takeProfit = resolvedEntryPrice + 2 * (resolvedEntryPrice - stopLoss);
      riskReward = (takeProfit - resolvedEntryPrice) / (resolvedEntryPrice - stopLoss);
    } else if (action === "sell") {
      takeProfit = resolvedEntryPrice - 2 * (stopLoss - resolvedEntryPrice);
      riskReward = (resolvedEntryPrice - takeProfit) / (stopLoss - resolvedEntryPrice);
    }
  }

  return {
    entryDisplay: `${quoteFormatter.format(entryRangeLow)} - ${quoteFormatter.format(entryRangeHigh)}`,
    entryMeta,
    stopLossDisplay: quoteFormatter.format(stopLoss),
    takeProfitDisplay: takeProfit != null ? quoteFormatter.format(takeProfit) : quoteFormatter.format(stopLoss),
    positionSizeDisplay: positionSize > 0 ? `${positionSize} shares` : "0 shares",
    riskAmountDisplay: quoteFormatter.format(riskBudget),
    stopDistanceDisplay: stopDistance ? quoteFormatter.format(stopDistance) : "Not available",
    riskRewardDisplay: riskReward != null ? `${riskReward.toFixed(2)}:1` : "1.00:1",
    positionSize,
    riskAmount: riskBudget,
    stopDistance,
    stopLoss,
    takeProfit,
    riskReward,
    isHold: false,
    holdLevels: null,
  };
}

function analyzeSymbol({ symbol, cash, riskTolerance, sizingMode, riskPercent, mode } = {}) {
  const normalized = normalizeSymbolInput(symbol ?? "");
  const resolvedCash = Number.isFinite(cash) && cash > 0 ? cash : 10000;
  const resolvedRisk = Object.keys(riskLimits).includes(riskTolerance) ? riskTolerance : "moderate";
  const resolvedSizingMode =
    sizingMode === POSITION_SIZING_MODES.RISK_PERCENT ? POSITION_SIZING_MODES.RISK_PERCENT : POSITION_SIZING_MODES.CASH;
  const resolvedRiskPercent = Number.isFinite(riskPercent) ? riskPercent : null;
  return analyzeTrade({
    symbol: normalized,
    cash: resolvedCash,
    risk: resolvedRisk,
    positionSizingMode: resolvedSizingMode,
    riskPercent: resolvedRiskPercent,
    mode,
  });
}

function buildAnalysisMeta(symbol, marketEntry) {
  const lastKnownQuote = getLastKnownQuote(symbol);
  return {
    quote: lastKnownQuote
      ? {
          asOfTs: lastKnownQuote.asOfTimestamp ?? lastKnownQuote.asOfTs ?? null,
          session: lastKnownQuote.session ?? null,
          source: lastKnownQuote.source ?? null,
        }
      : null,
    quoteMeta: {
      asOfTs: marketEntry?.quoteAsOf ?? marketEntry?.lastUpdatedAt ?? null,
      session: marketEntry?.quoteSession ?? null,
      source: marketEntry?.dataSource ?? null,
    },
    fallback: {
      asOfTs: marketEntry?.lastHistoricalTimestamp ?? null,
      session: marketEntry?.quoteSession ?? null,
      source: marketEntry?.dataSource ?? null,
    },
  };
}

function analyzeTrade({ symbol, cash, risk, positionSizingMode, riskPercent }) {
  const marketEntry = getStockEntry(symbol);
  const analysisMeta = buildAnalysisMeta(symbol, marketEntry);
  const prices = marketEntry?.history ?? [];
  const lastCandleTimestamp =
    marketEntry?.lastHistoricalTimestamp ?? marketEntry?.quoteAsOf ?? marketEntry?.lastUpdatedAt ?? null;
  const indicatorSnapshot = getCachedIndicatorSnapshot(symbol, prices, lastCandleTimestamp);
  const backtestSummary = getBacktestSummary(symbol, prices);
  const priceContext = resolvePriceContext(marketEntry);
  const recent = priceContext.price ?? indicatorSnapshot?.recent ?? null;
  const indicators = computeIndicators ? computeIndicators(prices) : null;
  const scoredSignal = scoreSignal ? scoreSignal(indicators, { price: recent }) : null;
  let action = "hold";
  let thesis = [
    "Signal is neutral with limited confirmation.",
    "No strong edge detected for aggressive trades.",
  ];

  if (!recent) {
    const tradePlan = calculateTradePlan({
      action: "hold",
      entryPrice: null,
      priceLabel: priceContext.label,
      priceAsOf: priceContext.asOf,
      prices,
      cash,
      risk,
      positionSizingMode,
      riskPercent,
    });
    const signalScore = calculateSignalScore({ prices });
    const confidence = calculateSignalConfidence({ prices });
    return {
      symbol,
      ...analysisMeta,
      action: "hold",
      shares: 0,
      estimatedPrice: null,
      confidenceLabel: confidence.label,
      confidenceScore: confidence.score,
      confidenceReasons: confidence.reasons,
      confidenceCaution: confidence.caution,
      signalScore,
      thesis: [
        "Live pricing data is unavailable for this symbol.",
        "Signals are paused until a fresh quote is retrieved.",
      ],
      tradePlan,
      signalReasons: scoredSignal?.reasons ?? [],
      invalidationRules: buildInvalidationRules({
        action: "hold",
        recent,
        average: null,
        dailyChange: marketEntry?.dailyChange ?? null,
        monthlyChange: marketEntry?.monthlyChange ?? null,
        atrPercent: null,
      }),
      timeHorizon: calculateTimeHorizon(prices, indicatorSnapshot?.atrLike ?? null),
      backtest: backtestSummary,
      disclaimer: "Educational demo only — not financial advice. Always validate with professional guidance.",
      generatedAt: new Date().toLocaleString(),
    };
  }

  if (scoredSignal?.signal) {
    action = scoredSignal.signal;
  }
  if (scoredSignal?.reasons?.length) {
    thesis = scoredSignal.reasons.slice(0, 2);
  }

  const atrLike = indicatorSnapshot?.atrLike ?? calculateAtrLike(prices);
  const atrPercent = atrLike ? (atrLike / recent) * 100 : null;
  const confidence = calculateSignalConfidence({
    prices,
    price: recent,
    indicators,
    signalResult: scoredSignal,
  });
  const tradePlan = calculateTradePlan({
    action,
    entryPrice: recent,
    priceLabel: priceContext.label,
    priceAsOf: priceContext.asOf,
    prices,
    cash,
    risk,
    positionSizingMode,
    riskPercent,
    atrLike,
  });
  const signalScore = calculateSignalScore({
    prices,
    price: recent,
    indicators,
    signalResult: scoredSignal,
  });
  const shares = tradePlan.positionSize;

  return {
    symbol,
    ...analysisMeta,
    action,
    shares,
    estimatedPrice: recent,
    confidenceLabel: confidence.label,
    confidenceScore: confidence.score,
    confidenceReasons: confidence.reasons,
    confidenceCaution: confidence.caution,
    signalScore,
    thesis,
    tradePlan,
    signalReasons: scoredSignal?.reasons ?? [],
    invalidationRules: buildInvalidationRules({
      action,
      recent,
      average: null,
      dailyChange: marketEntry?.dailyChange ?? null,
      monthlyChange: marketEntry?.monthlyChange ?? null,
      atrPercent,
    }),
    timeHorizon: calculateTimeHorizon(prices, atrLike),
    backtest: backtestSummary,
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
  return cachedExtra ?? marketStateIndex.get(symbol) ?? marketState.find((stock) => stock.symbol === symbol);
}

function resetSymbolCache() {
  extraSymbolData.clear();
}

function hydrateMarketStateFromCache() {
  let updated = 0;
  lastKnownQuotes.forEach((entry, symbol) => {
    const stock = getStockEntry(symbol);
    if (!stock) {
      return;
    }
    const cachedQuote = { ...entry.quote, source: QUOTE_SOURCES.CACHED };
    updateStockWithQuote(stock, cachedQuote);
    updated += 1;
  });
  return updated;
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

function setSymbolError(message) {
  if (!symbolError) {
    return;
  }
  if (!message) {
    symbolError.textContent = "";
    symbolError.classList.add("hidden");
    return;
  }
  symbolError.textContent = message;
  symbolError.classList.remove("hidden");
}

function setWatchlistError(message) {
  if (!watchlistError) {
    return;
  }
  if (!message) {
    watchlistError.textContent = "";
    watchlistError.classList.add("hidden");
    return;
  }
  watchlistError.textContent = message;
  watchlistError.classList.remove("hidden");
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

function setFormLoadingState(isLoading) {
  if (!submitButton) {
    return;
  }
  submitButton.disabled = isLoading;
  submitButton.classList.toggle("is-loading", isLoading);
  if (isLoading) {
    submitButton.setAttribute("aria-busy", "true");
  } else {
    submitButton.removeAttribute("aria-busy");
  }
}

function renderLoadingState(symbol) {
  if (!resultCard) {
    return;
  }
  resultCard.classList.remove("hidden");
  resultCard.classList.add("loading");
  if (resultSymbol) {
    resultSymbol.textContent = symbol;
  }
  if (resultAction) {
    resultAction.textContent = "LOADING";
    resultAction.className = "signal hold";
  }
  if (resultConfidence) {
    resultConfidence.textContent = "AI Confidence: —";
  }
  if (resultConfidenceBadge) {
    resultConfidenceBadge.textContent = "—";
    resultConfidenceBadge.className = "badge confidence-badge low";
  }
  if (resultConfidenceScore) {
    resultConfidenceScore.textContent = "—";
  }
  if (resultSignalScore) {
    resultSignalScore.textContent = "—";
  }
  if (resultSignalLabel) {
    resultSignalLabel.textContent = "—";
    resultSignalLabel.className = "signal-score-label";
  }
  if (resultSignalBreakdown) {
    resultSignalBreakdown.innerHTML = "";
  }
  if (resultTimeHorizon) {
    resultTimeHorizon.textContent = "Time horizon: —";
  }
  if (resultShares) {
    resultShares.textContent = "Loading...";
  }
  if (resultLivePrice) {
    resultLivePrice.textContent = "Live price: Loading...";
  }
  if (resultPrice) {
    resultPrice.textContent = "Estimated price: —";
  }
  if (resultThesis) {
    resultThesis.innerHTML = "<li>Gathering the latest market data...</li>";
  }
  if (resultReasoning) {
    resultReasoning.innerHTML = "<li>Preparing indicator breakdown...</li>";
  }
  if (resultInvalidation) {
    resultInvalidation.innerHTML = "<li>Preparing invalidation rules...</li>";
  }
  if (resultConfidenceCaution) {
    resultConfidenceCaution.textContent = "—";
  }
  if (resultGenerated) {
    resultGenerated.textContent = "Generated —";
  }
  if (resultDisclaimer) {
    resultDisclaimer.textContent = "Educational demo only — not financial advice.";
  }
  if (resultBacktestStatus) {
    resultBacktestStatus.textContent = "Loading...";
    resultBacktestStatus.classList.remove("hidden");
  }
  if (resultBacktestList) {
    resultBacktestList.classList.add("hidden");
  }
  if (resultBacktestTrades) {
    resultBacktestTrades.textContent = "—";
  }
  if (resultBacktestWinRate) {
    resultBacktestWinRate.textContent = "—";
  }
  if (resultBacktestAvgReturn) {
    resultBacktestAvgReturn.textContent = "—";
  }
  if (resultBacktestDrawdown) {
    resultBacktestDrawdown.textContent = "—";
  }
  if (resultBacktestBuyHold) {
    resultBacktestBuyHold.textContent = "—";
  }
  if (resultBacktestDisclaimer) {
    resultBacktestDisclaimer.textContent =
      "Educational demo. Based on last 30 trading days. Assumes next-day fills. Not financial advice.";
  }
}

function renderResult(result) {
  if (!resultCard) {
    return;
  }
  resultCard.classList.remove("loading");
  resultSymbol.textContent = result.symbol;
  resultAction.textContent = result.action.toUpperCase();
  resultAction.className = `signal ${result.action}`;
  resultConfidence.textContent = `AI Confidence: ${result.confidenceLabel} (${result.confidenceScore}%)`;
  if (resultConfidenceBadge) {
    resultConfidenceBadge.textContent = result.confidenceLabel;
    resultConfidenceBadge.className = `badge confidence-badge ${result.confidenceLabel.toLowerCase()}`;
  }
  if (resultConfidenceScore) {
    resultConfidenceScore.textContent = `${result.confidenceScore}%`;
  }
  resultShares.textContent = result.tradePlan.isHold
    ? "No position recommended"
    : `${result.shares} shares`;
  updateResultLivePriceDisplay(result.symbol);
  resultPrice.textContent = result.estimatedPrice
    ? `Estimated price: ${quoteFormatter.format(result.estimatedPrice)}`
    : "Estimated price: Not available";
  resultThesis.innerHTML = result.thesis.map((line) => `<li>${line}</li>`).join("");
  if (resultReasoning) {
    resultReasoning.innerHTML = result.confidenceReasons.map((line) => `<li>${line}</li>`).join("");
  }
  if (resultInvalidation) {
    const rules = Array.isArray(result.invalidationRules) ? result.invalidationRules : [];
    resultInvalidation.innerHTML = rules.map((rule) => `<li>${rule}</li>`).join("");
  }
  if (resultConfidenceCaution) {
    resultConfidenceCaution.textContent = result.confidenceCaution;
  }
  if (resultSignalScore && result.signalScore) {
    resultSignalScore.textContent = `${result.signalScore.total}`;
  }
  if (resultSignalLabel && result.signalScore) {
    resultSignalLabel.textContent = result.signalScore.label;
    resultSignalLabel.className = `signal-score-label ${result.signalScore.label.toLowerCase()}`;
  }
  if (resultSignalBreakdown && result.signalScore) {
    resultSignalBreakdown.innerHTML = result.signalScore.components
      .map((component) => {
        const max = component.max ?? 0;
        const maxDisplay = Number.isFinite(max) ? Math.round(max) : 0;
        const percent = max ? Math.min(100, Math.round((component.score / max) * 100)) : 0;
        return `
          <li class="score-breakdown-item">
            <div class="score-breakdown-header">
              <span>${component.label}</span>
              <span>${component.score}/${maxDisplay}</span>
            </div>
            <div class="score-breakdown-bar" role="presentation">
              <span style="width: ${percent}%"></span>
            </div>
          </li>
        `;
      })
      .join("");
  }
  if (resultTimeHorizon) {
    const horizonLabel = result.timeHorizon?.label ?? "Swing (days)";
    resultTimeHorizon.textContent = `Time horizon: ${horizonLabel}`;
  }
  if (planEntry) {
    planEntry.textContent = result.tradePlan.entryDisplay;
  }
  if (planEntryMeta) {
    planEntryMeta.textContent = result.tradePlan.entryMeta;
  }
  if (planStopLoss) {
    planStopLoss.textContent = result.tradePlan.stopLossDisplay;
  }
  if (planTakeProfit) {
    planTakeProfit.textContent = result.tradePlan.takeProfitDisplay;
  }
  if (planPosition) {
    planPosition.textContent = result.tradePlan.positionSizeDisplay;
  }
  if (planRiskAmount) {
    planRiskAmount.textContent = result.tradePlan.riskAmountDisplay;
  }
  if (planStopDistance) {
    planStopDistance.textContent = result.tradePlan.stopDistanceDisplay;
  }
  if (planRiskReward) {
    planRiskReward.textContent = result.tradePlan.riskRewardDisplay;
  }
  const isHold = result.tradePlan.isHold;
  if (planStopLossRow) {
    planStopLossRow.classList.toggle("hidden", isHold);
  }
  if (planTakeProfitRow) {
    planTakeProfitRow.classList.toggle("hidden", isHold);
  }
  if (planRiskRewardRow) {
    planRiskRewardRow.classList.toggle("hidden", isHold);
  }
  if (planHoldLevels) {
    planHoldLevels.classList.toggle("hidden", !isHold);
  }
  if (isHold && result.tradePlan.holdLevels) {
    if (planHoldNote) {
      planHoldNote.textContent = result.tradePlan.holdNotice ?? "";
    }
    if (planHoldBreakout) {
      planHoldBreakout.textContent = result.tradePlan.holdLevels.breakoutDisplay;
    }
    if (planHoldBreakoutTrigger) {
      planHoldBreakoutTrigger.textContent = result.tradePlan.holdLevels.breakoutTrigger;
    }
    if (planHoldBreakdown) {
      planHoldBreakdown.textContent = result.tradePlan.holdLevels.breakdownDisplay;
    }
    if (planHoldBreakdownTrigger) {
      planHoldBreakdownTrigger.textContent = result.tradePlan.holdLevels.breakdownTrigger;
    }
  } else {
    if (planHoldNote) {
      planHoldNote.textContent = "";
    }
    if (planHoldBreakout) {
      planHoldBreakout.textContent = "";
    }
    if (planHoldBreakoutTrigger) {
      planHoldBreakoutTrigger.textContent = "";
    }
    if (planHoldBreakdown) {
      planHoldBreakdown.textContent = "";
    }
    if (planHoldBreakdownTrigger) {
      planHoldBreakdownTrigger.textContent = "";
    }
  }
  const backtest = result.backtest ?? null;
  if (backtest?.hasEnoughData) {
    if (resultBacktestStatus) {
      resultBacktestStatus.textContent = "";
      resultBacktestStatus.classList.add("hidden");
    }
    if (resultBacktestList) {
      resultBacktestList.classList.remove("hidden");
    }
    if (resultBacktestTrades) {
      resultBacktestTrades.textContent = `${backtest.trades}`;
    }
    if (resultBacktestWinRate) {
      resultBacktestWinRate.textContent = formatPercentNoSign(backtest.winRate);
    }
    if (resultBacktestAvgReturn) {
      resultBacktestAvgReturn.textContent = formatPercent(backtest.avgReturn);
    }
    if (resultBacktestDrawdown) {
      resultBacktestDrawdown.textContent = formatPercentNoSign(backtest.maxDrawdown);
    }
    if (resultBacktestBuyHold) {
      resultBacktestBuyHold.textContent = formatPercent(backtest.buyHoldReturn);
    }
  } else {
    if (resultBacktestStatus) {
      resultBacktestStatus.textContent = "Not enough data";
      resultBacktestStatus.classList.remove("hidden");
    }
    if (resultBacktestList) {
      resultBacktestList.classList.add("hidden");
    }
    if (resultBacktestTrades) {
      resultBacktestTrades.textContent = "—";
    }
    if (resultBacktestWinRate) {
      resultBacktestWinRate.textContent = "—";
    }
    if (resultBacktestAvgReturn) {
      resultBacktestAvgReturn.textContent = "—";
    }
    if (resultBacktestDrawdown) {
      resultBacktestDrawdown.textContent = "—";
    }
    if (resultBacktestBuyHold) {
      resultBacktestBuyHold.textContent = "—";
    }
  }
  if (resultBacktestDisclaimer) {
    resultBacktestDisclaimer.textContent =
      "Educational demo. Based on last 30 trading days. Assumes next-day fills. Not financial advice.";
  }
  resultGenerated.textContent = `Generated ${result.generatedAt}`;
  resultDisclaimer.textContent = result.disclaimer;
  resultCard.classList.remove("hidden");
  scheduleResultScroll(resultCard);
}

function handleMarketRowAction({ symbol, autoRun, onFillSymbol, onScrollToForm, onSubmit }) {
  const normalized = normalizeSymbolInput(symbol ?? "");
  if (!normalized) {
    return { symbol: normalized, autoRun };
  }
  if (onFillSymbol) {
    onFillSymbol(normalized);
  }
  if (onScrollToForm) {
    onScrollToForm();
  }
  if (autoRun && onSubmit) {
    onSubmit();
  }
  return { symbol: normalized, autoRun };
}

function handleMarketRowInteraction(symbol) {
  handleMarketRowAction({
    symbol,
    autoRun: autoRunToggle?.checked ?? false,
    onFillSymbol: (value) => {
      if (!symbolInput) {
        return;
      }
      symbolInput.value = value;
      setSymbolError("");
      symbolInput.focus({ preventScroll: true });
    },
    onScrollToForm: () => {
      form?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    onSubmit: () => {
      if (form?.requestSubmit) {
        form.requestSubmit();
      } else if (submitButton) {
        submitButton.click();
      }
    },
  });
}

function updateResultLivePriceDisplay(symbol) {
  if (!resultLivePrice) {
    return;
  }
  const marketEntry = getStockEntry(symbol);
  const livePrice = marketEntry?.lastPrice ?? null;
  const source = marketEntry?.dataSource ?? QUOTE_SOURCES.CACHED;
  const session = marketEntry?.quoteSession ?? QUOTE_SESSIONS.CLOSED;
  const sourceBadge = livePrice !== null ? getSourceBadge(source) : null;
  const sessionBadge = livePrice !== null ? getSessionBadgeForSession(session) : null;
  const warningIcon =
    livePrice !== null &&
    (marketEntry?.quoteWarnings?.includes?.(CACHE_WARNING_MESSAGE) || shouldShowCacheWarning(session, source))
      ? `<span class="warning-icon" title="${CACHE_WARNING_MESSAGE}" aria-label="${CACHE_WARNING_MESSAGE}">⚠</span>`
      : "";
  const asOf = livePrice !== null
    ? `as of ${formatAsOf(marketEntry?.quoteAsOf || marketEntry?.lastUpdatedAt, { tz: "UTC" })}`
    : "awaiting quote";
  resultLivePrice.innerHTML = livePrice
    ? `Live price: ${quoteFormatter.format(livePrice)} ${
        sourceBadge
          ? `<span class="session-badge ${sourceBadge.className}" title="${sourceBadge.tooltip}">${sourceBadge.label}</span>`
          : ""
      } ${
        sessionBadge
          ? `<span class="session-badge ${sessionBadge.className}" title="${sessionBadge.tooltip}">${sessionBadge.label}</span>`
          : ""
      } ${warningIcon} <span class="price-meta">${asOf}</span>`
    : "Live price: Not available";
}

async function fetchJson(url, options = {}) {
  const cacheBust = Date.now();
  const fallbackEntries = CHART_PROXY_CHAIN.map((entry) => ({
    url: entry.build(url, cacheBust),
    provider: entry.label,
  }));
  if (!isBrowser) {
    fallbackEntries.unshift({ url, provider: PROVIDER });
  }
  return requestLimiter(() => fetchJsonWithFallback(fallbackEntries, options));
}

function calculatePercentChange(latest, previous) {
  if (latest == null || previous == null) {
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
  const yearIndex = closeSeries.length >= 252 ? closeSeries.length - 252 : null;
  const monthClose = closeSeries[monthIndex];
  const yearClose = yearIndex != null ? closeSeries[yearIndex] : null;
  stock.history = closeSeries;
  stock.dailyChange =
    closeSeries.length >= 2
      ? calculatePercentChange(latest, closeSeries[closeSeries.length - 2])
      : null;
  stock.monthlyChange = calculatePercentChange(latest, monthClose);
  stock.yearlyChange = yearClose != null ? calculatePercentChange(latest, yearClose) : null;
  stock.lastHistoricalTimestamp = timestamps?.[timestamps.length - 1] ?? stock.lastHistoricalTimestamp;
}

function updateStockWithQuote(stock, quote) {
  if (!quote) {
    return;
  }
  stock.quoteUnavailable = Boolean(quote.unavailable);
  if (quote.name) {
    stock.name = quote.name;
  }
  stock.lastPrice = quote.price ?? stock.lastPrice;
  if (quote.previousClose != null) {
    stock.previousClose = quote.previousClose;
  } else if (quote.change != null && quote.price != null) {
    stock.previousClose = quote.price - quote.change;
  }
  if (quote.change != null) {
    stock.lastChange = quote.change;
  }
  if (quote.changePct != null) {
    stock.lastChangePct = quote.changePct;
  }
  stock.quoteAsOf = quote.asOfTimestamp ?? stock.quoteAsOf;
  if (quote.session) {
    const normalizedSession = normalizeSession(quote.session);
    if (normalizedSession) {
      stock.quoteSession = normalizedSession;
    }
  }
  stock.isRealtime = quote.isRealtime ?? stock.isRealtime;
  stock.lastUpdated = formatTime(stock.quoteAsOf);
  stock.lastUpdatedAt = quote.asOfTimestamp ?? stock.lastUpdatedAt ?? Date.now();
  stock.dataSource = quote.source ?? stock.dataSource;
  if (quote.unavailable && quote.price == null && quote.previousClose == null) {
    stock.dataSource = QUOTE_SOURCES.UNAVAILABLE;
  }
  const fallbackWarnings = shouldShowCacheWarning(
    normalizeSession(quote.session) ?? stock.quoteSession ?? QUOTE_SESSIONS.CLOSED,
    quote.source ?? stock.dataSource ?? QUOTE_SOURCES.CACHED,
  )
    ? [CACHE_WARNING_MESSAGE]
    : [];
  stock.quoteWarnings = Array.isArray(quote.warnings) ? quote.warnings : fallbackWarnings;
  if (quote.exchangeTimezoneName) {
    stock.exchangeTimezoneName = quote.exchangeTimezoneName;
  }
  if (quote.exchangeTimezoneShortName) {
    stock.exchangeTimezoneShortName = quote.exchangeTimezoneShortName;
  }
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
  if (latestClose != null && previousClose != null) {
    const change = latestClose - previousClose;
    stock.lastChange = stock.lastChange ?? change;
    stock.lastChangePct = stock.lastChangePct ?? calculatePercentChange(latestClose, previousClose);
  }
  if (!stock.quoteAsOf && stock.lastHistoricalTimestamp) {
    stock.quoteAsOf = stock.lastHistoricalTimestamp;
  }
  if (!stock.lastUpdatedAt && stock.quoteAsOf) {
    stock.lastUpdatedAt = stock.quoteAsOf;
  }
  if (!stock.lastUpdated && stock.lastUpdatedAt) {
    stock.lastUpdated = formatTime(stock.lastUpdatedAt);
  }
  if (!stock.quoteSession) {
    stock.quoteSession = QUOTE_SESSIONS.CLOSED;
  }
  if (!stock.dataSource || stock.dataSource === QUOTE_SOURCES.REALTIME) {
    stock.dataSource = QUOTE_SOURCES.LAST_CLOSE;
  }
}

function createSymbolEntry(symbol, fallbackName) {
  return {
    symbol,
    name: fallbackName ?? symbol,
    sector: "Unknown",
    cap: "—",
    history: [],
    lastPrice: null,
    previousClose: null,
    lastChange: null,
    lastChangePct: null,
    monthlyChange: null,
    dailyChange: null,
    yearlyChange: null,
    lastUpdated: null,
    lastUpdatedAt: null,
    quoteAsOf: null,
    quoteSession: null,
    isRealtime: false,
    quoteUnavailable: false,
    dataSource: QUOTE_SOURCES.REALTIME,
    quoteWarnings: [],
  };
}

function createMarketStateEntry(base) {
  const entry = createSymbolEntry(base.symbol, base.name);
  entry.sector = base.sector;
  entry.cap = base.cap;
  entry.exchangeTimezoneName = null;
  entry.exchangeTimezoneShortName = null;
  return entry;
}

function syncMarketStateWithWatchlist(symbols = watchlistStore.getWatchlist()) {
  const next = [];
  const nextIndex = new Map();
  symbols.forEach((symbol) => {
    const base = DEFAULT_WATCHLIST_LOOKUP.get(symbol);
    let entry = marketStateIndex.get(symbol) ?? extraSymbolData.get(symbol);
    if (!entry) {
      entry = base ? createMarketStateEntry(base) : createSymbolEntry(symbol, symbol);
    } else if (base) {
      entry.name = base.name;
      entry.sector = base.sector;
      entry.cap = base.cap;
    }
    next.push(entry);
    nextIndex.set(symbol, entry);
  });
  marketState = next;
  marketStateIndex = nextIndex;
  activeWatchlistSymbols = new Set(symbols);
}

function isSymbolInWatchlist(symbol) {
  return activeWatchlistSymbols.has(symbol);
}

syncMarketStateWithWatchlist();

function removeSymbolFromWatchlist(symbol, { watchlist = watchlistStore, favorites = favoritesStore } = {}) {
  const removed = watchlist.removeSymbol(symbol);
  if (removed) {
    favorites.removeSymbol(symbol);
  }
  return removed;
}

function applyCachedMarketData(symbol, entry, options = {}) {
  const resolvedEntry = entry ?? createSymbolEntry(symbol);
  const cachedQuote = getCachedQuote(symbol) ?? getLastKnownQuote(symbol);
  if (cachedQuote) {
    updateStockWithQuote(resolvedEntry, { ...cachedQuote, source: QUOTE_SOURCES.CACHED });
  }
  const cachedHistory = getCachedHistorical(symbol, options);
  if (cachedHistory) {
    updateStockWithHistorical(resolvedEntry, cachedHistory);
  }
  return resolvedEntry;
}

function updateQuoteCache(symbol, quote) {
  const ttl = getCacheTtl(quote.session);
  quoteCache.set(symbol, { quote, expiresAt: Date.now() + ttl });
}

function cacheHistorical(key, payload, ttlMs) {
  historicalCache.set(key, { payload, storedAt: Date.now(), ttlMs });
  persistHistoricalCache();
}

function getCachedHistorical(symbol, { range = "1mo", interval = "1d" } = {}) {
  const key = getHistoricalCacheKey(symbol, range, interval);
  const entry = historicalCache.get(key);
  const ttlMs = entry?.ttlMs ?? getHistoricalCacheTtl(range, interval);
  if (entry && Date.now() - entry.storedAt < ttlMs) {
    return entry.payload;
  }
  return null;
}

function isHistoricalStale(symbol, { range = "1mo", interval = "1d" } = {}) {
  const key = getHistoricalCacheKey(symbol, range, interval);
  const entry = historicalCache.get(key);
  const ttlMs = entry?.ttlMs ?? getHistoricalCacheTtl(range, interval);
  return !entry || Date.now() - entry.storedAt >= ttlMs;
}

async function fetchYahooQuotes(symbols, options = {}) {
  const uniqueSymbols = [...new Set(symbols)];
  if (!uniqueSymbols.length) {
    return { quotes: [], hadFailure: false, errors: [] };
  }
  const batchSize = options.batchSize ?? QUOTE_BATCH_SIZE;
  const batches = [];
  for (let i = 0; i < uniqueSymbols.length; i += batchSize) {
    batches.push(uniqueSymbols.slice(i, i + batchSize));
  }
  const recordStatus = ({ status, ok }) => {
    const timestamp = Date.now();
    uniqueSymbols.forEach((symbol) => {
      lastQuoteRequestStatus.set(symbol, { status, ok, timestamp });
    });
  };
  const results = await Promise.allSettled(
    batches.map(async (batch) => {
      const cacheBust = Date.now();
      const quoteUrl = YAHOO_QUOTE_URL(batch);
      const plan = [];
      if (isBrowser) {
        plan.push({
          url: QUOTE_PROXY_CHAIN[0].build(batch),
          provider: QUOTE_PROXY_CHAIN[0].label,
        });
      }
      if (!isBrowser) {
        plan.push({ url: quoteUrl, provider: PROVIDER });
      }
      plan.push(
        ...QUOTE_PROXY_CHAIN.slice(1).map((entry) => ({
          url: entry.build(quoteUrl, cacheBust),
          provider: entry.label,
        })),
      );
      const quoteData = await fetchJsonWithFallback(plan, {
        provider: PROVIDER,
        symbol: batch.join(","),
        fetchFn: options.fetchFn,
        maxAttempts: options.maxAttempts,
        timeoutMs: options.timeoutMs,
        onStatus: recordStatus,
      });
      const quoteResponse = quoteData?.quoteResponse;
      if (!quoteResponse || !Array.isArray(quoteResponse.result)) {
        throw new MarketDataError("provider_error", "Malformed quote response.", {
          hasQuoteResponse: Boolean(quoteResponse),
        });
      }
      return quoteResponse.result;
    }),
  );
  const quotes = [];
  const errors = [];
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      quotes.push(...result.value);
    } else {
      errors.push(result.reason);
    }
  });
  return { quotes, hadFailure: errors.length > 0, errors };
}

async function fetchHistoricalSeries(symbol, options = {}) {
  const range = options.range ?? "1mo";
  const interval = options.interval ?? "1d";
  const cached = getCachedHistorical(symbol, { range, interval });
  if (cached) {
    return cached;
  }
  const cacheKey = getHistoricalCacheKey(symbol, range, interval);
  const inflight = inflightHistoricalRequests.get(cacheKey);
  if (inflight) {
    return inflight;
  }
  const requestPromise = (async () => {
    const chartData = await fetchJson(YAHOO_CHART_URL(symbol, range, interval), {
      provider: PROVIDER,
      symbol,
      fetchFn: options.fetchFn,
      maxAttempts: options.maxAttempts,
      timeoutMs: options.timeoutMs,
    });
    const chart = chartData?.chart?.result?.[0];
    const { closes, timestamps } = extractCloseSeries(chart);
    const payload = { closes, timestamps };
    cacheHistorical(cacheKey, payload, getHistoricalCacheTtl(range, interval));
    return payload;
  })();
  inflightHistoricalRequests.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    inflightHistoricalRequests.delete(cacheKey);
  }
}

function deriveHistoricalQuote(closes, timestamps, sessionOverride = QUOTE_SESSIONS.CLOSED) {
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
    session: sessionOverride,
    previousClose: previous,
  };
}

function buildUnavailableQuote(lastKnown, sessionFallback = QUOTE_SESSIONS.CLOSED) {
  if (lastKnown) {
    return { ...lastKnown, source: QUOTE_SOURCES.CACHED, unavailable: true };
  }
  return {
    price: null,
    change: null,
    changePct: null,
    asOfTimestamp: null,
    isRealtime: false,
    session: sessionFallback,
    previousClose: null,
    source: QUOTE_SOURCES.CACHED,
    unavailable: true,
  };
}

async function getQuoteInternal(symbol, options = {}) {
  if (!isValidSymbol(symbol)) {
    throw new MarketDataError("invalid_symbol", "Invalid symbol format.");
  }
  const cachedQuote = getCachedQuote(symbol);
  if (cachedQuote && options.useCache !== false) {
    const normalized = normalizeQuote(
      {
        ...cachedQuote,
        source: QUOTE_SOURCES.CACHED,
        lastKnownSession: cachedQuote.session ?? null,
      },
      Date.now(),
    );
    return normalized
      ? {
          ...normalized,
          change: normalized.changeAbs,
          changePct: normalized.changePct,
          asOfTimestamp: normalized.asOfTs,
        }
      : { ...cachedQuote, source: QUOTE_SOURCES.CACHED };
  }

  let providerQuote = options.prefetchedQuote ?? null;
  let providerError = null;
  const lastKnown = getLastKnownQuote(symbol);
  if (!providerQuote && options.allowFetch !== false) {
    try {
      const { quotes } = await fetchYahooQuotes([symbol], options);
      providerQuote =
        quotes.find((entry) => entry.symbol?.toUpperCase?.() === symbol) ??
        quotes.find((entry) => entry.symbol === symbol) ??
        null;
      if (!providerQuote && quotes.length === 0) {
        providerError = new MarketDataError("unavailable", "Empty quote response.", {
          reason: "empty_quote",
        });
        logMarketDataEvent("warn", {
          event: "market_data_quote_empty",
          provider: PROVIDER,
          symbol,
          endpoint: YAHOO_QUOTE_URL([symbol]),
        });
      }
    } catch (error) {
      providerError = error;
      if (shouldBackoffFromStatus(error?.details?.statusCode)) {
        applyRateLimitBackoff();
      }
    }
  }

  if (!providerQuote && !providerError && options.allowFetch !== false) {
    providerError = new MarketDataError("unavailable", "No quote data returned for symbol.");
  }

  if (!providerQuote && options.forceUnavailable) {
    return buildUnavailableQuote(lastKnown);
  }

  if (providerQuote) {
    const normalized = normalizeQuote(
      {
        ...providerQuote,
        lastKnownSession: lastKnown?.session ?? null,
      },
      Date.now(),
    );
    if (normalized) {
      const fullQuote = {
        ...normalized,
        change: normalized.changeAbs,
        changePct: normalized.changePct,
        asOfTimestamp: normalized.asOfTs,
      };
      logYahooQuoteDebug(providerQuote, fullQuote.session, fullQuote.source);
      updateQuoteCache(symbol, fullQuote);
      setLastKnownQuote(symbol, fullQuote);
      return fullQuote;
    }
  }

  if (providerError instanceof MarketDataError && providerError.type === "invalid_symbol") {
    throw providerError;
  }

  if (providerError?.details?.reason === "empty_quote" && lastKnown) {
    return buildUnavailableQuote(lastKnown);
  }

  if (lastKnown) {
    const normalized = normalizeQuote(
      { ...lastKnown, source: QUOTE_SOURCES.CACHED, lastKnownSession: lastKnown.session ?? null },
      Date.now(),
    );
    return normalized
      ? {
          ...normalized,
          change: normalized.changeAbs,
          changePct: normalized.changePct,
          asOfTimestamp: normalized.asOfTs,
        }
      : { ...lastKnown, source: QUOTE_SOURCES.CACHED };
  }

  try {
    const historical = await fetchHistoricalSeries(symbol, options);
    const derived = deriveHistoricalQuote(historical.closes, historical.timestamps, QUOTE_SESSIONS.CLOSED);
    if (derived) {
      const normalized = normalizeQuote(
        {
          ...derived,
          source: QUOTE_SOURCES.LAST_CLOSE,
          lastKnownSession: lastKnown?.session ?? null,
        },
        Date.now(),
      );
      const fullQuote = normalized
        ? {
            ...normalized,
            change: normalized.changeAbs,
            changePct: normalized.changePct,
            asOfTimestamp: normalized.asOfTs,
          }
        : {
            ...derived,
            source: QUOTE_SOURCES.LAST_CLOSE,
          };
      if (providerError?.details?.reason === "empty_quote") {
        fullQuote.unavailable = true;
      }
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

async function getQuote(symbol, options = {}) {
  if (options.allowFetch === false || options.prefetchedQuote || options.dedupe === false) {
    return getQuoteInternal(symbol, options);
  }
  const inflight = inflightQuoteRequests.get(symbol);
  if (inflight) {
    return inflight;
  }
  const requestPromise = getQuoteInternal(symbol, options);
  inflightQuoteRequests.set(symbol, requestPromise);
  try {
    return await requestPromise;
  } finally {
    inflightQuoteRequests.delete(symbol);
  }
}

async function loadInitialMarketData() {
  const symbols = marketState.map((stock) => stock.symbol);
  let hadQuoteFailure = false;
  let quoteResults = [];
  let quoteErrors = [];
  let forceUnavailable = false;
  try {
    const batchResult = await fetchYahooQuotes(symbols);
    quoteResults = batchResult.quotes;
    quoteErrors = batchResult.errors;
    forceUnavailable = quoteResults.length === 0 && symbols.length > 0;
    if (forceUnavailable || batchResult.hadFailure) {
      hadQuoteFailure = true;
    }
  } catch (error) {
    hadQuoteFailure = true;
    logMarketDataEvent("warn", {
      event: "market_data_initial_failure",
      provider: PROVIDER,
      symbol: symbols.join(","),
      errorType: error.type ?? "unknown",
      message: error.message ?? "Quote fetch failed.",
    });
  }
  const quoteMap = new Map(quoteResults.map((quote) => [quote.symbol, quote]));
  const results = await refreshSymbolsWithLimiter(symbols, (symbol) => {
    const prefetchedQuote = quoteMap.get(symbol) ?? null;
    return {
      prefetchedQuote,
      allowFetch: !prefetchedQuote,
      forceUnavailable,
      includeHistorical: true,
      range: MARKET_HISTORY_RANGE,
      interval: MARKET_HISTORY_INTERVAL,
    };
  });
  results.forEach((result) => {
    if (result?.error || result?.hadQuoteFailure) {
      hadQuoteFailure = true;
    }
  });
  if (quoteErrors.length) {
    hadQuoteFailure = true;
  }

  marketIndicatorState.usingCached = hadQuoteFailure;
}

async function loadSymbolSnapshot(symbol, options = {}) {
  let quote = null;
  let historyPayload = null;
  const cachedEntry = getStockEntry(symbol);
  const hasCachedData = Boolean(cachedEntry?.lastPrice || cachedEntry?.history?.length);

  const range = options.range ?? "1mo";
  const interval = options.interval ?? "1d";
  const perf = options.perf;
  let quoteSettled = false;

  const quotePromise = (async () => {
    perf?.start?.("fetchQuote");
    try {
      return await getQuote(symbol, options);
    } finally {
      quoteSettled = true;
      perf?.end?.("fetchQuote");
    }
  })();
  const historyPromise = (async () => {
    perf?.start?.("fetchHistory");
    try {
      return await fetchHistoricalSeries(symbol, { ...options, range, interval });
    } finally {
      perf?.end?.("fetchHistory");
    }
  })();

  let fallbackTimerId = null;
  if (options.onIntermediateSnapshot && options.fastFallback !== false) {
    const fallbackMs = options.fastFallbackMs ?? QUOTE_FAST_FALLBACK_MS;
    fallbackTimerId = setTimeout(() => {
      if (quoteSettled) {
        return;
      }
      const fallbackEntry = applyCachedMarketData(symbol, cachedEntry ?? null, {
        range,
        interval,
      });
      if (hasAnyMarketData(fallbackEntry)) {
        options.onIntermediateSnapshot({
          status: QUOTE_SOURCES.CACHED,
          entry: fallbackEntry,
          dataSource: fallbackEntry.dataSource ?? QUOTE_SOURCES.CACHED,
        });
      }
    }, fallbackMs);
  }

  let quoteError = null;
  let historyError = null;
  const [quoteResult, historyResult] = await Promise.allSettled([quotePromise, historyPromise]);
  if (fallbackTimerId) {
    clearTimeout(fallbackTimerId);
  }

  if (quoteResult.status === "fulfilled") {
    quote = quoteResult.value;
  } else {
    quoteError = quoteResult.reason;
  }
  if (historyResult.status === "fulfilled") {
    historyPayload = historyResult.value;
  } else {
    historyError = historyResult.reason;
  }

  if (quoteError) {
    if (quoteError.type === "invalid_symbol") {
      throw quoteError;
    }
    logMarketDataEvent("warn", {
      event: "market_data_quote_failure",
      provider: PROVIDER,
      symbol,
      errorType: quoteError.type ?? "unknown",
      message: quoteError.message ?? "Quote fetch failed.",
    });
  }

  if (historyError) {
    logMarketDataEvent("warn", {
      event: "market_data_chart_failure",
      provider: PROVIDER,
      symbol,
      errorType: historyError.type ?? "unknown",
      message: historyError.message ?? "Chart fetch failed.",
    });
  }

  if (!quote && !historyPayload) {
    if (hasCachedData) {
      return { status: QUOTE_SOURCES.CACHED, entry: cachedEntry };
    }
    throw new MarketDataError("unavailable", "Quote and chart requests failed.");
  }

  const entry = extraSymbolData.get(symbol) ?? createSymbolEntry(symbol, quote?.name ?? symbol);

  if (quote) {
    updateStockWithQuote(entry, quote);
  }
  if (historyPayload) {
    updateStockWithHistorical(entry, historyPayload);
  }

  extraSymbolData.set(symbol, entry);
  const status = quote?.unavailable ? "unavailable" : quote?.source ?? entry.dataSource ?? QUOTE_SOURCES.CACHED;
  return { status, entry, dataSource: entry.dataSource ?? status };
}

function getMarketFilterValues() {
  return {
    search: filterSearch?.value ?? "",
    sector: filterSector?.value ?? "all",
    cap: filterCap?.value ?? "all",
    signal: filterSignal?.value ?? "all",
    min: Number(filterMin?.value ?? ""),
    max: Number(filterMax?.value ?? ""),
    minMonth: Number(filterMonth?.value ?? ""),
  };
}

function clearMarketFilters() {
  if (filterSearch) {
    filterSearch.value = "";
  }
  if (filterSector) {
    filterSector.value = "all";
  }
  if (filterCap) {
    filterCap.value = "all";
  }
  if (filterSignal) {
    filterSignal.value = "all";
  }
  if (filterMin) {
    filterMin.value = "";
  }
  if (filterMax) {
    filterMax.value = "";
  }
  if (filterMonth) {
    filterMonth.value = "";
  }
  if (filterFavorites) {
    filterFavorites.checked = false;
  }
}

function matchesFilters(stock, filters = getMarketFilterValues()) {
  const searchValue = (filters.search ?? "").trim().toUpperCase();
  const sectorValue = filters.sector ?? "all";
  const capValue = filters.cap ?? "all";
  const signalValue = filters.signal ?? "all";
  const minValue = Number(filters.min);
  const maxValue = Number(filters.max);
  const minMonthValue = Number(filters.minMonth);
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
  return true;
}

function applyMarketFilters(entries, options = {}) {
  const favoritesOnly = options.favoritesOnly === true;
  const favoritesRaw = options.favorites ?? [];
  const favoritesSet = favoritesRaw instanceof Set ? favoritesRaw : new Set(favoritesRaw);
  const filters = options.filters ?? getMarketFilterValues();
  const favoritesFiltered = favoritesOnly
    ? entries.filter((entry) => favoritesSet.has(entry.symbol))
    : entries;
  return favoritesFiltered.filter((entry) => matchesFilters(entry, filters));
}

function getFilteredMarketEntries() {
  const favoritesOnly = filterFavorites?.checked ?? false;
  const favorites = favoritesStore.getFavorites();
  const filters = getMarketFilterValues();
  return applyMarketFilters(marketState, { favoritesOnly, favorites, filters });
}

function getQuoteStatusSummary(symbols) {
  const counts = { ok: 0, error: 0, unknown: 0 };
  symbols.forEach((symbol) => {
    const status = lastQuoteRequestStatus.get(symbol);
    if (!status) {
      counts.unknown += 1;
    } else if (status.ok) {
      counts.ok += 1;
    } else {
      counts.error += 1;
    }
  });
  return counts;
}

function logMarketSummary({ filteredCount, totalCount } = {}) {
  if (!MARKET_DEBUG_ENABLED) {
    return;
  }
  const symbols = watchlistStore.getWatchlist();
  console.info("[Market Debug]", {
    stage: "render",
    watchlistCount: symbols.length,
    marketStateCount: totalCount,
    filteredCount,
    quoteStatus: getQuoteStatusSummary(symbols),
  });
}

function getVisibleSymbols() {
  const filtered = getFilteredMarketEntries();
  return filtered.length ? filtered.map((stock) => stock.symbol) : marketState.map((stock) => stock.symbol);
}

function isAwaitingQuote(stock) {
  if (!stock) {
    return true;
  }
  return !hasAnyMarketData(stock);
}

async function refreshSymbolData(symbol, options = {}) {
  if (!isSymbolInWatchlist(symbol)) {
    return { symbol, status: "removed" };
  }
  const stock = getStockEntry(symbol);
  if (!stock) {
    return { symbol, status: "missing" };
  }
  const startedAt = Date.now();
  logMarketDebug(symbol, "fetch_start", {
    hasPrefetch: Boolean(options.prefetchedQuote),
    allowFetch: options.allowFetch,
    includeHistorical: options.includeHistorical,
    awaiting: isAwaitingQuote(stock),
  });

  let quote = null;
  let historyPayload = null;
  let quoteError = null;
  let quoteErrorType = null;

  try {
    quote = await getQuote(symbol, options);
    if (quote && isSymbolInWatchlist(symbol)) {
      updateStockWithQuote(stock, quote);
    }
  } catch (error) {
    quoteError = error;
    quoteErrorType = error?.type ?? "unknown";
    if (error?.type === "invalid_symbol") {
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

  if (options.includeHistorical) {
    try {
      historyPayload = await fetchHistoricalSeries(symbol, options);
      if (isSymbolInWatchlist(symbol)) {
        updateStockWithHistorical(stock, historyPayload);
      }
    } catch (error) {
      logMarketDataEvent("warn", {
        event: "market_data_chart_failure",
        provider: PROVIDER,
        symbol,
        errorType: error.type ?? "unknown",
        message: error.message ?? "Chart fetch failed.",
      });
    }
  }

  if (!hasAnyMarketData(stock) && quoteError) {
    stock.quoteUnavailable = true;
    stock.dataSource = QUOTE_SOURCES.UNAVAILABLE;
    stock.quoteSession = QUOTE_SESSIONS.CLOSED;
  }

  const display = getMarketRowDisplay(stock);
  logMarketDebug(symbol, "fetch_end", {
    durationMs: Date.now() - startedAt,
    quoteSource: quote?.source ?? null,
    fallback: quote ? getQuoteFallbackLabel(quote) : historyPayload ? "historical" : "unavailable",
    quoteError: quoteError?.type ?? null,
    rendered: {
      price: display.priceDisplay,
      change: display.changeDisplay,
      change1d: display.dayDisplay,
      change1m: display.monthDisplay,
      change1y: display.yearDisplay,
      meta: display.meta,
    },
  });

  return { symbol, quote, historyPayload, hadQuoteFailure: Boolean(quoteError), quoteErrorType };
}

async function refreshSymbolsWithLimiter(symbols, getOptions) {
  const tasks = symbols.map((symbol) =>
    symbolRefreshLimiter(() => refreshSymbolData(symbol, getOptions(symbol))).catch((error) => ({
      symbol,
      error,
    })),
  );
  const results = await Promise.allSettled(tasks);
  return results.map((result) => (result.status === "fulfilled" ? result.value : { error: result.reason }));
}

async function refreshVisibleQuotes() {
  const symbols = getVisibleSymbols();
  const summary = {
    symbolsCount: symbols.length,
    okCount: 0,
    errorCount: 0,
    hadQuoteFailure: false,
    error: null,
    errorTypes: [],
  };
  const symbolsToFetch = symbols.filter((symbol) => {
    if (!isSymbolInWatchlist(symbol)) {
      return false;
    }
    const stock = getStockEntry(symbol);
    if (isAwaitingQuote(stock)) {
      return true;
    }
    if (isQuoteFresh(symbol)) {
      return false;
    }
    const session = stock?.quoteSession ?? getLastKnownEntry(symbol)?.quote?.session ?? "CLOSED";
    return !isQuoteFreshForInterval(symbol, session);
  });
  if (!symbolsToFetch.length) {
    renderMarketTable();
    return summary;
  }

  let hadQuoteFailure = false;
  let quoteResults = [];
  let forceUnavailable = false;
  let bulkError = null;
  try {
    const batchResult = await fetchYahooQuotes(symbolsToFetch);
    quoteResults = batchResult.quotes;
    forceUnavailable = quoteResults.length === 0 && symbolsToFetch.length > 0;
    if (forceUnavailable || batchResult.hadFailure) {
      hadQuoteFailure = true;
      summary.errorTypes.push(
        ...batchResult.errors.map((error) => error?.type ?? "unknown").filter(Boolean),
      );
    }
  } catch (error) {
    bulkError = error;
    hadQuoteFailure = true;
    summary.errorTypes.push(error?.type ?? "unknown");
    if (shouldBackoffFromStatus(error?.details?.statusCode)) {
      applyRateLimitBackoff();
    }
    logMarketDataEvent("warn", {
      event: "market_data_refresh_failure",
      provider: PROVIDER,
      symbol: symbolsToFetch.join(","),
      errorType: error.type ?? "unknown",
      message: error.message,
    });
  }

  const quoteMap = new Map(quoteResults.map((quote) => [quote.symbol, quote]));
  const results = await refreshSymbolsWithLimiter(symbolsToFetch, (symbol) => {
    const prefetchedQuote = quoteMap.get(symbol) ?? null;
    return {
      prefetchedQuote,
      allowFetch: !prefetchedQuote,
      forceUnavailable,
      includeHistorical: false,
    };
  });
  results.forEach((result) => {
    if (result?.error || result?.hadQuoteFailure) {
      hadQuoteFailure = true;
      summary.errorCount += 1;
      if (result?.quoteErrorType) {
        summary.errorTypes.push(result.quoteErrorType);
      }
      if (result?.error?.type) {
        summary.errorTypes.push(result.error.type);
      }
    }
    if (result?.quote) {
      summary.okCount += 1;
    }
  });
  if (bulkError && isRateLimitBackoffActive()) {
    logMarketDebug("bulk", "backoff_active", { until: rateLimitBackoffUntil });
  }
  marketIndicatorState.usingCached = hadQuoteFailure;
  summary.hadQuoteFailure = hadQuoteFailure;
  summary.error = bulkError ?? (hadQuoteFailure ? results.find((result) => result?.error)?.error : null);

  await Promise.all(
    symbols
      .filter(
        (symbol) =>
          isSymbolInWatchlist(symbol) &&
          isHistoricalStale(symbol, { range: MARKET_HISTORY_RANGE, interval: MARKET_HISTORY_INTERVAL }),
      )
      .map(async (symbol) => {
        try {
          const historyPayload = await fetchHistoricalSeries(symbol, {
            range: MARKET_HISTORY_RANGE,
            interval: MARKET_HISTORY_INTERVAL,
          });
          const stock = getStockEntry(symbol);
          if (stock && isSymbolInWatchlist(symbol)) {
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
  return summary;
}

function formatIntervalLabel(intervalMs) {
  if (intervalMs >= 60 * 1000) {
    const minutes = Math.round(intervalMs / 60000);
    return `${minutes}m`;
  }
  const seconds = Math.round(intervalMs / 1000);
  return `${seconds}s`;
}

function formatElapsedLabel(elapsedMs) {
  if (elapsedMs == null) {
    return "just now";
  }
  if (elapsedMs < 60 * 1000) {
    return `${Math.max(1, Math.round(elapsedMs / 1000))}s`;
  }
  if (elapsedMs < 60 * 60 * 1000) {
    return `${Math.round(elapsedMs / 60000)}m`;
  }
  return `${Math.round(elapsedMs / 3600000)}h`;
}

function setQuoteStatusBanner(message, options = {}) {
  if (!quoteStatusBanner || !quoteStatusMessage) {
    return;
  }
  if (!message) {
    quoteStatusBanner.classList.add("hidden");
    quoteStatusBanner.dataset.reason = "";
    quoteStatusMessage.textContent = "";
    return;
  }
  quoteStatusBanner.classList.remove("hidden");
  quoteStatusMessage.textContent = message;
  if (options.reason) {
    quoteStatusBanner.dataset.reason = options.reason;
  }
}

function getQuoteFailureMessage(errorType) {
  if (errorType === "cors") {
    return "Live quotes unavailable (CORS/proxy). Showing cached/last close.";
  }
  if (errorType === "rate_limit") {
    return "Live quotes unavailable (rate limit). Showing cached/last close.";
  }
  if (errorType === "invalid_symbol") {
    return "Live quotes unavailable (invalid symbol). Showing cached/last close.";
  }
  if (errorType === "timeout") {
    return "Live quotes unavailable (timeout). Showing cached/last close.";
  }
  return "Live quotes unavailable (network). Showing cached/last close.";
}

function setRefreshState(partial) {
  Object.assign(refreshState, partial);
  updateRefreshStatus();
}

function updateRefreshStatus() {
  if (!refreshStatus) {
    return;
  }
  if (!isPageVisible()) {
    refreshStatus.textContent = "Updates paused";
    refreshPill?.classList?.remove("loading", "ok", "error");
    return;
  }
  if (refreshState.status === "loading") {
    refreshStatus.textContent = "Loading…";
    refreshPill?.classList?.remove("ok", "error");
    refreshPill?.classList?.add("loading");
    return;
  }
  if (refreshState.status === "error") {
    refreshStatus.textContent = "Error (tap for details)";
    refreshPill?.classList?.remove("ok", "loading");
    refreshPill?.classList?.add("error");
    return;
  }
  const lastSuccess = refreshState.lastSuccessTs;
  if (lastSuccess) {
    const elapsed = Date.now() - lastSuccess;
    refreshStatus.textContent = `Updated ${formatElapsedLabel(elapsed)} ago`;
    refreshPill?.classList?.remove("loading", "error");
    refreshPill?.classList?.add("ok");
    return;
  }
  refreshStatus.textContent = "Idle";
  refreshPill?.classList?.remove("loading", "error");
  refreshPill?.classList?.add("ok");
}

async function withTimeout(promise, timeoutMs) {
  let timeoutId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new MarketDataError("timeout", "Refresh cycle timed out."));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

async function runRefreshCycle({ timeoutMs = REFRESH_TIMEOUT_MS, refreshFn = refreshVisibleQuotes } = {}) {
  const startedAt = Date.now();
  setRefreshState({ status: "loading", lastAttemptTs: startedAt, lastError: null });
  setQuoteStatusBanner(null);
  let summary = null;
  let error = null;
  try {
    summary = await withTimeout(refreshFn(), timeoutMs);
  } catch (err) {
    error = err instanceof MarketDataError ? err : new MarketDataError("unavailable", err?.message ?? "Refresh failed.");
  }

  if (summary) {
    lastRefreshSummary = {
      okCount: summary.okCount,
      errorCount: summary.errorCount,
      lastError: summary.error ?? null,
    };
  }

  const hadFailure = summary?.hadQuoteFailure === true || Boolean(error);
  if (hadFailure) {
    const errorType = error?.type ?? summary?.errorTypes?.[0] ?? summary?.error?.type ?? "network_error";
    const message = getQuoteFailureMessage(errorType);
    setRefreshState({
      status: error ? "error" : summary?.okCount ? "ok" : "error",
      lastError: error ?? summary?.error ?? null,
      lastSuccessTs: summary?.okCount ? Date.now() : refreshState.lastSuccessTs,
    });
    setQuoteStatusBanner(message, { reason: errorType });
  } else {
    setRefreshState({ status: "ok", lastSuccessTs: Date.now(), lastError: null });
    setQuoteStatusBanner(null);
  }
  updateMarketDebugReadout({ filteredCount: getFilteredMarketEntries().length });
  return { summary, error };
}

async function triggerImmediateRefresh() {
  if (!isBrowser) {
    return;
  }
  if (refreshTimerId) {
    clearTimeout(refreshTimerId);
  }
  if (refreshInProgress) {
    return;
  }
  refreshInProgress = true;
  try {
    await runRefreshCycle();
  } finally {
    refreshInProgress = false;
    scheduleNextMarketRefresh();
  }
}

function resetRefreshState() {
  refreshState.status = "idle";
  refreshState.lastAttemptTs = null;
  refreshState.lastSuccessTs = null;
  refreshState.lastError = null;
  lastRefreshSummary = { okCount: 0, errorCount: 0, lastError: null };
  updateRefreshStatus();
}

function getRefreshState() {
  return { ...refreshState };
}

function getLastRefreshSummary() {
  return { ...lastRefreshSummary };
}

function scheduleNextMarketRefresh(delayOverride) {
  if (!isBrowser) {
    return;
  }
  if (refreshTimerId) {
    clearTimeout(refreshTimerId);
  }
  if (!isPageVisible()) {
    updateRefreshStatus();
    return;
  }
  const symbols = getVisibleSymbols();
  const interval = delayOverride ?? getEffectiveRefreshInterval(symbols);
  updateRefreshStatus();
  refreshTimerId = setTimeout(async () => {
    if (!isPageVisible()) {
      updateRefreshStatus();
      return;
    }
    if (refreshInProgress) {
      scheduleNextMarketRefresh();
      return;
    }
    refreshInProgress = true;
    try {
      await runRefreshCycle();
    } finally {
      refreshInProgress = false;
    }
    scheduleNextMarketRefresh();
  }, interval);
}

function handleVisibilityChange() {
  if (!isPageVisible()) {
    if (refreshTimerId) {
      clearTimeout(refreshTimerId);
    }
    updateRefreshStatus();
    return;
  }
  scheduleNextMarketRefresh(0);
}

function hasAnyMarketData(stock) {
  return Boolean(
    stock &&
      (stock.lastPrice !== null ||
        (stock.history && stock.history.length > 0) ||
        stock.previousClose !== null ||
        stock.quoteAsOf !== null ||
        stock.lastHistoricalTimestamp !== null),
  );
}

function getMarketRowDisplay(stock) {
  const hasAnyData = hasAnyMarketData(stock);
  const isUnavailable = stock?.quoteUnavailable === true || stock?.dataSource === QUOTE_SOURCES.UNAVAILABLE;
  const computedChange =
    stock.lastPrice !== null && stock.previousClose !== null
      ? stock.lastPrice - stock.previousClose
      : null;
  const change = stock.lastChange ?? computedChange;
  const changePercent =
    stock.lastChangePct ??
    (computedChange !== null && stock.previousClose !== null
      ? (computedChange / stock.previousClose) * 100
      : null);
  const priceDisplay =
    stock.lastPrice !== null
      ? quoteFormatter.format(stock.lastPrice)
      : hasAnyData || isUnavailable
        ? "Price unavailable"
        : "—";
  const source = stock.dataSource ?? QUOTE_SOURCES.CACHED;
  const session = stock.quoteSession ?? QUOTE_SESSIONS.CLOSED;
  const sourceBadge = hasAnyData || isUnavailable ? getSourceBadge(source) : null;
  const sessionBadge = hasAnyData ? getSessionBadgeForSession(session) : null;
  const showWarning =
    stock.lastPrice !== null &&
    (stock.quoteWarnings?.includes?.(CACHE_WARNING_MESSAGE) || shouldShowCacheWarning(session, source));
  const meta = hasAnyData
    ? `As of ${formatAsOf(
        stock.quoteAsOf || stock.lastUpdatedAt || stock.lastHistoricalTimestamp,
        { tz: "UTC" },
      )}`
    : isUnavailable
      ? "Quote unavailable"
      : "Loading…";
  const changeDisplay =
    change !== null && changePercent !== null
      ? `${change >= 0 ? "+" : ""}${change.toFixed(2)} (${change >= 0 ? "+" : ""}${percentFormatter.format(
          changePercent,
        )}%)`
      : changePercent !== null
        ? `${changePercent >= 0 ? "+" : ""}${percentFormatter.format(changePercent)}%`
        : hasAnyData || isUnavailable
          ? "n/a"
          : "—";
  const changeClass = change === null ? "" : change >= 0 ? "positive" : "negative";
  const dailyChange = stock.dailyChange ?? getLiveChangePercent(stock);
  const dayDisplay = hasAnyData ? formatPercent(dailyChange) : isUnavailable ? "n/a" : "—";
  const monthDisplay = hasAnyData ? formatPercent(stock.monthlyChange) : isUnavailable ? "n/a" : "—";
  const yearDisplay = hasAnyData ? formatPercent(stock.yearlyChange) : isUnavailable ? "n/a" : "—";

  return {
    priceDisplay,
    sourceBadge,
    sessionBadge,
    showWarning,
    meta,
    changeDisplay,
    changeClass,
    dayDisplay,
    monthDisplay,
    yearDisplay,
    dayClass: dailyChange === null ? "" : dailyChange >= 0 ? "positive" : "negative",
    monthClass: stock.monthlyChange === null ? "" : stock.monthlyChange >= 0 ? "positive" : "negative",
    yearClass: stock.yearlyChange === null ? "" : stock.yearlyChange >= 0 ? "positive" : "negative",
  };
}

function ensureSortControl() {
  if (!isBrowser || sortBySelect) {
    return sortBySelect;
  }
  const filters = document.querySelector(".filters");
  if (!filters) {
    return null;
  }
  const label = document.createElement("label");
  label.className = "sort-control";
  const options = MARKET_SORT_OPTIONS.map(
    (option) => `<option value="${option.value}">${option.label}</option>`,
  ).join("");
  label.innerHTML = `
    Sort by
    <select id="sort-by">${options}</select>
  `;
  filters.appendChild(label);
  sortBySelect = label.querySelector("select");
  if (sortBySelect) {
    sortBySelect.value = DEFAULT_SORT_KEY;
  }
  return sortBySelect;
}

function getLiveChangePercent(stock) {
  if (!stock) {
    return null;
  }
  if (typeof stock.lastChangePct === "number") {
    return stock.lastChangePct;
  }
  if (stock.lastPrice != null && stock.previousClose != null) {
    return ((stock.lastPrice - stock.previousClose) / stock.previousClose) * 100;
  }
  return null;
}

function getSignalScoreForStock(stock) {
  if (!stock) {
    return null;
  }
  const prices = stock.history ?? [];
  const recent = stock.lastPrice ?? (prices.length ? prices[prices.length - 1] : null);
  if (recent == null) {
    return null;
  }
  const indicators = computeIndicators ? computeIndicators(prices) : null;
  return calculateSignalScore({ prices, price: recent, indicators }).total;
}

function getSignalConfidenceForStock(stock, action) {
  if (!stock) {
    return null;
  }
  const prices = stock.history ?? [];
  const recent = stock.lastPrice ?? (prices.length ? prices[prices.length - 1] : null);
  const indicators = computeIndicators ? computeIndicators(prices) : null;
  const signalResult = scoreSignal ? scoreSignal(indicators, { price: recent }) : null;
  const confidence = calculateSignalConfidence({
    prices,
    price: recent,
    indicators,
    signalResult,
  });
  return confidence?.score ?? null;
}

function getSortValue(stock, sortKey) {
  switch (sortKey) {
    case "change1d":
      return stock.dailyChange ?? null;
    case "change1m":
      return stock.monthlyChange ?? null;
    case "change1y":
      return stock.yearlyChange ?? null;
    case "liveChange":
      return getLiveChangePercent(stock);
    case "signal":
    default:
      return getSignalScoreForStock(stock);
  }
}

function sortMarketEntries(entries, sortKey = DEFAULT_SORT_KEY) {
  const keyed = entries.map((stock, index) => ({
    stock,
    index,
    value: getSortValue(stock, sortKey),
  }));
  keyed.sort((a, b) => {
    const aMissing = a.value == null || Number.isNaN(a.value);
    const bMissing = b.value == null || Number.isNaN(b.value);
    if (aMissing && bMissing) {
      return a.index - b.index;
    }
    if (aMissing) {
      return 1;
    }
    if (bMissing) {
      return -1;
    }
    if (b.value !== a.value) {
      return b.value - a.value;
    }
    return a.index - b.index;
  });
  return keyed.map((entry) => entry.stock);
}

function compareScoreConfidence(a, b) {
  const aScore = a.score ?? -Infinity;
  const bScore = b.score ?? -Infinity;
  if (bScore !== aScore) {
    return bScore - aScore;
  }
  const aConfidence = a.confidence ?? -Infinity;
  const bConfidence = b.confidence ?? -Infinity;
  if (bConfidence !== aConfidence) {
    return bConfidence - aConfidence;
  }
  return a.stock.symbol.localeCompare(b.stock.symbol);
}

function buildTopOpportunitiesGroups(entries) {
  const safeEntries = Array.isArray(entries) ? [...entries] : [];
  const decorated = safeEntries.map((stock) => {
    const signal = calculateSignal(stock.history);
    const score = getSignalScoreForStock(stock);
    const confidence = getSignalConfidenceForStock(stock, signal);
    const dailyChange = stock.dailyChange ?? getLiveChangePercent(stock);
    return {
      stock,
      signal,
      score,
      confidence,
      dailyChange,
    };
  });

  const buy = decorated
    .filter((entry) => entry.signal === "buy")
    .sort(compareScoreConfidence)
    .slice(0, 3);
  const sell = decorated
    .filter((entry) => entry.signal === "sell")
    .sort(compareScoreConfidence)
    .slice(0, 3);
  const movers = decorated
    .filter((entry) => Number.isFinite(entry.dailyChange))
    .sort((a, b) => Math.abs(b.dailyChange) - Math.abs(a.dailyChange))
    .slice(0, 3);

  return { buy, sell, movers };
}

function createMarketRowSkeleton(stock) {
  if (!isBrowser) {
    return null;
  }
  const row = document.createElement("tr");
  row.className = "market-row";
  row.dataset.symbol = stock.symbol;
  row.tabIndex = 0;
  row.setAttribute("role", "button");
  row.setAttribute("aria-label", `Analyze ${stock.symbol}`);
  row.innerHTML = buildMarketRowMarkup();
  return row;
}

function getMarketTableColumnKeys() {
  return MARKET_TABLE_COLUMNS.map((column) => column.key);
}

function buildMarketRowMarkup() {
  return MARKET_TABLE_COLUMNS.map((column) => {
    const className = column.className ? ` class="${column.className}"` : "";
    return `<td data-col="${column.key}"${className}></td>`;
  }).join("");
}

function validateMarketTableStructure(table) {
  if (!table) {
    return null;
  }
  const headerCount = table.querySelectorAll("thead th").length;
  const expectedCount = MARKET_TABLE_COLUMNS.length;
  if (headerCount !== expectedCount) {
    console.warn(
      `[market-table] Header column count ${headerCount} does not match expected ${expectedCount}.`,
    );
  }
  table.querySelectorAll("tbody tr").forEach((row) => {
    if (row.querySelector("td[colspan]")) {
      return;
    }
    const cellCount = row.querySelectorAll("td").length;
    if (cellCount !== headerCount) {
      console.warn(
        `[market-table] Row ${row.dataset.symbol ?? "unknown"} has ${cellCount} cells (expected ${headerCount}).`,
      );
    }
  });
  return { headerCount, expectedCount };
}

const HEATMAP_CLASSNAMES = [
  "price-change",
  "positive",
  "negative",
  "num-cell",
];

function ensureActionsCellClean(cell) {
  if (!cell) {
    return;
  }
  if (cell.classList) {
    HEATMAP_CLASSNAMES.forEach((className) => cell.classList.remove(className));
    cell.classList.add("actions-cell");
  } else if (typeof cell.className === "string") {
    const filtered = cell.className
      .split(/\s+/)
      .filter((className) => className && !HEATMAP_CLASSNAMES.includes(className));
    if (!filtered.includes("actions-cell")) {
      filtered.push("actions-cell");
    }
    cell.className = filtered.join(" ");
  }
  if (cell.style) {
    cell.style.background = "";
    cell.style.backgroundColor = "";
    if (typeof cell.style.removeProperty === "function") {
      cell.style.removeProperty("background");
      cell.style.removeProperty("background-color");
    }
  }
}

function updateMarketRowCells(row, stock) {
  if (!row || !stock) {
    return;
  }
  const signal = calculateSignal(stock.history);
  const timeHorizon = calculateTimeHorizon(stock.history);
  const {
    priceDisplay,
    sourceBadge,
    sessionBadge,
    showWarning,
    meta,
    changeDisplay,
    changeClass,
    dayDisplay,
    dayClass,
    monthDisplay,
    monthClass,
    yearDisplay,
    yearClass,
  } = getMarketRowDisplay(stock);

  const symbolCell = row.querySelector('[data-col="symbol"]');
  const companyCell = row.querySelector('[data-col="company"]');
  const sectorCell = row.querySelector('[data-col="sector"]');
  const capCell = row.querySelector('[data-col="cap"]');
  const signalCell = row.querySelector('[data-col="signal"]');
  const horizonCell = row.querySelector('[data-col="horizon"]');
  const priceCell = row.querySelector('[data-col="price"]');
  const perfCell = row.querySelector('[data-col="perf"]');
  const actionsCell = row.querySelector('[data-col="actions"]');
  const favoriteCell = row.querySelector('[data-col="favorite"]');

  const isFavorite = favoritesStore.isFavorite(stock.symbol);

  if (symbolCell) {
    symbolCell.textContent = stock.symbol;
  }
  if (favoriteCell) {
    favoriteCell.innerHTML = `
      <button
        type="button"
        class="icon-button favorite-toggle ${isFavorite ? "active" : ""}"
        data-action="favorite"
        data-symbol="${stock.symbol}"
        aria-label="${isFavorite ? "Remove from favorites" : "Add to favorites"}"
        aria-pressed="${isFavorite}"
      >
        ${isFavorite ? "★" : "☆"}
      </button>
    `;
  }
  if (companyCell) {
    companyCell.textContent = stock.name;
    companyCell.title = stock.name;
  }
  if (sectorCell) {
    sectorCell.textContent = stock.sector;
    sectorCell.title = stock.sector;
  }
  if (capCell) {
    capCell.textContent = stock.cap;
  }
  if (signalCell) {
    signalCell.innerHTML = `<span class="signal-pill ${signal}">${signal}</span>`;
  }
  if (horizonCell) {
    horizonCell.innerHTML = `
      <span class="badge horizon-badge" title="${timeHorizon.label}">${timeHorizon.shortLabel}</span>
    `;
  }
  if (priceCell) {
    priceCell.innerHTML = `
      <div class="price-cell">
        <div class="price-main">
          <span>${priceDisplay}</span>
          ${
            sourceBadge
              ? `<span class="session-badge ${sourceBadge.className}" title="${sourceBadge.tooltip}">${sourceBadge.label}</span>`
              : ""
          }
          ${
            sessionBadge
              ? `<span class="session-badge ${sessionBadge.className}" title="${sessionBadge.tooltip}">${sessionBadge.label}</span>`
              : ""
          }
          ${
            showWarning
              ? `<span class="warning-icon" title="${CACHE_WARNING_MESSAGE}" aria-label="${CACHE_WARNING_MESSAGE}">⚠</span>`
              : ""
          }
        </div>
        <div class="price-meta">${meta}</div>
      </div>
    `;
  }
  if (perfCell) {
    const formatPerfValue = (value) => (value === "n/a" ? "—" : value);
    const perfChangeValue = formatPerfValue(changeDisplay);
    const perfDayValue = formatPerfValue(dayDisplay);
    const perfMonthValue = formatPerfValue(monthDisplay);
    const perfYearValue = formatPerfValue(yearDisplay);
    const perfChangeClass = changeDisplay === "n/a" ? "muted" : changeClass;
    const perfDayClass = dayDisplay === "n/a" ? "muted" : dayClass;
    const perfMonthClass = monthDisplay === "n/a" ? "muted" : monthClass;
    const perfYearClass = yearDisplay === "n/a" ? "muted" : yearClass;
    perfCell.innerHTML = `
      <div class="performance-stack" aria-label="Performance">
        <div class="performance-top">
          <span class="performance-label">Change</span>
          <span class="performance-value ${perfChangeClass}">${perfChangeValue}</span>
        </div>
        <div class="performance-row">
          <span class="performance-item">
            <span class="performance-label">1D</span>
            <span class="performance-value ${perfDayClass}">${perfDayValue}</span>
          </span>
          <span class="performance-item">
            <span class="performance-label">1M</span>
            <span class="performance-value ${perfMonthClass}">${perfMonthValue}</span>
          </span>
          <span class="performance-item">
            <span class="performance-label">1Y</span>
            <span class="performance-value ${perfYearClass}">${perfYearValue}</span>
          </span>
        </div>
      </div>
    `;
  }
  if (actionsCell) {
    ensureActionsCellClean(actionsCell);
    actionsCell.innerHTML = `
      <div class="actions-group">
        <button type="button" class="analyze-button" data-action="analyze" data-symbol="${stock.symbol}">
          Analyze
        </button>
        <button
          type="button"
          class="icon-button remove-button"
          data-action="remove"
          data-symbol="${stock.symbol}"
          aria-label="Remove ${stock.symbol} from watchlist"
        >
          ✕
        </button>
      </div>
    `;
  }
}

function renderOpportunityGroup(listEl, noteEl, entries) {
  if (!listEl || !noteEl) {
    return;
  }
  if (!entries.length) {
    listEl.innerHTML = "";
    noteEl.classList.remove("hidden");
    return;
  }
  listEl.innerHTML = entries
    .map((entry) => {
      const { stock, score, confidence } = entry;
      const display = getMarketRowDisplay(stock);
      const sourceBadge = display.sourceBadge;
      const sessionBadge = display.sessionBadge;
      const warningIcon = display.showWarning
        ? `<span class="warning-icon" title="${CACHE_WARNING_MESSAGE}" aria-label="${CACHE_WARNING_MESSAGE}">⚠</span>`
        : "";
      const changeClass = display.dayDisplay === "n/a" ? "muted" : display.dayClass;
      const changeMarkup =
        display.dayDisplay === "n/a"
          ? `<span class="muted">n/a</span>`
          : `<span class="opportunity-change ${changeClass}">${display.dayDisplay}</span>`;
      const scoreValue = score == null ? "n/a" : Math.round(score);
      const confidenceValue = confidence == null ? "n/a" : Math.round(confidence);
      return `
        <div class="opportunity-item">
          <div class="opportunity-main">
            <div class="opportunity-top">
              <span>${stock.symbol}</span>
              ${
                sourceBadge
                  ? `<span class="session-badge ${sourceBadge.className}" title="${sourceBadge.tooltip}">${sourceBadge.label}</span>`
                  : ""
              }
              ${
                sessionBadge
                  ? `<span class="session-badge ${sessionBadge.className}" title="${sessionBadge.tooltip}">${sessionBadge.label}</span>`
                  : ""
              }
              ${warningIcon}
            </div>
            <div class="opportunity-metrics">
              <span class="opportunity-price">${display.priceDisplay}</span>
              ${changeMarkup}
              <span class="opportunity-score">${scoreValue} / ${confidenceValue}</span>
            </div>
            <div class="price-meta">${display.meta}</div>
          </div>
          <button type="button" class="analyze-button" data-action="analyze" data-symbol="${stock.symbol}">
            Analyze
          </button>
        </div>
      `;
    })
    .join("");
  noteEl.classList.toggle("hidden", entries.length >= 3);
}

function renderTopOpportunities(filtered) {
  if (!opportunityBuyList || !opportunitySellList || !opportunityMoversList) {
    return;
  }
  const groups = buildTopOpportunitiesGroups(filtered);
  renderOpportunityGroup(opportunityBuyList, opportunityBuyNote, groups.buy);
  renderOpportunityGroup(opportunitySellList, opportunitySellNote, groups.sell);
  renderOpportunityGroup(opportunityMoversList, opportunityMoversNote, groups.movers);
}

function clearMarketBodyRows() {
  if (!marketBody) {
    return;
  }
  if (typeof marketBody.replaceChildren === "function") {
    marketBody.replaceChildren();
    return;
  }
  marketBody.innerHTML = "";
  if (Array.isArray(marketBody.children)) {
    marketBody.children.length = 0;
  }
}

function renderSkeletonRows(symbols = marketState.map((stock) => stock.symbol)) {
  if (!marketBody) {
    return;
  }
  const existingRows = new Map();
  marketBody.querySelectorAll("tr[data-symbol]").forEach((row) => {
    existingRows.set(row.dataset.symbol, row);
  });
  const rows = symbols.map((symbol) => {
    const entry = marketStateIndex.get(symbol) ?? createSymbolEntry(symbol, symbol);
    const row = existingRows.get(symbol) ?? createMarketRowSkeleton(entry);
    updateMarketRowCells(row, entry);
    row.classList.remove("hidden");
    return row;
  });
  clearMarketBodyRows();
  rows.forEach((row) => marketBody.appendChild(row));
  validateMarketTableStructure(marketBody.closest("table"));
}

function updateMarketDebugReadout({ filteredCount = 0 } = {}) {
  const debugLine = isBrowser ? document.getElementById("market-debug") : null;
  if (!debugLine) {
    return;
  }
  if (!DEBUG) {
    debugLine.classList.add("hidden");
    return;
  }
  const watchlistCount = marketState.length;
  const renderedRows =
    marketBody?.querySelectorAll?.("tr[data-symbol]")?.length ??
    (Array.isArray(marketBody?.children) ? marketBody.children.length : 0);
  const quotesLoaded = marketState.filter((stock) => hasAnyMarketData(stock)).length;
  const quotesOk = lastRefreshSummary?.okCount ?? 0;
  const lastErrorLabel = refreshState.lastError
    ? `${refreshState.lastError.type ?? "unknown"}: ${refreshState.lastError.message ?? "error"}`
    : "—";
  debugLine.textContent = `Watchlist: ${watchlistCount} | Rendered rows: ${renderedRows} | Quotes ok: ${quotesOk} | Last error: ${lastErrorLabel}`;
  debugLine.classList.remove("hidden");
}

function renderMarketTable() {
  if (!marketBody) {
    return;
  }
  ensureSortControl();
  const filtered = getFilteredMarketEntries();
  renderTopOpportunities(filtered);
  logMarketSummary({ filteredCount: filtered.length, totalCount: marketState.length });
  const hasWatchlist = marketState.length > 0;
  if (marketEmptyState && marketEmptyMessage) {
    if (!hasWatchlist) {
      marketEmptyMessage.textContent = "Your watchlist is empty.";
      marketEmptyState.classList.remove("hidden");
    } else if (!filtered.length) {
      marketEmptyMessage.textContent = "Empty filters — no matches for current filters.";
      marketEmptyState.classList.remove("hidden");
    } else {
      marketEmptyState.classList.add("hidden");
    }
  }

  const sortKey = sortBySelect?.value ?? DEFAULT_SORT_KEY;
  const sortedVisible = sortMarketEntries(filtered, sortKey);
  const visibleSymbols = new Set(sortedVisible.map((stock) => stock.symbol));
  const ordered = [...sortedVisible, ...marketState.filter((stock) => !visibleSymbols.has(stock.symbol))];
  const existingRows = new Map();
  marketBody.querySelectorAll("tr[data-symbol]").forEach((row) => {
    existingRows.set(row.dataset.symbol, row);
  });

  clearMarketBodyRows();
  ordered.forEach((stock) => {
    const row = existingRows.get(stock.symbol) ?? createMarketRowSkeleton(stock);
    if (!row) {
      return;
    }
    row.classList.toggle("hidden", !visibleSymbols.has(stock.symbol));
    marketBody.appendChild(row);
    updateMarketRowCells(row, stock);
  });
  validateMarketTableStructure(marketBody.closest("table"));
  updateMarketDebugReadout({ filteredCount: filtered.length });
  updateMarketIndicator();
}

async function refreshMarketBoard() {
  const symbols = marketState.map((stock) => stock.symbol);
  let hadQuoteFailure = false;
  let quoteResults = [];
  let quoteErrors = [];
  let forceUnavailable = false;
  try {
    const batchResult = await fetchYahooQuotes(symbols);
    quoteResults = batchResult.quotes;
    quoteErrors = batchResult.errors;
    forceUnavailable = quoteResults.length === 0 && symbols.length > 0;
    if (forceUnavailable || batchResult.hadFailure) {
      hadQuoteFailure = true;
    }
  } catch (error) {
    hadQuoteFailure = true;
    if (shouldBackoffFromStatus(error?.details?.statusCode)) {
      applyRateLimitBackoff();
    }
    logMarketDataEvent("warn", {
      event: "market_data_refresh_failure",
      provider: PROVIDER,
      symbol: symbols.join(","),
      errorType: error.type ?? "unknown",
      message: error.message,
    });
  }
  const quoteMap = new Map(quoteResults.map((quote) => [quote.symbol, quote]));
  const results = await refreshSymbolsWithLimiter(symbols, (symbol) => {
    const prefetchedQuote = quoteMap.get(symbol) ?? null;
    return {
      prefetchedQuote,
      allowFetch: !prefetchedQuote,
      forceUnavailable,
      includeHistorical: false,
    };
  });
  results.forEach((result) => {
    if (result?.error || result?.hadQuoteFailure) {
      hadQuoteFailure = true;
    }
  });
  if (quoteErrors.length) {
    hadQuoteFailure = true;
  }
  marketIndicatorState.usingCached = hadQuoteFailure;

  renderMarketTable();
  if (resultCard && !resultCard.classList.contains("hidden")) {
    updateResultLivePriceDisplay(resultSymbol.textContent);
  }
}

function buildAnalyzeUrl(symbol, { autoRun = true } = {}) {
  const normalized = normalizeSymbolInput(symbol ?? "");
  if (!normalized) {
    return "";
  }
  const params = new URLSearchParams();
  params.set("symbol", normalized);
  if (autoRun) {
    params.set("autorun", "1");
  }
  return `index.html?${params.toString()}`;
}

function initTradePage() {
  if (!isBrowser) {
    return false;
  }
  let didInit = false;
  if (symbolInput) {
    didInit = true;
    symbolInput.addEventListener("input", () => {
      const normalized = normalizeSymbolInput(symbolInput.value);
      if (symbolInput.value !== normalized) {
        symbolInput.value = normalized;
      }
      const message = normalized ? getSymbolValidationMessage(normalized) : "";
      if (message && normalized) {
        setSymbolError(message);
      } else if (!normalized) {
        setSymbolError("");
      }
    });
    symbolInput.addEventListener("blur", () => {
      const normalized = normalizeSymbolInput(symbolInput.value);
      symbolInput.value = normalized;
      setSymbolError(getSymbolValidationMessage(normalized));
    });
  }

  if (symbolChips) {
    didInit = true;
    symbolChips.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-symbol]");
      if (!button) {
        return;
      }
      const symbol = button.dataset.symbol ?? "";
      if (symbolInput) {
        symbolInput.value = symbol;
        symbolInput.focus();
      }
      setSymbolError("");
    });
  }

  if (form) {
    didInit = true;
    bindRiskPercentField({
      positionSizingInput,
      riskPercentField,
      riskPercentInput,
      riskPercentError,
      storage: localStorage,
      getFormState: getFormStateFromInputs,
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isSubmitting) {
        return;
      }
      const formData = new FormData(form);
      const symbol = normalizeSymbolInput(formData.get("symbol").toString());
      if (symbolInput) {
        symbolInput.value = symbol;
      }
      const cashValue = Number(formData.get("cash"));
      const risk = formData.get("risk").toString();
      const positionSizingMode = formData.get("positionSizing")?.toString() ?? POSITION_SIZING_MODES.CASH;
      const riskPercentRaw = formData.get("riskPercent")?.toString() ?? "";
      const riskPercentValue = Number.parseFloat(riskPercentRaw);

      const validationErrors = [];
      const symbolMessage = getSymbolValidationMessage(symbol);
      setSymbolError(symbolMessage);
      if (!Number.isFinite(cashValue) || cashValue <= 0) {
        validationErrors.push("Cash balance must be greater than zero.");
      }
      if (!Object.keys(riskLimits).includes(risk)) {
        validationErrors.push("Risk tolerance must be low, moderate, or high.");
      }
      const safePositionSizing =
        positionSizingMode === POSITION_SIZING_MODES.RISK_PERCENT
          ? POSITION_SIZING_MODES.RISK_PERCENT
          : POSITION_SIZING_MODES.CASH;
      const riskPercentMessage = getRiskPercentValidationMessage(safePositionSizing, riskPercentRaw);
      setRiskPercentError(riskPercentMessage);
      if (riskPercentMessage) {
        validationErrors.push(riskPercentMessage);
      }

      if (symbolMessage || validationErrors.length > 0) {
        showErrors(validationErrors);
        showStatus("");
        resultCard.classList.add("hidden");
        return;
      }

      persistFormState(localStorage, {
        symbol,
        cash: formData.get("cash").toString(),
        risk,
        positionSizing: safePositionSizing,
        riskPercent: formData.get("riskPercent")?.toString?.() ?? "",
      });

      isSubmitting = true;
      setFormLoadingState(true);
      renderLoadingState(symbol);
      showStatus("Generating AI Signal...");
      const perf = createPerfTracker(PERF_DEBUG_ENABLED);
      perf.start("total");
      let usedCachedFallback = false;
      try {
        const snapshot = await loadSymbolSnapshot(symbol, {
          perf,
          onIntermediateSnapshot: (intermediate) => {
            if (usedCachedFallback) {
              return;
            }
            if (!intermediate?.entry || !hasAnyMarketData(intermediate.entry)) {
              return;
            }
            usedCachedFallback = true;
            extraSymbolData.set(symbol, intermediate.entry);
            showStatus("Using cached data — refreshing with live quote...");
            marketIndicatorState.usingCached = true;
            updateMarketIndicator();
            perf.start("compute");
            const interimResult = analyzeSymbol({
              symbol,
              cash: cashValue,
              riskTolerance: risk,
              sizingMode: safePositionSizing,
              riskPercent: riskPercentValue,
              mode: "trade",
            });
            perf.end("compute");
            perf.start("render");
            renderResult(interimResult);
            perf.end("render");
          },
        });
        showErrors([]);
        setSymbolError("");
        let statusMessage = "";
        if (snapshot?.status === QUOTE_SOURCES.CACHED) {
          const lastUpdated = formatTime(snapshot.entry?.lastUpdatedAt);
          statusMessage = `Live data unavailable — showing cached price from ${lastUpdated}.`;
          marketIndicatorState.usingCached = true;
          updateMarketIndicator();
        } else if (snapshot?.status === "unavailable") {
          const lastUpdated = formatTime(snapshot.entry?.lastUpdatedAt);
          statusMessage = snapshot.entry?.lastUpdatedAt
            ? `Data unavailable — showing cached price from ${lastUpdated}.`
            : "Data unavailable — please try again shortly.";
          marketIndicatorState.usingCached = true;
          updateMarketIndicator();
        } else if (snapshot?.dataSource === QUOTE_SOURCES.LAST_CLOSE) {
          const lastUpdated = formatTime(snapshot.entry?.lastUpdatedAt);
          statusMessage = `Live data unavailable — showing last close from ${lastUpdated}.`;
        } else if (snapshot?.dataSource === QUOTE_SOURCES.DELAYED) {
          const lastUpdated = formatTime(snapshot.entry?.lastUpdatedAt);
          statusMessage = `Delayed quote — last update at ${lastUpdated}.`;
        } else if (snapshot?.dataSource === QUOTE_SOURCES.CACHED) {
          const lastUpdated = formatTime(snapshot.entry?.lastUpdatedAt);
          statusMessage = `Live data unavailable — showing cached price from ${lastUpdated}.`;
        } else if (snapshot?.dataSource === QUOTE_SOURCES.REALTIME) {
          statusMessage = usedCachedFallback ? "Updated with live data." : "";
        } else {
          const lastUpdated = formatTime(snapshot.entry?.lastUpdatedAt);
          statusMessage = lastUpdated ? `Market closed — showing last close from ${lastUpdated}.` : "";
        }
        showStatus(statusMessage);
      } catch (error) {
        if (error.type === "invalid_symbol") {
          setSymbolError(`We couldn't find data for ${symbol}. Double-check the symbol and try again.`);
          showErrors([]);
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
      } finally {
        isSubmitting = false;
        setFormLoadingState(false);
      }
      perf.start("compute");
      const result = analyzeSymbol({
        symbol,
        cash: cashValue,
        riskTolerance: risk,
        sizingMode: safePositionSizing,
        riskPercent: riskPercentValue,
        mode: "trade",
      });
      perf.end("compute");
      perf.start("render");
      renderResult(result);
      perf.end("render");
      perf.end("total");
      const summary = perf.summary("total");
      if (summary) {
        const breakdown = summary.breakdown;
        console.info(
          `Generate AI Signal: total=${summary.total.toFixed(1)}ms | quote=${(
            breakdown.fetchQuote ?? 0
          ).toFixed(1)}ms | history=${(breakdown.fetchHistory ?? 0
          ).toFixed(1)}ms | compute=${(
            breakdown.compute ?? 0
          ).toFixed(1)}ms | render=${(breakdown.render ?? 0
          ).toFixed(1)}ms`,
        );
      }
    });
  }

  const restoredState = loadPersistedFormState(localStorage);
  if (restoredState) {
    if (symbolInput) {
      symbolInput.value = restoredState.symbol;
    }
    if (cashInput) {
      cashInput.value = restoredState.cash;
    }
    if (riskInput) {
      riskInput.value = restoredState.risk;
    }
    if (positionSizingInput) {
      positionSizingInput.value = restoredState.positionSizing;
    }
    if (riskPercentInput && restoredState.riskPercent) {
      riskPercentInput.value = restoredState.riskPercent;
    }
  }
  updateRiskPercentVisibility(positionSizingInput?.value ?? POSITION_SIZING_MODES.CASH);
  loadPersistentQuoteCache();
  loadPersistentHistoricalCache();

  const params = new URLSearchParams(window.location.search);
  const symbolParam = normalizeSymbolInput(params.get("symbol") ?? "");
  const autoRunParam = params.get("autorun") === "1";
  if (symbolInput && symbolParam) {
    symbolInput.value = symbolParam;
    setSymbolError("");
    if (autoRunParam) {
      setTimeout(() => {
        if (form?.requestSubmit) {
          form.requestSubmit();
        } else if (submitButton) {
          submitButton.click();
        }
      }, 0);
    }
  }

  return didInit;
}

function initLivePage({ onAnalyze, skipInitialLoad = false, skipRender = false } = {}) {
  if (!isBrowser) {
    return false;
  }
  let didInit = false;
  const handleAnalyze = onAnalyze ?? null;
  const resolveAnalyzeSymbol = (event) => {
    const analyzeButton = event.target.closest("button[data-action='analyze']");
    if (!analyzeButton) {
      return { button: null, symbol: "" };
    }
    const rowSymbol = analyzeButton.closest("tr[data-symbol]")?.dataset.symbol ?? "";
    const symbol = analyzeButton.dataset.symbol ?? rowSymbol;
    return { button: analyzeButton, symbol };
  };
  const handleMissingSymbol = () => {
    setWatchlistError("Missing symbol.");
  };
  const shouldRender = !skipRender;
  const initialSymbols = watchlistStore.getWatchlist();
  const watchlistMeta = watchlistStore.getWatchlistMeta?.() ?? { sourceKey: WATCHLIST_STORAGE_KEY };
  console.info("[Market Init]", {
    stage: "watchlist_loaded",
    sourceKey: watchlistMeta.sourceKey,
    watchlistCount: initialSymbols.length,
  });
  syncMarketStateWithWatchlist();
  if (shouldRender) {
    renderSkeletonRows(initialSymbols);
    console.info("[Market Init]", { stage: "skeleton_rendered", rowCount: initialSymbols.length });
    renderMarketTable();
    console.info("[Market Init]", {
      stage: "render_market_table",
      filteredCount: getFilteredMarketEntries().length,
      didRender: true,
    });
    updateRefreshStatus();
  }
  sortBySelect = ensureSortControl() ?? sortBySelect;
  if (refreshPill) {
    didInit = true;
    refreshPill.addEventListener("click", () => {
      if (refreshState.status === "error" && refreshState.lastError) {
        const errorType = refreshState.lastError.type ?? "network_error";
        setQuoteStatusBanner(getQuoteFailureMessage(errorType), { reason: errorType });
        return;
      }
      triggerImmediateRefresh();
    });
  }
  if (quoteStatusRetry) {
    didInit = true;
    quoteStatusRetry.addEventListener("click", () => {
      triggerImmediateRefresh();
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
    filterFavorites,
    sortBySelect,
  ].forEach((input) => {
    if (input) {
      didInit = true;
      input.addEventListener("input", () => {
      if (shouldRender) {
        renderMarketTable();
        updateRefreshStatus();
        scheduleNextMarketRefresh();
      }
      });
    }
  });

  if (watchlistInput) {
    didInit = true;
    watchlistInput.addEventListener("input", () => {
      setWatchlistError("");
    });
    watchlistInput.addEventListener("blur", () => {
      watchlistInput.value = normalizeWatchlistSymbol(watchlistInput.value);
    });
    watchlistInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      watchlistAddButton?.click();
    });
  }

  if (watchlistAddButton) {
    didInit = true;
    watchlistAddButton.addEventListener("click", () => {
      if (!watchlistInput) {
        return;
      }
      const rawValue = watchlistInput.value;
      const normalized = normalizeWatchlistSymbol(rawValue);
      if (!normalized) {
        setWatchlistError("Enter a symbol to add.");
        return;
      }
      if (!isValidWatchlistSymbol(normalized)) {
        setWatchlistError("Symbols must be 1-10 characters using A–Z, 0–9, dots, or hyphens only.");
        return;
      }
      if (watchlistStore.getWatchlist().includes(normalized)) {
        setWatchlistError(`${normalized} is already in your watchlist.`);
        return;
      }
      const result = watchlistStore.addSymbol(normalized);
      if (!result.added) {
        setWatchlistError("Unable to add that symbol right now.");
        return;
      }
      watchlistInput.value = "";
      setWatchlistError("");
      syncMarketStateWithWatchlist();
      if (shouldRender) {
        renderSkeletonRows(watchlistStore.getWatchlist());
        renderMarketTable();
      }
      if (shouldRender) {
        updateRefreshStatus();
        scheduleNextMarketRefresh(0);
        refreshVisibleQuotes();
      }
    });
  }

  if (opportunitiesToggle && opportunitiesContent) {
    didInit = true;
    const updateToggleState = () => {
      opportunitiesContent.classList.toggle("hidden", !opportunitiesToggle.checked);
    };
    opportunitiesToggle.addEventListener("change", updateToggleState);
    updateToggleState();
  }

  if (clearFiltersButton) {
    didInit = true;
    clearFiltersButton.addEventListener("click", () => {
      clearMarketFilters();
      if (shouldRender) {
        renderMarketTable();
        updateRefreshStatus();
        scheduleNextMarketRefresh(0);
      }
    });
  }

  if (opportunitiesContent) {
    didInit = true;
    opportunitiesContent.addEventListener("click", (event) => {
      const { button: analyzeButton, symbol } = resolveAnalyzeSymbol(event);
      if (!analyzeButton) {
        return;
      }
      event.preventDefault();
      event.stopPropagation?.();
      event.stopImmediatePropagation?.();
      if (!symbol) {
        handleMissingSymbol();
        return;
      }
      handleAnalyze?.(symbol);
    });
  }

  if (marketBody) {
    didInit = true;
    marketBody.addEventListener("click", (event) => {
      const actionButton = event.target.closest("button[data-action]");
      if (actionButton) {
        event.preventDefault();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
        const action = actionButton.dataset.action;
        const symbol = actionButton.dataset.symbol ?? actionButton.closest("tr[data-symbol]")?.dataset.symbol ?? "";
        if (action === "favorite") {
          favoritesStore.toggleFavorite(symbol);
          if (shouldRender) {
            renderMarketTable();
            updateRefreshStatus();
            scheduleNextMarketRefresh();
          }
          return;
        }
        if (action === "remove") {
          const removed = removeSymbolFromWatchlist(symbol);
          if (removed) {
            syncMarketStateWithWatchlist();
            if (shouldRender) {
              renderSkeletonRows(watchlistStore.getWatchlist());
              renderMarketTable();
              updateRefreshStatus();
              scheduleNextMarketRefresh(0);
            }
          }
          return;
        }
        if (action === "analyze") {
          if (!symbol) {
            handleMissingSymbol();
            return;
          }
          handleAnalyze?.(symbol);
          return;
        }
      }
    });
  }

  if (!skipInitialLoad) {
    loadPersistentQuoteCache();
    loadPersistentHistoricalCache();
    hydrateMarketStateFromCache();
    if (shouldRender) {
      renderMarketTable();
    }
    loadInitialMarketData()
      .then(() => {
        if (shouldRender) {
          renderMarketTable();
        }
      })
      .catch((error) => {
        logMarketDataEvent("error", {
          event: "market_data_initial_failure",
          provider: PROVIDER,
          errorType: error.type ?? "unknown",
          message: error.message,
        });
      });
    if (document?.addEventListener) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    scheduleNextMarketRefresh(0);
  }

  return didInit;
}

const appCore = {
  MarketDataError,
  fetchJsonWithRetry,
  fetchWithTimeout,
  isValidSymbol,
  isValidWatchlistSymbol,
  getWatchlist,
  normalizeSymbolInput,
  normalizeWatchlistSymbol,
  getSymbolValidationMessage,
  createStorageAdapter,
  createWatchlistStore,
  createFavoritesStore,
  persistFormState,
  loadPersistedFormState,
  getRiskPercentValidationMessage,
  applyRiskPercentVisibility,
  bindRiskPercentField,
  getQuote,
  fetchHistoricalSeries,
  deriveMarketSession,
  normalizeQuote,
  loadSymbolSnapshot,
  resetSymbolCache,
  extraSymbolData,
  resetQuoteCache,
  setLastKnownQuote,
  hydrateMarketStateFromCache,
  getMarketRowDisplay,
  getRefreshIntervalForSession,
  getNextRefreshDelay,
  applyRateLimitBackoff,
  isRateLimitBackoffActive,
  updateStockWithQuote,
  updateStockWithHistorical,
  getStockEntry,
  calculateAtrLike,
  classifyTimeHorizon,
  calculateTimeHorizon,
  analyzeSymbol,
  calculateSignalConfidence,
  calculateSignalScore,
  getConfidenceLabel,
  calculateTradePlan,
  buildSignalReasons,
  buildInvalidationRules,
  formatTimestamp,
  runBacktest30d,
  getMarketIndicatorData,
  handleMarketRowAction,
  updateMarketRowCells,
  getMarketTableColumnKeys,
  buildMarketRowMarkup,
  getScrollBehavior,
  scheduleResultScroll,
  sortMarketEntries,
  getSortValue,
  buildTopOpportunitiesGroups,
  applyMarketFilters,
  removeSymbolFromWatchlist,
  getCachedAnalysis,
  setCachedAnalysis,
  resetAnalysisCache,
  fetchYahooQuotes,
  refreshVisibleQuotes,
  runRefreshCycle,
  getRefreshState,
  resetRefreshState,
  getLastRefreshSummary,
  buildAnalyzeUrl,
  initTradePage,
  initLivePage,
};

if (typeof window !== "undefined") {
  window.AppCore = appCore;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = appCore;
}
