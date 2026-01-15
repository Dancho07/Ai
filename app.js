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
