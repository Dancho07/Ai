const form = document.getElementById("trade-form");
const errors = document.getElementById("errors");
const resultCard = document.getElementById("result");

const resultSymbol = document.getElementById("result-symbol");
const resultAction = document.getElementById("result-action");
const resultConfidence = document.getElementById("result-confidence");
const resultShares = document.getElementById("result-shares");
const resultLivePrice = document.getElementById("result-live-price");
const resultPrice = document.getElementById("result-price");
const resultThesis = document.getElementById("result-thesis");
const resultGenerated = document.getElementById("result-generated");
const resultDisclaimer = document.getElementById("result-disclaimer");

const marketBody = document.getElementById("market-body");
const filterSearch = document.getElementById("filter-search");
const filterSector = document.getElementById("filter-sector");
const filterCap = document.getElementById("filter-cap");
const filterSignal = document.getElementById("filter-signal");
const filterMin = document.getElementById("filter-min");
const filterMax = document.getElementById("filter-max");
const filterMonth = document.getElementById("filter-month");
const filterYear = document.getElementById("filter-year");

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
  monthlyChange: null,
  yearlyChange: null,
  lastUpdated: null,
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

const YAHOO_QUOTE_URL = (symbols) =>
  `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
const YAHOO_CHART_URL = (symbol, range) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d&includePrePost=false`;

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
  return marketState.find((stock) => stock.symbol === symbol) ?? extraSymbolData.get(symbol);
}

function showErrors(messages) {
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

function renderResult(result) {
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

async function fetchJson(url) {
  const cacheBust = Date.now();
  const response = await fetch(
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&cache=${cacheBust}`,
  );
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
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
  stock.monthlyChange = calculatePercentChange(latest, monthClose);
  stock.yearlyChange = calculatePercentChange(latest, yearClose);
}

async function loadInitialMarketData() {
  const symbols = marketState.map((stock) => stock.symbol);
  const quoteData = await fetchJson(YAHOO_QUOTE_URL(symbols));
  const quoteResults = quoteData?.quoteResponse?.result ?? [];

  quoteResults.forEach((quote) => {
    const stock = marketState.find((entry) => entry.symbol === quote.symbol);
    if (!stock) {
      return;
    }
    stock.lastPrice = quote.regularMarketPrice ?? null;
    stock.previousClose = quote.regularMarketPreviousClose ?? null;
    stock.lastUpdated = new Date().toLocaleTimeString();
  });

  await Promise.all(
    marketState.map(async (stock) => {
      try {
        const chartData = await fetchJson(YAHOO_CHART_URL(stock.symbol, "1y"));
        const chart = chartData?.chart?.result?.[0];
        const closeSeries = extractCloseSeries(chart);
        applyChartMetrics(stock, closeSeries);
      } catch (error) {
        console.error(error);
      }
    }),
  );
}

async function loadSymbolSnapshot(symbol) {
  const [quoteResult, chartResult] = await Promise.allSettled([
    fetchJson(YAHOO_QUOTE_URL([symbol])),
    fetchJson(YAHOO_CHART_URL(symbol, "1y")),
  ]);
  const quoteData = quoteResult.status === "fulfilled" ? quoteResult.value : null;
  const chartData = chartResult.status === "fulfilled" ? chartResult.value : null;
  const cachedEntry = getStockEntry(symbol);
  const hasCachedData = Boolean(cachedEntry?.lastPrice || cachedEntry?.history?.length);
  if (!quoteData && !chartData) {
    if (hasCachedData) {
      return;
    }
    throw new Error("Quote and chart requests failed.");
  }

  const quote = quoteData?.quoteResponse?.result?.[0];
  const chart = chartData?.chart?.result?.[0];
  const closeSeries = extractCloseSeries(chart);
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
    lastUpdated: null,
  };
  if (quote) {
    entry.name = quote.shortName ?? entry.name;
    entry.lastPrice = quote.regularMarketPrice ?? entry.lastPrice;
    entry.previousClose = quote.regularMarketPreviousClose ?? entry.previousClose;
    entry.lastUpdated = new Date().toLocaleTimeString();
  }
  applyChartMetrics(entry, closeSeries);
  extraSymbolData.set(symbol, entry);
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
  const rows = marketState
    .filter(matchesFilters)
    .map((stock) => {
      const signal = calculateSignal(stock.history);
      const change =
        stock.lastPrice && stock.previousClose ? stock.lastPrice - stock.previousClose : 0;
      const changePercent =
        stock.lastPrice && stock.previousClose
          ? (change / stock.previousClose) * 100
          : null;
      const changeClass = changePercent === null ? "" : change >= 0 ? "positive" : "negative";
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
          changePercent !== null
            ? `${change >= 0 ? "+" : ""}${change.toFixed(2)} (${change >= 0 ? "+" : ""}${percentFormatter.format(
                changePercent,
              )}%)`
            : "—"
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

  marketBody.innerHTML = rows || `<tr><td colspan="9">No stocks match these filters.</td></tr>`;
}

async function refreshMarketBoard() {
  const symbols = marketState.map((stock) => stock.symbol);
  try {
    const quoteData = await fetchJson(YAHOO_QUOTE_URL(symbols));
    const quoteResults = quoteData?.quoteResponse?.result ?? [];
    quoteResults.forEach((quote) => {
      const stock = marketState.find((entry) => entry.symbol === quote.symbol);
      if (!stock) {
        return;
      }
      stock.previousClose = stock.lastPrice ?? quote.regularMarketPreviousClose ?? null;
      stock.lastPrice = quote.regularMarketPrice ?? stock.lastPrice;
      stock.lastUpdated = new Date().toLocaleTimeString();
    });
  } catch (error) {
    console.error(error);
  }

  renderMarketTable();
  if (!resultCard.classList.contains("hidden")) {
    const livePrice = getLivePriceForSymbol(resultSymbol.textContent);
    resultLivePrice.textContent = livePrice
      ? `Live price: ${quoteFormatter.format(livePrice)}`
      : "Live price: Not available";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const symbol = formData.get("symbol").toString().trim().toUpperCase();
  const cashValue = Number(formData.get("cash"));
  const risk = formData.get("risk").toString();

  const validationErrors = [];
  if (!symbol) {
    validationErrors.push("Please enter a stock symbol.");
  }
  if (!cashValue || Number.isNaN(cashValue) || cashValue <= 0) {
    validationErrors.push("Cash balance must be greater than zero.");
  }
  if (!Object.keys(riskLimits).includes(risk)) {
    validationErrors.push("Risk tolerance must be low, moderate, or high.");
  }

  if (validationErrors.length > 0) {
    showErrors(validationErrors);
    resultCard.classList.add("hidden");
    return;
  }

  try {
    await loadSymbolSnapshot(symbol);
    showErrors([]);
  } catch (error) {
    console.error(error);
    showErrors(["Live market data is temporarily unavailable. Please try again shortly."]);
  }
  const result = analyzeTrade({ symbol, cash: cashValue, risk });
  renderResult(result);
});

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
  input.addEventListener("input", renderMarketTable);
});

renderMarketTable();
loadInitialMarketData()
  .then(renderMarketTable)
  .catch((error) => {
    console.error(error);
  });
setInterval(refreshMarketBoard, 60000);
