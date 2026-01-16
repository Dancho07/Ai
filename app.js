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

const YAHOO_QUOTE_URL = (symbols) =>
  `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
const YAHOO_CHART_URL = (symbol, range) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d&includePrePost=false`;

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

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseProviderError(payload) {
  const chartError = payload?.chart?.error;
  const quoteError = payload?.quoteResponse?.error;
  return chartError || quoteError || null;
}

function isInvalidSymbolPayload(quoteData, chartData) {
  const quoteResult = quoteData?.quoteResponse?.result ?? [];
  const chartResult = chartData?.chart?.result ?? [];
  return quoteResult.length === 0 && chartResult.length === 0;
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
  const livePrice = getLivePriceForSymbol(result.symbol);
  resultLivePrice.textContent = livePrice
    ? `Live price: ${quoteFormatter.format(livePrice)}`
    : "Live price: Not available";
  resultPrice.textContent = result.estimatedPrice
    ? `Estimated price: ${quoteFormatter.format(result.estimatedPrice)}`
    : "Estimated price: Not available";
  resultThesis.innerHTML = result.thesis.map((line) => `<li>${line}</li>`).join("");
  resultGenerated.textContent = `Generated ${result.generatedAt}`;
  resultDisclaimer.textContent = result.disclaimer;
  resultCard.classList.remove("hidden");
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
  return closes.filter((value) => typeof value === "number");
}

function applyChartMetrics(stock, closeSeries) {
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
}

async function loadInitialMarketData() {
  const symbols = marketState.map((stock) => stock.symbol);
  const quoteData = await fetchJson(YAHOO_QUOTE_URL(symbols), {
    provider: PROVIDER,
    symbol: symbols.join(","),
  });
  const quoteResults = quoteData?.quoteResponse?.result ?? [];

  quoteResults.forEach((quote) => {
    const stock = marketState.find((entry) => entry.symbol === quote.symbol);
    if (!stock) {
      return;
    }
    stock.lastPrice = quote.regularMarketPrice ?? null;
    stock.previousClose = quote.regularMarketPreviousClose ?? null;
    stock.dailyChange = calculatePercentChange(stock.lastPrice, stock.previousClose);
    stock.lastUpdated = new Date().toLocaleTimeString();
    stock.lastUpdatedAt = Date.now();
    stock.dataSource = "live";
  });

  await Promise.all(
    marketState.map(async (stock) => {
      try {
        const chartData = await fetchJson(YAHOO_CHART_URL(stock.symbol, "1y"), {
          provider: PROVIDER,
          symbol: stock.symbol,
        });
        const chart = chartData?.chart?.result?.[0];
        const closeSeries = extractCloseSeries(chart);
        applyChartMetrics(stock, closeSeries);
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
  const [quoteResult, chartResult] = await Promise.allSettled([
    fetchJson(YAHOO_QUOTE_URL([symbol]), {
      provider: PROVIDER,
      symbol,
      fetchFn: options.fetchFn,
    }),
    fetchJson(YAHOO_CHART_URL(symbol, "1y"), {
      provider: PROVIDER,
      symbol,
      fetchFn: options.fetchFn,
    }),
  ]);
  const quoteData = quoteResult.status === "fulfilled" ? quoteResult.value : null;
  const chartData = chartResult.status === "fulfilled" ? chartResult.value : null;
  const cachedEntry = getStockEntry(symbol);
  const hasCachedData = Boolean(cachedEntry?.lastPrice || cachedEntry?.history?.length);
  if (quoteResult.status === "rejected") {
    logMarketDataEvent("warn", {
      event: "market_data_quote_failure",
      provider: PROVIDER,
      symbol,
      errorType: quoteResult.reason?.type ?? "unknown",
      message: quoteResult.reason?.message ?? "Quote fetch failed.",
    });
  }
  if (chartResult.status === "rejected") {
    logMarketDataEvent("warn", {
      event: "market_data_chart_failure",
      provider: PROVIDER,
      symbol,
      errorType: chartResult.reason?.type ?? "unknown",
      message: chartResult.reason?.message ?? "Chart fetch failed.",
    });
  }

  if (!quoteData && !chartData) {
    if (hasCachedData) {
      return { status: "cache", entry: cachedEntry };
    }
    throw new MarketDataError("unavailable", "Quote and chart requests failed.");
  }

  const quote = quoteData?.quoteResponse?.result?.[0];
  const chart = chartData?.chart?.result?.[0];
  const closeSeries = extractCloseSeries(chart);
  if (!quote && !closeSeries.length && isInvalidSymbolPayload(quoteData, chartData)) {
    throw new MarketDataError("invalid_symbol", "No data returned for symbol.");
  }
  const entry = extraSymbolData.get(symbol) ?? {
    symbol,
    name: quote?.shortName ?? symbol,
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
    dataSource: "live",
  };
  let dataSource = "live";
  if (quote) {
    entry.name = quote.shortName ?? entry.name;
    entry.lastPrice = quote.regularMarketPrice ?? entry.lastPrice;
    entry.previousClose = quote.regularMarketPreviousClose ?? entry.previousClose;
    entry.dailyChange = calculatePercentChange(entry.lastPrice, entry.previousClose);
    entry.lastUpdated = new Date().toLocaleTimeString();
    entry.lastUpdatedAt = Date.now();
    entry.dataSource = "live";
  } else if (closeSeries.length) {
    entry.lastPrice = closeSeries[closeSeries.length - 1];
    entry.previousClose = closeSeries[closeSeries.length - 2] ?? entry.previousClose;
    entry.dailyChange = calculatePercentChange(entry.lastPrice, entry.previousClose);
    entry.lastUpdated = new Date().toLocaleTimeString();
    entry.lastUpdatedAt = Date.now();
    entry.dataSource = "delayed";
    dataSource = "delayed";
  }
  applyChartMetrics(entry, closeSeries);
  extraSymbolData.set(symbol, entry);
  return { status: dataSource, entry, dataSource };
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
      return `<tr>
        <td>${stock.symbol}</td>
        <td>${stock.name}</td>
        <td>${stock.sector}</td>
        <td>${stock.cap}</td>
        <td><span class="signal-pill ${signal}">${signal}</span></td>
        <td>${stock.lastPrice ? quoteFormatter.format(stock.lastPrice) : "—"}</td>
        <td class="price-change ${changeClass}">${
          change !== null && changePercent !== null
            ? `${change >= 0 ? "+" : ""}${change.toFixed(2)} (${change >= 0 ? "+" : ""}${percentFormatter.format(
                changePercent,
              )}%)`
            : "—"
        }</td>
        <td class="price-change ${dayClass}">${
          stock.dailyChange === null
            ? "—"
            : `${stock.dailyChange >= 0 ? "+" : ""}${percentFormatter.format(stock.dailyChange)}%`
        }</td>
        <td class="price-change ${monthClass}">${
          stock.monthlyChange === null
            ? "—"
            : `${stock.monthlyChange >= 0 ? "+" : ""}${percentFormatter.format(stock.monthlyChange)}%`
        }</td>
        <td class="price-change ${yearClass}">${
          stock.yearlyChange === null
            ? "—"
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
    const quoteData = await fetchJson(YAHOO_QUOTE_URL(symbols), {
      provider: PROVIDER,
      symbol: symbols.join(","),
    });
    const quoteResults = quoteData?.quoteResponse?.result ?? [];
    quoteResults.forEach((quote) => {
      const stock = marketState.find((entry) => entry.symbol === quote.symbol);
      if (!stock) {
        return;
      }
      stock.previousClose = stock.lastPrice ?? quote.regularMarketPreviousClose ?? null;
      stock.lastPrice = quote.regularMarketPrice ?? stock.lastPrice;
      stock.dailyChange = calculatePercentChange(stock.lastPrice, stock.previousClose);
      stock.lastUpdated = new Date().toLocaleTimeString();
      stock.lastUpdatedAt = Date.now();
      stock.dataSource = "live";
    });
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
    const livePrice = getLivePriceForSymbol(resultSymbol.textContent);
    resultLivePrice.textContent = livePrice
      ? `Live price: ${quoteFormatter.format(livePrice)}`
      : "Live price: Not available";
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
      showStatus(`Live data unavailable — showing last known price from ${lastUpdated}.`);
    } else if (snapshot?.dataSource === "delayed") {
      const lastUpdated = formatTime(snapshot.entry?.lastUpdatedAt);
      showStatus(`Live data unavailable — showing delayed price from ${lastUpdated}.`);
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
  setInterval(refreshMarketBoard, 60000);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MarketDataError,
    fetchJsonWithRetry,
    fetchWithTimeout,
    isValidSymbol,
    loadSymbolSnapshot,
    resetSymbolCache,
    extraSymbolData,
  };
}
