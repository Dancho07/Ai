const form = document.getElementById("trade-form");
const errors = document.getElementById("errors");
const resultCard = document.getElementById("result");

const resultSymbol = document.getElementById("result-symbol");
const resultAction = document.getElementById("result-action");
const resultConfidence = document.getElementById("result-confidence");
const resultShares = document.getElementById("result-shares");
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

const marketState = marketWatchlist.map((stock) => {
  const seed = symbolSeed(stock.symbol);
  const history = generatePrices(seed);
  return {
    ...stock,
    history,
    lastPrice: history[history.length - 1],
    previousClose: history[history.length - 2],
  };
});

function symbolSeed(symbol) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i += 1) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generatePrices(seed) {
  const base = 20 + (seed % 180);
  const trend = ((Math.floor(seed / 10) % 15) - 7) * 0.05;
  const volatility = 1 + (seed % 5);

  const prices = [];
  let current = base;
  for (let day = 0; day < 30; day += 1) {
    const swing = ((seed >> (day % 8)) % 7) - 3;
    current = Math.max(2, current + trend + swing * 0.1 * volatility);
    prices.push(Number(current.toFixed(2)));
  }
  return prices;
}

function calculateSignal(prices) {
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
  const seed = symbolSeed(symbol);
  const prices = generatePrices(seed);
  const recent = prices[prices.length - 1];
  const average = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const riskLimit = riskLimits[risk];

  let action = "hold";
  let allocation = riskLimit * 0.25;
  let thesis = [
    "Price is near the short-term average.",
    "No strong edge detected for aggressive trades.",
  ];

  if (recent > average * 1.03) {
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
  resultPrice.textContent = `Estimated price: $${result.estimatedPrice.toFixed(2)}`;
  resultThesis.innerHTML = result.thesis.map((line) => `<li>${line}</li>`).join("");
  resultGenerated.textContent = `Generated ${result.generatedAt}`;
  resultDisclaimer.textContent = result.disclaimer;
  resultCard.classList.remove("hidden");
}

function updateMarketPrices() {
  marketState.forEach((stock) => {
    const drift = (symbolSeed(stock.symbol) % 5) * 0.01;
    const volatility = 0.6 + (symbolSeed(stock.symbol) % 7) * 0.1;
    const swing = (Math.random() - 0.5) * volatility + drift;
    const nextPrice = Math.max(2, stock.lastPrice + swing);
    stock.history = [...stock.history.slice(1), Number(nextPrice.toFixed(2))];
    stock.previousClose = stock.lastPrice;
    stock.lastPrice = Number(nextPrice.toFixed(2));
  });
}

function matchesFilters(stock) {
  const searchValue = filterSearch.value.trim().toUpperCase();
  const sectorValue = filterSector.value;
  const capValue = filterCap.value;
  const signalValue = filterSignal.value;
  const minValue = Number(filterMin.value);
  const maxValue = Number(filterMax.value);
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
  return true;
}

function renderMarketTable() {
  const rows = marketState
    .filter(matchesFilters)
    .map((stock) => {
      const signal = calculateSignal(stock.history);
      const change = stock.lastPrice - stock.previousClose;
      const changePercent = stock.previousClose
        ? (change / stock.previousClose) * 100
        : 0;
      const changeClass = change >= 0 ? "positive" : "negative";
      return `<tr>
        <td>${stock.symbol}</td>
        <td>${stock.name}</td>
        <td>${stock.sector}</td>
        <td>${stock.cap}</td>
        <td><span class="signal-pill ${signal}">${signal}</span></td>
        <td>$${stock.lastPrice.toFixed(2)}</td>
        <td class="price-change ${changeClass}">${change >= 0 ? "+" : ""}${change.toFixed(
          2,
        )} (${change >= 0 ? "+" : ""}${changePercent.toFixed(2)}%)</td>
      </tr>`;
    })
    .join("");

  marketBody.innerHTML = rows || `<tr><td colspan="7">No stocks match these filters.</td></tr>`;
}

function refreshMarketBoard() {
  updateMarketPrices();
  renderMarketTable();
}

[
  filterSearch,
  filterSector,
  filterCap,
  filterSignal,
  filterMin,
  filterMax,
].forEach((input) => {
  input.addEventListener("input", renderMarketTable);
});

form.addEventListener("submit", (event) => {
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

  showErrors([]);
  const result = analyzeTrade({ symbol, cash: cashValue, risk });
  renderResult(result);
});

renderMarketTable();
setInterval(refreshMarketBoard, 3000);
