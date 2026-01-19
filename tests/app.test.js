const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  MarketDataError,
  fetchJsonWithRetry,
  isValidSymbol,
  normalizeSymbolInput,
  getSymbolValidationMessage,
  createStorageAdapter,
  createWatchlistStore,
  createFavoritesStore,
  deriveMarketSession,
  persistFormState,
  loadPersistedFormState,
  bindRiskPercentField,
  getQuote,
  fetchHistoricalSeries,
  loadSymbolSnapshot,
  resetSymbolCache,
  extraSymbolData,
  resetQuoteCache,
  setLastKnownQuote,
  hydrateMarketStateFromCache,
  getMarketRowDisplay,
  getNextRefreshDelay,
  applyRateLimitBackoff,
  isRateLimitBackoffActive,
  updateStockWithQuote,
  updateStockWithHistorical,
  getStockEntry,
  calculateAtrLike,
  classifyTimeHorizon,
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
  scheduleResultScroll,
  sortMarketEntries,
  buildTopOpportunitiesGroups,
  applyMarketFilters,
  removeSymbolFromWatchlist,
  initTradePage,
  initLivePage,
} = require("../core");

function createResponse({ ok, status, json }) {
  return {
    ok,
    status,
    json: async () => json,
  };
}

function createFetchSequence(responses) {
  let callCount = 0;
  const fetchFn = async () => {
    const response = responses[Math.min(callCount, responses.length - 1)];
    callCount += 1;
    if (response instanceof Error) {
      throw response;
    }
    return response;
  };
  fetchFn.getCallCount = () => callCount;
  return fetchFn;
}

function createStorage() {
  const store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
  };
}

function createClassList(initial = []) {
  const classes = new Set(initial);
  return {
    add: (className) => classes.add(className),
    remove: (className) => classes.delete(className),
    contains: (className) => classes.has(className),
    toggle: (className, force) => {
      if (force === undefined) {
        if (classes.has(className)) {
          classes.delete(className);
          return false;
        }
        classes.add(className);
        return true;
      }
      if (force) {
        classes.add(className);
        return true;
      }
      classes.delete(className);
      return false;
    },
  };
}

function createMockElement({ value = "", classes = [] } = {}) {
  const listeners = new Map();
  return {
    value,
    required: false,
    disabled: false,
    textContent: "",
    classList: createClassList(classes),
    toggleAttribute: function toggleAttribute(attr, force) {
      if (attr === "required") {
        this.required = Boolean(force);
      }
      if (attr === "disabled") {
        this.disabled = Boolean(force);
      }
    },
    addEventListener: function addEventListener(type, handler) {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(handler);
    },
    dispatchEvent: function dispatchEvent(event) {
      const handlers = listeners.get(event.type) || [];
      handlers.forEach((handler) => handler(event));
    },
  };
}

function createMockCell(col) {
  const cell = {
    dataset: { col },
    className: "",
    style: {
      background: "",
      backgroundColor: "",
      removeProperty: function removeProperty(property) {
        if (property === "background") {
          this.background = "";
        }
        if (property === "background-color") {
          this.backgroundColor = "";
        }
      },
    },
    _text: "",
    _html: "",
  };
  Object.defineProperty(cell, "textContent", {
    get: () => cell._text,
    set: (value) => {
      cell._text = value ?? "";
    },
  });
  Object.defineProperty(cell, "innerHTML", {
    get: () => cell._html,
    set: (value) => {
      cell._html = value ?? "";
      cell._text = String(value ?? "").replace(/<[^>]*>/g, "");
    },
  });
  return cell;
}

function createMockRow(cells) {
  return {
    querySelector: (selector) => {
      const match = selector.match(/\[data-col="([^"]+)"\]/);
      if (!match) {
        return null;
      }
      return cells.get(match[1]) ?? null;
    },
  };
}

function createStockEntry({
  symbol,
  history,
  lastPrice = null,
  dailyChange = null,
  monthlyChange = null,
  previousClose = null,
  dataSource = "live",
  quoteSession = "REGULAR",
  sector = "Technology",
  cap = "Large",
}) {
  return {
    symbol,
    name: symbol,
    sector,
    cap,
    history,
    lastPrice,
    dailyChange,
    monthlyChange,
    previousClose,
    dataSource,
    quoteSession,
  };
}

async function runTest(name, testFn) {
  try {
    await testFn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

const tests = [
  {
    name: "validates symbol format",
    fn: async () => {
      assert.strictEqual(isValidSymbol("AAPL"), true);
      assert.strictEqual(isValidSymbol("BRK.B"), true);
      assert.strictEqual(isValidSymbol("BRK-B"), true);
      assert.strictEqual(isValidSymbol("AAPL1"), true);
      assert.strictEqual(isValidSymbol("123"), false);
    },
  },
  {
    name: "normalizes and validates symbol input messages",
    fn: async () => {
      assert.strictEqual(normalizeSymbolInput("  brk.b "), "BRK.B");
      assert.strictEqual(normalizeSymbolInput("aapl!"), "AAPL!");
      assert.strictEqual(getSymbolValidationMessage(""), "Please enter a stock symbol.");
      assert.strictEqual(getSymbolValidationMessage("AAPL"), "");
      assert.strictEqual(
        getSymbolValidationMessage("NVDA!!!"),
        "Stock symbols must start with a letter and include up to 10 letters, numbers, dots, or hyphens (e.g. BRK.B).",
      );
    },
  },
  {
    name: "classifies scalp horizon for high volatility and weak trend",
    fn: async () => {
      const horizon = classifyTimeHorizon({ volatilityLevel: "high", trendStrength: "weak" });
      assert.strictEqual(horizon.label, "Scalp (minutes–hours)");
    },
  },
  {
    name: "classifies swing horizon for medium volatility and moderate trend",
    fn: async () => {
      const horizon = classifyTimeHorizon({ volatilityLevel: "medium", trendStrength: "moderate" });
      assert.strictEqual(horizon.label, "Swing (days)");
    },
  },
  {
    name: "classifies position horizon for low volatility and strong trend",
    fn: async () => {
      const horizon = classifyTimeHorizon({ volatilityLevel: "low", trendStrength: "strong" });
      assert.strictEqual(horizon.label, "Position (weeks)");
    },
  },
  {
    name: "top opportunities movers exclude n/a",
    fn: async () => {
      const entries = [
        createStockEntry({
          symbol: "AAA",
          history: [100, 100, 100, 100, 100, 100, 100, 100, 100, 90],
          lastPrice: null,
          dailyChange: null,
          previousClose: null,
        }),
        createStockEntry({
          symbol: "BBB",
          history: [100, 100, 100, 100, 100, 100, 100, 100, 100, 110],
          lastPrice: 110,
          dailyChange: 2.5,
        }),
        createStockEntry({
          symbol: "CCC",
          history: [100, 100, 100, 100, 100, 100, 100, 100, 100, 95],
          lastPrice: 95,
          dailyChange: -3.1,
        }),
      ];
      const groups = buildTopOpportunitiesGroups(entries);
      assert.strictEqual(groups.movers.length, 2);
      assert.deepStrictEqual(
        groups.movers.map((entry) => entry.stock.symbol).sort(),
        ["BBB", "CCC"],
      );
    },
  },
  {
    name: "top opportunities buy/sell groups respect filtered entries",
    fn: async () => {
      const buyEntry = createStockEntry({
        symbol: "BUY1",
        history: [100, 100, 100, 100, 100, 100, 100, 100, 100, 90],
        lastPrice: 90,
        dailyChange: 1.2,
      });
      const sellEntry = createStockEntry({
        symbol: "SELL1",
        history: [100, 100, 100, 100, 100, 100, 100, 100, 100, 110],
        lastPrice: 110,
      });
      const filtered = [buyEntry];
      const groups = buildTopOpportunitiesGroups(filtered);
      assert.strictEqual(groups.buy.length, 1);
      assert.strictEqual(groups.buy[0].stock.symbol, "BUY1");
      assert.strictEqual(groups.sell.length, 0);
      assert.strictEqual(groups.movers.length, 1);
      const unfilteredGroups = buildTopOpportunitiesGroups([buyEntry, sellEntry]);
      assert.strictEqual(unfilteredGroups.sell.length, 1);
    },
  },
  {
    name: "top opportunities update when filtered list changes",
    fn: async () => {
      const buyEntry = createStockEntry({
        symbol: "BUY2",
        history: [100, 100, 100, 100, 100, 100, 100, 100, 100, 90],
        lastPrice: 90,
      });
      const sellEntry = createStockEntry({
        symbol: "SELL2",
        history: [100, 100, 100, 100, 100, 100, 100, 100, 100, 110],
        lastPrice: 110,
      });
      const initialGroups = buildTopOpportunitiesGroups([buyEntry]);
      assert.strictEqual(initialGroups.buy[0].stock.symbol, "BUY2");
      assert.strictEqual(initialGroups.sell.length, 0);
      const updatedGroups = buildTopOpportunitiesGroups([sellEntry]);
      assert.strictEqual(updatedGroups.buy.length, 0);
      assert.strictEqual(updatedGroups.sell[0].stock.symbol, "SELL2");
    },
  },
  {
    name: "sorts market entries with stable ordering and n/a last",
    fn: async () => {
      const entries = [
        { symbol: "AAA", dailyChange: 1.5 },
        { symbol: "BBB", dailyChange: null },
        { symbol: "CCC", dailyChange: 1.5 },
        { symbol: "DDD", dailyChange: -2.1 },
      ];
      const sorted = sortMarketEntries(entries, "change1d");
      assert.deepStrictEqual(
        sorted.map((entry) => entry.symbol),
        ["AAA", "CCC", "DDD", "BBB"],
      );
    },
  },
  {
    name: "restores persisted form state from storage",
    fn: async () => {
      const storage = createStorage();
      persistFormState(storage, {
        symbol: " msft ",
        cash: "2500",
        risk: "high",
        positionSizing: "risk_percent",
        riskPercent: "1.5",
      });
      const restored = loadPersistedFormState(storage);
      assert.deepStrictEqual(restored, {
        symbol: "MSFT",
        cash: "2500",
        risk: "high",
        positionSizing: "risk_percent",
        riskPercent: "1.5",
      });
    },
  },
  {
    name: "shows editable risk percent input when sizing mode is risk percent",
    fn: async () => {
      const storage = createStorage();
      const positionSizingInput = createMockElement({ value: "cash" });
      const riskPercentField = createMockElement({ classes: ["hidden"] });
      const riskPercentInput = createMockElement({ value: "" });
      const riskPercentError = createMockElement({ classes: ["hidden"] });

      bindRiskPercentField({
        positionSizingInput,
        riskPercentField,
        riskPercentInput,
        riskPercentError,
        storage,
        getFormState: () => ({
          symbol: "AAPL",
          cash: "10000",
          risk: "moderate",
          positionSizing: positionSizingInput.value,
          riskPercent: riskPercentInput.value,
        }),
      });

      positionSizingInput.value = "risk_percent";
      positionSizingInput.dispatchEvent({ type: "change" });

      assert.strictEqual(riskPercentField.classList.contains("hidden"), false);
      assert.strictEqual(riskPercentInput.disabled, false);
      assert.strictEqual(riskPercentInput.required, true);

      riskPercentInput.value = "1.2";
      riskPercentInput.dispatchEvent({ type: "input" });
      assert.strictEqual(riskPercentInput.value, "1.2");
    },
  },
  {
    name: "persists risk percent input to storage and restores on reload",
    fn: async () => {
      const storage = createStorage();
      const positionSizingInput = createMockElement({ value: "risk_percent" });
      const riskPercentField = createMockElement({ classes: [] });
      const riskPercentInput = createMockElement({ value: "" });
      const riskPercentError = createMockElement({ classes: ["hidden"] });

      bindRiskPercentField({
        positionSizingInput,
        riskPercentField,
        riskPercentInput,
        riskPercentError,
        storage,
        getFormState: () => ({
          symbol: "TSLA",
          cash: "5000",
          risk: "moderate",
          positionSizing: positionSizingInput.value,
          riskPercent: riskPercentInput.value,
        }),
      });

      riskPercentInput.value = "1.7";
      riskPercentInput.dispatchEvent({ type: "input" });

      const restored = loadPersistedFormState(storage);
      assert.strictEqual(restored.riskPercent, "1.7");
      assert.strictEqual(restored.positionSizing, "risk_percent");
    },
  },
  {
    name: "allows partial risk percent typing without overwriting value",
    fn: async () => {
      const storage = createStorage();
      const positionSizingInput = createMockElement({ value: "risk_percent" });
      const riskPercentField = createMockElement({ classes: [] });
      const riskPercentInput = createMockElement({ value: "" });
      const riskPercentError = createMockElement({ classes: ["hidden"] });

      bindRiskPercentField({
        positionSizingInput,
        riskPercentField,
        riskPercentInput,
        riskPercentError,
        storage,
        getFormState: () => ({
          symbol: "NVDA",
          cash: "15000",
          risk: "moderate",
          positionSizing: positionSizingInput.value,
          riskPercent: riskPercentInput.value,
        }),
      });

      riskPercentInput.value = "0.";
      riskPercentInput.dispatchEvent({ type: "input" });

      assert.strictEqual(riskPercentInput.value, "0.");
      assert.strictEqual(riskPercentError.textContent, "");
    },
  },
  {
    name: "retries on rate limit and succeeds",
    fn: async () => {
      const fetchFn = createFetchSequence([
        createResponse({ ok: false, status: 429, json: {} }),
        createResponse({ ok: false, status: 429, json: {} }),
        createResponse({ ok: true, status: 200, json: { quoteResponse: { result: [] } } }),
      ]);
      const payload = await fetchJsonWithRetry("https://example.com", {
        fetchFn,
        timeoutMs: 5,
        maxAttempts: 3,
        provider: "Yahoo Finance",
        symbol: "AAPL",
      });
      assert.deepStrictEqual(payload, { quoteResponse: { result: [] } });
      assert.strictEqual(fetchFn.getCallCount(), 3);
    },
  },
  {
    name: "throws timeout error when request exceeds timeout",
    fn: async () => {
      const fetchFn = (url, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => {
            const error = new Error("Aborted");
            error.name = "AbortError";
            reject(error);
          });
        });
      await assert.rejects(
        () =>
          fetchJsonWithRetry("https://example.com", {
            fetchFn,
            timeoutMs: 10,
            maxAttempts: 1,
            provider: "Yahoo Finance",
            symbol: "AAPL",
          }),
        (error) => error instanceof MarketDataError && error.type === "timeout",
      );
    },
  },
  {
    name: "falls back to cached data on provider outage",
    fn: async () => {
      resetQuoteCache();
      setLastKnownQuote("AAPL", {
        price: 159,
        change: 1,
        changePct: 0.63,
        asOfTimestamp: Date.now() - 60000,
        isRealtime: false,
        session: "CLOSED",
        source: "cache",
      });

      const fetchFn = createFetchSequence([
        createResponse({ ok: false, status: 503, json: {} }),
        createResponse({ ok: false, status: 503, json: {} }),
        createResponse({ ok: false, status: 503, json: {} }),
        createResponse({ ok: false, status: 503, json: {} }),
      ]);

      const result = await getQuote("AAPL", { fetchFn, maxAttempts: 1 });
      assert.strictEqual(result.source, "cache");
    },
  },
  {
    name: "returns quote for valid symbol",
    fn: async () => {
      resetQuoteCache();
      const fetchFn = createFetchSequence([
        createResponse({
          ok: true,
          status: 200,
          json: {
            quoteResponse: {
              result: [
                {
                  symbol: "NVDA",
                  marketState: "REGULAR",
                  regularMarketPrice: 123.45,
                  regularMarketPreviousClose: 120,
                  regularMarketChange: 3.45,
                  regularMarketChangePercent: 2.88,
                  regularMarketTime: 1700000000,
                  shortName: "NVIDIA",
                  currency: "USD",
                },
              ],
            },
          },
        }),
      ]);

      const quote = await getQuote("NVDA", { fetchFn, maxAttempts: 1 });
      assert.strictEqual(quote.price, 123.45);
      assert.strictEqual(quote.session, "REGULAR");
    },
  },
  {
    name: "dedupes inflight quote requests for the same symbol",
    fn: async () => {
      resetQuoteCache();
      let callCount = 0;
      let resolveFetch = null;
      const fetchFn = () => {
        callCount += 1;
        return new Promise((resolve) => {
          resolveFetch = resolve;
        });
      };

      const quotePromise = getQuote("AAPL", { fetchFn, maxAttempts: 1 });
      const quotePromise2 = getQuote("AAPL", { fetchFn, maxAttempts: 1 });
      assert.strictEqual(callCount, 1);
      resolveFetch(
        createResponse({
          ok: true,
          status: 200,
          json: {
            quoteResponse: {
              result: [
                {
                  symbol: "AAPL",
                  marketState: "REGULAR",
                  regularMarketPrice: 189.5,
                  regularMarketPreviousClose: 188.1,
                  regularMarketChange: 1.4,
                  regularMarketChangePercent: 0.74,
                  regularMarketTime: 1700000000,
                  shortName: "Apple",
                  currency: "USD",
                },
              ],
            },
          },
        }),
      );
      const [quoteA, quoteB] = await Promise.all([quotePromise, quotePromise2]);
      assert.strictEqual(quoteA.price, 189.5);
      assert.strictEqual(quoteB.price, 189.5);
    },
  },
  {
    name: "reuses cached historical data within TTL",
    fn: async () => {
      resetQuoteCache();
      const fetchFn = createFetchSequence([
        createResponse({
          ok: true,
          status: 200,
          json: {
            chart: {
              result: [
                {
                  timestamp: [1700000000, 1700086400, 1700172800],
                  indicators: {
                    quote: [
                      {
                        close: [100, 101, 102],
                      },
                    ],
                  },
                },
              ],
            },
          },
        }),
      ]);

      const first = await fetchHistoricalSeries("AAPL", { fetchFn, maxAttempts: 1 });
      const second = await fetchHistoricalSeries("AAPL", { fetchFn, maxAttempts: 1 });
      assert.deepStrictEqual(first, second);
      assert.strictEqual(fetchFn.getCallCount(), 1);
    },
  },
  {
    name: "maps pre and post market states from provider",
    fn: async () => {
      const preQuote = await getQuote("AAPL", {
        allowFetch: false,
        useCache: false,
        prefetchedQuote: {
          symbol: "AAPL",
          marketState: "PRE",
          preMarketPrice: 181,
          preMarketTime: 1700000100,
          shortName: "Apple",
        },
      });
      const postQuote = await getQuote("AAPL", {
        allowFetch: false,
        useCache: false,
        prefetchedQuote: {
          symbol: "AAPL",
          marketState: "POST",
          postMarketPrice: 179,
          postMarketTime: 1700000200,
          shortName: "Apple",
        },
      });
      assert.strictEqual(preQuote.session, "PRE");
      assert.strictEqual(postQuote.session, "POST");
      assert.strictEqual(preQuote.isRealtime, true);
      assert.strictEqual(postQuote.isRealtime, true);
    },
  },
  {
    name: "normalizes epoch timestamps to milliseconds",
    fn: async () => {
      const secondsQuote = await getQuote("MSFT", {
        allowFetch: false,
        prefetchedQuote: {
          symbol: "MSFT",
          marketState: "REGULAR",
          regularMarketPrice: 310,
          regularMarketPreviousClose: 305,
          regularMarketChange: 5,
          regularMarketChangePercent: 1.64,
          regularMarketTime: 1700000000,
        },
      });
      const millisQuote = await getQuote("MSFT", {
        allowFetch: false,
        prefetchedQuote: {
          symbol: "MSFT",
          marketState: "REGULAR",
          regularMarketPrice: 311,
          regularMarketPreviousClose: 305,
          regularMarketChange: 6,
          regularMarketChangePercent: 1.97,
          regularMarketTime: 1700000000000,
        },
      });
      assert.strictEqual(secondsQuote.asOfTimestamp, 1700000000000);
      assert.strictEqual(millisQuote.asOfTimestamp, 1700000000000);
    },
  },
  {
    name: "derives session from Yahoo marketState values",
    fn: async () => {
      assert.strictEqual(
        deriveMarketSession({ marketState: "REGULAR" }),
        "REGULAR",
      );
      assert.strictEqual(deriveMarketSession({ marketState: "PRE" }), "PRE");
      assert.strictEqual(deriveMarketSession({ marketState: "POST" }), "POST");
      assert.strictEqual(deriveMarketSession({ marketState: "CLOSED" }), "CLOSED");
    },
  },
  {
    name: "derives regular session when regularMarketTime is recent",
    fn: async () => {
      const now = 1700000000000;
      assert.strictEqual(
        deriveMarketSession({ regularMarketTime: 1700000000 }, now),
        "REGULAR",
      );
      assert.strictEqual(
        deriveMarketSession({ regularMarketTime: 1699998500 }, now),
        "CLOSED",
      );
    },
  },
  {
    name: "falls back to cached data on rate limit",
    fn: async () => {
      resetQuoteCache();
      setLastKnownQuote("AAPL", {
        price: 160,
        change: 0.5,
        changePct: 0.3,
        asOfTimestamp: Date.now() - 60000,
        isRealtime: false,
        session: "CLOSED",
        source: "cache",
      });
      const fetchFn = createFetchSequence([
        createResponse({ ok: false, status: 429, json: {} }),
      ]);
      const result = await getQuote("AAPL", { fetchFn, maxAttempts: 1 });
      assert.strictEqual(result.source, "cache");
    },
  },
  {
    name: "falls back to cached data on timeout",
    fn: async () => {
      resetQuoteCache();
      setLastKnownQuote("MSFT", {
        price: 310,
        change: -1,
        changePct: -0.32,
        asOfTimestamp: Date.now() - 60000,
        isRealtime: false,
        session: "CLOSED",
        source: "cache",
      });
      const fetchFn = (url, { signal }) =>
        new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => {
            const error = new Error("Aborted");
            error.name = "AbortError";
            reject(error);
          });
        });
      const result = await getQuote("MSFT", { fetchFn, maxAttempts: 1, timeoutMs: 5 });
      assert.strictEqual(result.source, "cache");
    },
  },
  {
    name: "throws invalid symbol error when provider reports not found",
    fn: async () => {
      resetQuoteCache();
      const fetchFn = createFetchSequence([
        createResponse({ ok: true, status: 200, json: { quoteResponse: { result: [] } } }),
        createResponse({
          ok: true,
          status: 200,
          json: { chart: { error: { code: "Not Found", description: "No data found." } } },
        }),
      ]);

      await assert.rejects(
        () => getQuote("NOTAREAL", { fetchFn, maxAttempts: 1 }),
        (error) => error instanceof MarketDataError && error.type === "invalid_symbol",
      );
    },
  },
  {
    name: "returns closed session quote when market is closed",
    fn: async () => {
      const quote = await getQuote("AAPL", {
        allowFetch: false,
        prefetchedQuote: {
          symbol: "AAPL",
          marketState: "CLOSED",
          regularMarketPrice: 180,
          regularMarketPreviousClose: 178,
          regularMarketChange: 2,
          regularMarketChangePercent: 1.12,
          regularMarketTime: 1700000000,
          shortName: "Apple",
        },
      });
      assert.strictEqual(quote.session, "CLOSED");
      assert.strictEqual(quote.isRealtime, false);
    },
  },
  {
    name: "marks quotes as unavailable when provider returns empty results",
    fn: async () => {
      resetQuoteCache();
      setLastKnownQuote("TSLA", {
        price: 245,
        change: 2,
        changePct: 0.82,
        asOfTimestamp: Date.now() - 60000,
        isRealtime: true,
        session: "REGULAR",
        source: "cache",
      });
      const fetchFn = createFetchSequence([
        createResponse({ ok: true, status: 200, json: { quoteResponse: { result: [] } } }),
      ]);
      const quote = await getQuote("TSLA", { fetchFn, maxAttempts: 1 });
      assert.strictEqual(quote.session, "REGULAR");
      assert.strictEqual(quote.unavailable, true);
      assert.strictEqual(quote.source, "cache");
    },
  },
  {
    name: "labels session badge for market indicator",
    fn: async () => {
      const indicator = getMarketIndicatorData({
        quoteSession: "PRE",
        dataSource: "primary",
        quoteAsOf: Date.now(),
      });
      const cachedIndicator = getMarketIndicatorData({
        quoteSession: "REGULAR",
        dataSource: "cache",
        quoteAsOf: Date.now(),
        lastPrice: 101,
      });
      assert.strictEqual(indicator.sessionBadge.label, "PRE");
      assert.strictEqual(cachedIndicator.sessionBadge.label, "REGULAR");
    },
  },
  {
    name: "renders as-of label in UTC",
    fn: async () => {
      const timestamp = Date.UTC(2024, 0, 1, 12, 30, 0);
      const asOf = `As of ${formatTimestamp(timestamp)} UTC`;
      assert.strictEqual(asOf, "As of 12:30 UTC");
      const indicator = getMarketIndicatorData({
        quoteSession: "REGULAR",
        dataSource: "primary",
        quoteAsOf: timestamp,
      });
      assert.strictEqual(indicator.asOfLabel, "As of 12:30 UTC");
    },
  },
  {
    name: "shows open status and realtime or delayed freshness during regular session",
    fn: async () => {
      const realtimeIndicator = getMarketIndicatorData({
        quoteSession: "REGULAR",
        dataSource: "primary",
        quoteAsOf: Date.now(),
        isRealtime: true,
        lastPrice: 188,
      });
      const delayedIndicator = getMarketIndicatorData({
        quoteSession: "DELAYED",
        dataSource: "delayed",
        quoteAsOf: Date.now(),
        isRealtime: false,
        lastPrice: 188,
      });
      assert.strictEqual(realtimeIndicator.marketStatus, "Open");
      assert.strictEqual(realtimeIndicator.sourceBadge.label, "REALTIME");
      assert.strictEqual(delayedIndicator.marketStatus, "Open");
      assert.strictEqual(delayedIndicator.sourceBadge.label, "DELAYED");
    },
  },
  {
    name: "uses cached data for market status when provider is unavailable",
    fn: async () => {
      const cachedIndicator = getMarketIndicatorData({
        quoteSession: "REGULAR",
        dataSource: "cache",
        quoteAsOf: Date.now(),
        lastPrice: 150,
      });
      assert.strictEqual(cachedIndicator.marketStatus, "Open");
      assert.strictEqual(cachedIndicator.sourceBadge.label, "CACHED");
      assert.notStrictEqual(cachedIndicator.marketStatus, "Unavailable");
    },
  },
  {
    name: "shows unavailable only when no data is present",
    fn: async () => {
      const indicator = getMarketIndicatorData(null);
      assert.strictEqual(indicator.marketStatus, "Unavailable");
      assert.strictEqual(indicator.sessionBadge.label, "UNKNOWN");
      assert.strictEqual(indicator.sourceBadge.label, "UNAVAILABLE");
      assert.strictEqual(indicator.asOfLabel, "No data");
    },
  },
  {
    name: "hydrates cached quotes for immediate table display",
    fn: async () => {
      resetQuoteCache();
      setLastKnownQuote("AAPL", {
        price: 150.25,
        change: 1.75,
        changePct: 1.18,
        asOfTimestamp: Date.now() - 60000,
        isRealtime: false,
        session: "CLOSED",
        source: "cache",
      });
      hydrateMarketStateFromCache();
      const stock = getStockEntry("AAPL");
      const display = getMarketRowDisplay(stock);
      assert.notStrictEqual(display.priceDisplay, "Price unavailable");
      assert.notStrictEqual(display.changeDisplay, "n/a");
      assert.strictEqual(display.badge.label, "CACHED");
    },
  },
  {
    name: "keeps symbols from awaiting quote once cached data exists",
    fn: async () => {
      resetQuoteCache();
      setLastKnownQuote("MSFT", {
        price: 312.5,
        change: 2.1,
        changePct: 0.68,
        asOfTimestamp: Date.now() - 60000,
        isRealtime: false,
        session: "CLOSED",
        source: "cache",
      });
      hydrateMarketStateFromCache();
      const stock = getStockEntry("MSFT");
      const display = getMarketRowDisplay(stock);
      assert.notStrictEqual(display.meta, "Awaiting quote");
    },
  },
  {
    name: "uses historical data to avoid awaiting quote after refresh",
    fn: async () => {
      const stock = getStockEntry("NVDA");
      updateStockWithQuote(stock, {
        price: null,
        change: null,
        changePct: null,
        asOfTimestamp: null,
        isRealtime: false,
        session: "UNKNOWN",
        source: "unavailable",
      });
      const now = Date.now();
      updateStockWithHistorical(stock, {
        closes: [120, 121, 123],
        timestamps: [now - 2 * 86400000, now - 86400000, now],
      });
      const display = getMarketRowDisplay(stock);
      assert.notStrictEqual(display.meta, "Awaiting quote");
      assert.notStrictEqual(display.priceDisplay, "Price unavailable");
    },
  },
  {
    name: "keeps cached values when live quote fetch fails",
    fn: async () => {
      resetQuoteCache();
      setLastKnownQuote("AAPL", {
        price: 148.1,
        change: -0.9,
        changePct: -0.6,
        asOfTimestamp: Date.now() - 30000,
        isRealtime: false,
        session: "CLOSED",
        source: "cache",
      });
      const fetchFn = createFetchSequence([
        createResponse({ ok: false, status: 503, json: {} }),
      ]);
      const quote = await getQuote("AAPL", { fetchFn, maxAttempts: 1 });
      const stock = getStockEntry("AAPL");
      updateStockWithQuote(stock, quote);
      const display = getMarketRowDisplay(stock);
      assert.strictEqual(quote.source, "cache");
      assert.notStrictEqual(display.priceDisplay, "Price unavailable");
    },
  },
  {
    name: "does not concatenate change and 1D change values",
    fn: async () => {
      const stock = getStockEntry("AAPL");
      updateStockWithQuote(stock, {
        price: 98,
        change: -2,
        changePct: -2.0,
        asOfTimestamp: Date.now(),
        isRealtime: true,
        session: "REGULAR",
        source: "primary",
      });
      updateStockWithHistorical(stock, {
        closes: [100, 99, 98],
        timestamps: [Date.now() - 2 * 86400000, Date.now() - 86400000, Date.now()],
      });
      const display = getMarketRowDisplay(stock);
      assert.ok(display.changeDisplay.includes("("));
      assert.strictEqual(display.dayDisplay.endsWith("%"), true);
      assert.strictEqual(display.changeDisplay.includes(display.dayDisplay), false);
    },
  },
  {
    name: "keeps actions cells free of heatmap classes and inline background styles",
    fn: async () => {
      const perfCell = createMockCell("perf");
      const analyzeCell = createMockCell("actions");
      analyzeCell.className = "actions-cell price-change positive num-cell";
      analyzeCell.style.background = "rgba(29, 122, 74, 0.2)";
      analyzeCell.style.backgroundColor = "rgba(29, 122, 74, 0.2)";
      const cells = new Map([
        ["symbol", createMockCell("symbol")],
        ["company", createMockCell("company")],
        ["sector", createMockCell("sector")],
        ["cap", createMockCell("cap")],
        ["signal", createMockCell("signal")],
        ["horizon", createMockCell("horizon")],
        ["price", createMockCell("price")],
        ["perf", perfCell],
        ["actions", analyzeCell],
      ]);
      const row = createMockRow(cells);
      const stock = {
        symbol: "AAPL",
        name: "Apple",
        sector: "Technology",
        cap: "Large",
        history: [98, 100, 101],
        lastPrice: 101,
        previousClose: 100,
        lastChange: 1,
        lastChangePct: 1,
        dailyChange: 1.2,
        monthlyChange: -2.4,
      };

      updateMarketRowCells(row, stock);

      assert.ok(perfCell.innerHTML.includes("Change"));
      assert.ok(perfCell.innerHTML.includes("1D"));
      assert.ok(perfCell.innerHTML.includes("1M"));
      assert.ok(perfCell.innerHTML.includes("1Y"));
      assert.strictEqual(analyzeCell.className.includes("price-change"), false);
      assert.strictEqual(analyzeCell.className.includes("positive"), false);
      assert.strictEqual(analyzeCell.className.includes("actions-cell"), true);
      assert.strictEqual(analyzeCell.style.background, "");
      assert.strictEqual(analyzeCell.style.backgroundColor, "");
      assert.strictEqual(analyzeCell.innerHTML.includes("Analyze"), true);
      assert.strictEqual(analyzeCell.innerHTML.includes("data-action=\"remove\""), true);
    },
  },
  {
    name: "renders actions cell with analyze and remove controls without wrapping",
    fn: async () => {
      const cells = new Map(
        getMarketTableColumnKeys().map((key) => [key, createMockCell(key)]),
      );
      const row = createMockRow(cells);
      updateMarketRowCells(row, {
        symbol: "NFLX",
        name: "Netflix",
        sector: "Technology",
        cap: "Large",
        history: [320, 330, 325],
        lastPrice: 325,
        previousClose: 320,
        lastChange: 5,
        lastChangePct: 1.56,
        dailyChange: 0.8,
        monthlyChange: 2.4,
        yearlyChange: 12.1,
        quoteAsOf: Date.now(),
        lastUpdatedAt: null,
        lastHistoricalTimestamp: null,
        quoteSession: "REGULAR",
        dataSource: "live",
        exchangeTimezoneName: "America/New_York",
      });

      const actionsCell = cells.get("actions");
      assert.ok(actionsCell.innerHTML.includes("class=\"actions-group\""));
      assert.ok(actionsCell.innerHTML.includes("class=\"analyze-button\""));
      assert.ok(actionsCell.innerHTML.includes("class=\"icon-button remove-button\""));
      assert.ok(actionsCell.innerHTML.includes("data-action=\"analyze\""));
      assert.ok(actionsCell.innerHTML.includes("data-action=\"remove\""));
      assert.ok(actionsCell.innerHTML.includes("Analyze"));
      assert.strictEqual(actionsCell.innerHTML.includes("hidden"), false);
      assert.strictEqual(actionsCell.innerHTML.includes("<br"), false);
    },
  },
  {
    name: "keeps cached market status when unavailable quote is returned",
    fn: async () => {
      const stock = getStockEntry("AAPL");
      updateStockWithQuote(stock, {
        price: 148.1,
        change: -0.9,
        changePct: -0.6,
        asOfTimestamp: Date.now() - 30000,
        isRealtime: false,
        session: "REGULAR",
        source: "cache",
      });
      updateStockWithQuote(stock, {
        price: 148.1,
        change: -0.9,
        changePct: -0.6,
        asOfTimestamp: Date.now() - 10000,
        isRealtime: false,
        session: "UNKNOWN",
        source: "cache",
        unavailable: true,
      });
      const indicator = getMarketIndicatorData(stock);
      assert.strictEqual(stock.quoteSession, "REGULAR");
      assert.strictEqual(indicator.marketStatus, "Open");
      assert.strictEqual(indicator.sourceBadge.label, "CACHED");
    },
  },
  {
    name: "keeps cached session open after live quote fetch failure",
    fn: async () => {
      resetQuoteCache();
      setLastKnownQuote("AAPL", {
        price: 445.2,
        change: 1.1,
        changePct: 0.25,
        asOfTimestamp: Date.now() - 30000,
        isRealtime: true,
        session: "REGULAR",
        source: "cache",
      });
      const fetchFn = createFetchSequence([createResponse({ ok: false, status: 503, json: {} })]);
      const quote = await getQuote("AAPL", { fetchFn, maxAttempts: 1 });
      const stock = getStockEntry("AAPL");
      updateStockWithQuote(stock, quote);
      const indicator = getMarketIndicatorData(stock);
      assert.strictEqual(stock.quoteSession, "REGULAR");
      assert.strictEqual(indicator.marketStatus, "Open");
      assert.strictEqual(indicator.sourceBadge.label, "CACHED");
    },
  },
  {
    name: "adjusts refresh delay by session and pauses when hidden",
    fn: async () => {
      const regularStock = getStockEntry("AAPL");
      updateStockWithQuote(regularStock, {
        price: 101,
        change: 0.5,
        changePct: 0.5,
        asOfTimestamp: Date.now(),
        isRealtime: true,
        session: "REGULAR",
        source: "primary",
      });
      const preStock = getStockEntry("MSFT");
      updateStockWithQuote(preStock, {
        price: 201,
        change: 0.5,
        changePct: 0.25,
        asOfTimestamp: Date.now(),
        isRealtime: true,
        session: "PRE",
        source: "extended",
      });
      const closedStock = getStockEntry("NVDA");
      updateStockWithQuote(closedStock, {
        price: 301,
        change: 0.5,
        changePct: 0.2,
        asOfTimestamp: Date.now(),
        isRealtime: false,
        session: "CLOSED",
        source: "closed",
      });
      const regularDelay = getNextRefreshDelay({
        symbols: ["AAPL"],
        visible: true,
        backoffActive: false,
      });
      assert.strictEqual(regularDelay, 5000);
      const preDelay = getNextRefreshDelay({
        symbols: ["MSFT"],
        visible: true,
        backoffActive: false,
      });
      assert.strictEqual(preDelay, 12000);
      const closedDelay = getNextRefreshDelay({
        symbols: ["NVDA"],
        visible: true,
        backoffActive: false,
      });
      assert.strictEqual(closedDelay, 300000);
      const hiddenDelay = getNextRefreshDelay({
        symbols: ["AAPL"],
        visible: false,
        backoffActive: false,
      });
      assert.strictEqual(hiddenDelay, null);
    },
  },
  {
    name: "backs off refresh interval after rate limit",
    fn: async () => {
      const stock = getStockEntry("AAPL");
      updateStockWithQuote(stock, {
        price: 99,
        change: 0.1,
        changePct: 0.1,
        asOfTimestamp: Date.now(),
        isRealtime: true,
        session: "REGULAR",
        source: "primary",
      });
      applyRateLimitBackoff();
      assert.strictEqual(isRateLimitBackoffActive(), true);
      const backedOff = getNextRefreshDelay({
        symbols: ["AAPL"],
        visible: true,
        backoffActive: true,
      });
      assert.strictEqual(backedOff, 10000);
    },
  },
  {
    name: "calculates ATR-like volatility from price history",
    fn: async () => {
      const atr = calculateAtrLike([100, 102, 104], 2);
      assert.strictEqual(atr, 2);
    },
  },
  {
    name: "builds a trade plan with 2R take-profit and risk sizing",
    fn: async () => {
      const plan = calculateTradePlan({
        action: "buy",
        entryPrice: 100,
        priceLabel: "Last close",
        priceAsOf: null,
        prices: [100, 102, 99, 101, 100, 98, 99, 101, 100, 99],
        cash: 10000,
        risk: "moderate",
      });
      assert.ok(plan.stopLoss < 100);
      assert.strictEqual(plan.takeProfit, 100 + 2 * (100 - plan.stopLoss));
      assert.strictEqual(plan.riskReward.toFixed(2), "2.00");
      assert.ok(plan.positionSize > 0);
      assert.notStrictEqual(plan.stopLossDisplay, "n/a");
      assert.notStrictEqual(plan.takeProfitDisplay, "n/a");
    },
  },
  {
    name: "sizes positions from risk percent and clamps to available cash",
    fn: async () => {
      const prices = [10, 10, 10, 10, 9.9, 10, 10, 10, 10, 10, 10];
      const plan = calculateTradePlan({
        action: "buy",
        entryPrice: 10,
        priceLabel: "Last close",
        priceAsOf: null,
        prices,
        cash: 1000,
        risk: "moderate",
        positionSizingMode: "risk_percent",
        riskPercent: 5,
      });
      assert.strictEqual(plan.riskAmount, 50);
      assert.strictEqual(plan.positionSize, 100);
      assert.ok(plan.stopDistance > 0);
    },
  },
  {
    name: "uses risk percent sizing for short trades",
    fn: async () => {
      const prices = Array.from({ length: 12 }, () => 100);
      const plan = calculateTradePlan({
        action: "sell",
        entryPrice: 100,
        priceLabel: "Last close",
        priceAsOf: null,
        prices,
        cash: 10000,
        risk: "moderate",
        positionSizingMode: "risk_percent",
        riskPercent: 1,
      });
      assert.strictEqual(plan.riskAmount, 100);
      assert.strictEqual(plan.positionSize, 33);
      assert.ok(plan.stopDistance > 0);
    },
  },
  {
    name: "builds hold plan with breakout and breakdown levels",
    fn: async () => {
      const plan = calculateTradePlan({
        action: "hold",
        entryPrice: 105,
        priceLabel: "Last close",
        priceAsOf: null,
        prices: [96, 98, 100, 102, 101, 103, 104, 106, 105, 107, 108, 109],
        cash: 10000,
        risk: "moderate",
      });
      assert.strictEqual(plan.entryDisplay, "No position recommended");
      assert.ok(plan.holdLevels);
      assert.ok(plan.holdLevels.breakoutLevel >= plan.holdLevels.breakdownLevel);
      assert.ok(plan.holdLevels.breakoutTrigger.includes("=> BUY"));
      assert.ok(plan.holdLevels.breakdownTrigger.includes("=> SELL"));
      assert.notStrictEqual(plan.stopLossDisplay, "n/a");
      assert.notStrictEqual(plan.takeProfitDisplay, "n/a");
    },
  },
  {
    name: "creates 3-5 signal reasons",
    fn: async () => {
      const reasons = buildSignalReasons({
        action: "buy",
        recent: 100,
        average: 102,
        dailyChange: -1,
        monthlyChange: 3,
        atrPercent: 1.5,
      });
      assert.ok(reasons.length >= 3 && reasons.length <= 5);
    },
  },
  {
    name: "creates invalidation rules for all signal types",
    fn: async () => {
      const scenarios = ["buy", "sell", "hold"];
      scenarios.forEach((action) => {
        const rules = buildInvalidationRules({
          action,
          recent: 100,
          average: 102,
          dailyChange: -0.6,
          monthlyChange: 1.2,
          atrPercent: 4.5,
        });
        assert.ok(rules.length >= 2 && rules.length <= 3);
        rules.forEach((rule) => assert.ok(rule.trim().length > 0));
      });
    },
  },
  {
    name: "maps confidence score to label thresholds",
    fn: async () => {
      assert.strictEqual(getConfidenceLabel(0), "Low");
      assert.strictEqual(getConfidenceLabel(39), "Low");
      assert.strictEqual(getConfidenceLabel(40), "Medium");
      assert.strictEqual(getConfidenceLabel(69), "Medium");
      assert.strictEqual(getConfidenceLabel(70), "High");
      assert.strictEqual(getConfidenceLabel(100), "High");
    },
  },
  {
    name: "calculates deterministic signal scores",
    fn: async () => {
      const prices = [100, 102, 101, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115];
      const score = calculateSignalScore({
        recent: 115,
        average: 110,
        dailyChange: 1.2,
        monthlyChange: 6.0,
        atrPercent: 2.5,
        prices,
        tradePlan: { stopLoss: 110 },
      });
      assert.strictEqual(score.total, 50);
      assert.deepStrictEqual(
        score.components.map((component) => component.score),
        [27, 7, 12, 4, 0],
      );
    },
  },
  {
    name: "fills symbol and auto-runs analysis from market row action",
    fn: async () => {
      let filledSymbol = null;
      let didScroll = false;
      let didSubmit = false;
      const result = handleMarketRowAction({
        symbol: " aapl ",
        autoRun: true,
        onFillSymbol: (value) => {
          filledSymbol = value;
        },
        onScrollToForm: () => {
          didScroll = true;
        },
        onSubmit: () => {
          didSubmit = true;
        },
      });
      assert.strictEqual(filledSymbol, "AAPL");
      assert.strictEqual(didScroll, true);
      assert.strictEqual(didSubmit, true);
      assert.deepStrictEqual(result, { symbol: "AAPL", autoRun: true });
    },
  },
  {
    name: "fills symbol without auto-run when disabled",
    fn: async () => {
      let didSubmit = false;
      let filledSymbol = null;
      const result = handleMarketRowAction({
        symbol: "msft",
        autoRun: false,
        onFillSymbol: (value) => {
          filledSymbol = value;
        },
        onSubmit: () => {
          didSubmit = true;
        },
      });
      assert.strictEqual(filledSymbol, "MSFT");
      assert.strictEqual(didSubmit, false);
      assert.deepStrictEqual(result, { symbol: "MSFT", autoRun: false });
    },
  },
  {
    name: "renders change summary and sub-metrics inside the performance cell",
    fn: async () => {
      const cells = new Map([
        ["symbol", createMockCell("symbol")],
        ["perf", createMockCell("perf")],
      ]);
      const row = createMockRow(cells);
      updateMarketRowCells(row, {
        symbol: "TEST",
        name: "Test Corp",
        sector: "Technology",
        cap: "Large",
        history: [],
        lastPrice: 100,
        previousClose: 102.68,
        lastChange: -2.68,
        lastChangePct: -1.04,
        dailyChange: null,
        monthlyChange: 5,
        quoteAsOf: null,
        lastUpdatedAt: null,
        lastHistoricalTimestamp: null,
        quoteSession: "REGULAR",
        dataSource: "live",
        exchangeTimezoneName: null,
      });

      const perfCell = cells.get("perf");
      assert.ok(perfCell.textContent.includes("-2.68"));
      assert.ok(perfCell.textContent.includes("-1.04%"));
      assert.ok(perfCell.textContent.includes("1Y"));
    },
  },
  {
    name: "keeps performance content isolated from actions",
    fn: async () => {
      const cells = new Map([
        ["symbol", createMockCell("symbol")],
        ["perf", createMockCell("perf")],
        ["actions", createMockCell("actions")],
      ]);
      const row = createMockRow(cells);
      updateMarketRowCells(row, {
        symbol: "LONG",
        name: "Long Form",
        sector: "Energy",
        cap: "Large",
        history: [],
        lastPrice: 1000,
        previousClose: 900,
        lastChange: 100.1234,
        lastChangePct: 12.3456,
        dailyChange: -0.5,
        monthlyChange: null,
        quoteAsOf: null,
        lastUpdatedAt: null,
        lastHistoricalTimestamp: null,
        quoteSession: "REGULAR",
        dataSource: "live",
        exchangeTimezoneName: null,
      });

      const perfCell = cells.get("perf");
      const actionsCell = cells.get("actions");
      assert.ok(perfCell.textContent.includes("+100.12"));
      assert.ok(perfCell.textContent.includes("-0.5%"));
      assert.strictEqual(actionsCell.textContent.includes("+100.12"), false);
    },
  },
  {
    name: "keeps market table columns aligned with header order",
    fn: async () => {
      const html = fs.readFileSync(path.join(__dirname, "..", "live.html"), "utf8");
      const headerCols = Array.from(html.matchAll(/<th[^>]*data-col="([^"]+)"/g)).map(
        (match) => match[1],
      );
      const headerTextIncludesPerformance = html.includes(">Performance<");
      const columnKeys = getMarketTableColumnKeys();
      const rowCols = Array.from(buildMarketRowMarkup().matchAll(/data-col="([^"]+)"/g)).map(
        (match) => match[1],
      );
      assert.strictEqual(headerTextIncludesPerformance, true);
      assert.deepStrictEqual(columnKeys, headerCols);
      assert.deepStrictEqual(rowCols, columnKeys);
      assert.strictEqual(rowCols.length, headerCols.length);
    },
  },
  {
    name: "renders performance cell with 1Y label and prevents desktop overflow",
    fn: async () => {
      const html = fs.readFileSync(path.join(__dirname, "..", "live.html"), "utf8");
      const headerCols = Array.from(html.matchAll(/<th[^>]*data-col="([^"]+)"/g)).map(
        (match) => match[1],
      );
      const rowCols = Array.from(buildMarketRowMarkup().matchAll(/data-col="([^"]+)"/g)).map(
        (match) => match[1],
      );
      assert.strictEqual(headerCols.length, rowCols.length);

      const cells = new Map(
        getMarketTableColumnKeys().map((key) => [key, createMockCell(key)]),
      );
      const row = createMockRow(cells);
      updateMarketRowCells(row, {
        symbol: "AAPL",
        name: "Apple",
        sector: "Technology",
        cap: "Large",
        history: [100, 101, 102],
        lastPrice: 102,
        previousClose: 101,
        lastChange: 1,
        lastChangePct: 0.99,
        dailyChange: 1.25,
        monthlyChange: 2.5,
        yearlyChange: 12.4,
        quoteAsOf: Date.now(),
        lastUpdatedAt: null,
        lastHistoricalTimestamp: null,
        quoteSession: "REGULAR",
        dataSource: "live",
        exchangeTimezoneName: "America/New_York",
      });

      const perfCell = cells.get("perf");
      assert.ok(perfCell.innerHTML.includes("1Y"));

      const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
      assert.ok(
        /@media \(min-width: 1280px\)[\s\S]*?\.market-table[\s\S]*?overflow-x:\s*hidden/.test(
          css,
        ),
      );
    },
  },
  {
    name: "keeps market table rows aligned and actions cell isolated",
    fn: async () => {
      const html = fs.readFileSync(path.join(__dirname, "..", "live.html"), "utf8");
      const headerCols = Array.from(html.matchAll(/<th[^>]*data-col="([^"]+)"/g)).map(
        (match) => match[1],
      );
      const rowCols = Array.from(buildMarketRowMarkup().matchAll(/data-col="([^"]+)"/g)).map(
        (match) => match[1],
      );
      assert.strictEqual(html.includes(">Performance<"), true);
      assert.strictEqual(rowCols.length, headerCols.length);

      const cells = new Map(
        getMarketTableColumnKeys().map((key) => [key, createMockCell(key)]),
      );
      const actionsCell = cells.get("actions");
      actionsCell.className = "actions-cell price-change positive num-cell";
      actionsCell.style.background = "rgba(29, 122, 74, 0.2)";
      actionsCell.style.backgroundColor = "rgba(29, 122, 74, 0.2)";
      const row = createMockRow(cells);
      updateMarketRowCells(row, {
        symbol: "META",
        name: "Meta Platforms",
        sector: "Technology",
        cap: "Large",
        history: [100, 102, 105, 104],
        lastPrice: 104,
        previousClose: 102,
        lastChange: 2,
        lastChangePct: 1.96,
        dailyChange: 1.1,
        monthlyChange: 3.2,
        yearlyChange: 12.5,
        quoteAsOf: Date.now(),
        lastUpdatedAt: null,
        lastHistoricalTimestamp: null,
        quoteSession: "REGULAR",
        dataSource: "live",
        exchangeTimezoneName: "America/New_York",
      });

      const actionsMarkup = actionsCell.innerHTML.trim();
      assert.ok(actionsMarkup.includes("Analyze"));
      assert.ok(actionsMarkup.includes("data-action=\"remove\""));
      assert.strictEqual(actionsCell.className.includes("price-change"), false);
      assert.strictEqual(actionsCell.style.background, "");
      assert.strictEqual(actionsCell.style.backgroundColor, "");
    },
  },
  {
    name: "writes 1D change into the performance cell and keeps actions clean",
    fn: async () => {
      const cells = new Map(
        getMarketTableColumnKeys().map((key) => [key, createMockCell(key)]),
      );
      const row = createMockRow(cells);
      updateMarketRowCells(row, {
        symbol: "AAPL",
        name: "Apple",
        sector: "Technology",
        cap: "Large",
        history: [100, 101, 102],
        lastPrice: 102,
        previousClose: 101,
        lastChange: 1,
        lastChangePct: 0.99,
        dailyChange: 1.25,
        monthlyChange: 2.5,
        quoteAsOf: Date.now(),
        lastUpdatedAt: null,
        lastHistoricalTimestamp: null,
        quoteSession: "REGULAR",
        dataSource: "live",
        exchangeTimezoneName: "America/New_York",
      });

      const perfCell = cells.get("perf");
      const actionsCell = cells.get("actions");
      assert.ok(perfCell.textContent.includes("1D"));
      assert.ok(perfCell.textContent.includes("%"));
      assert.ok(actionsCell.textContent.includes("Analyze"));
    },
  },
  {
    name: "writes 1M and 1Y change values into the performance cell",
    fn: async () => {
      const cells = new Map(
        getMarketTableColumnKeys().map((key) => [key, createMockCell(key)]),
      );
      const row = createMockRow(cells);
      updateMarketRowCells(row, {
        symbol: "NVDA",
        name: "NVIDIA",
        sector: "Technology",
        cap: "Large",
        history: [90, 100, 110, 120],
        lastPrice: 120,
        previousClose: 110,
        lastChange: 10,
        lastChangePct: 9.1,
        dailyChange: 2.1,
        monthlyChange: 5.5,
        yearlyChange: -12.4,
        quoteAsOf: Date.now(),
        lastUpdatedAt: null,
        lastHistoricalTimestamp: null,
        quoteSession: "REGULAR",
        dataSource: "live",
        exchangeTimezoneName: "America/New_York",
      });

      const perfCell = cells.get("perf");
      assert.ok(perfCell.textContent.includes("1M"));
      assert.ok(perfCell.textContent.includes("1Y"));
      assert.ok(perfCell.textContent.includes("5.5"));
      assert.ok(perfCell.textContent.includes("-12.4"));
    },
  },
  {
    name: "renders muted placeholders for 1M and 1Y when history is missing",
    fn: async () => {
      const cells = new Map(
        getMarketTableColumnKeys().map((key) => [key, createMockCell(key)]),
      );
      const row = createMockRow(cells);
      updateMarketRowCells(row, {
        symbol: "PLTR",
        name: "Palantir",
        sector: "Technology",
        cap: "Mid",
        history: [],
        lastPrice: 15,
        previousClose: 14.8,
        lastChange: 0.2,
        lastChangePct: 1.35,
        dailyChange: null,
        monthlyChange: null,
        yearlyChange: null,
        quoteAsOf: Date.now(),
        lastUpdatedAt: null,
        lastHistoricalTimestamp: null,
        quoteSession: "REGULAR",
        dataSource: "live",
        exchangeTimezoneName: "America/New_York",
      });

      const perfCell = cells.get("perf");
      assert.ok(perfCell.textContent.includes("1M"));
      assert.ok(perfCell.textContent.includes("1Y"));
      assert.ok(perfCell.textContent.includes("—"));
    },
  },
  {
    name: "scrolls to the signal result after rendering",
    fn: async () => {
      let scrollCalls = 0;
      const element = {
        scrollIntoView: () => {
          scrollCalls += 1;
        },
        classList: {
          add: () => {},
          remove: () => {},
        },
      };
      const originalRaf = global.requestAnimationFrame;
      global.requestAnimationFrame = (callback) => callback();
      scheduleResultScroll(element);
      global.requestAnimationFrame = originalRaf;
      assert.strictEqual(scrollCalls, 1);
    },
  },
  {
    name: "does not scroll when no signal result is available",
    fn: async () => {
      let scrollCalls = 0;
      scheduleResultScroll(null);
      assert.strictEqual(scrollCalls, 0);
    },
  },
  {
    name: "watchlist store loads defaults when storage is empty",
    fn: async () => {
      const storage = createStorageAdapter(createStorage());
      const store = createWatchlistStore({ storage, defaultSymbols: ["AAPL", "MSFT"] });
      assert.deepStrictEqual(store.getWatchlist(), ["AAPL", "MSFT"]);
    },
  },
  {
    name: "watchlist addSymbol normalizes and rejects invalid symbols",
    fn: async () => {
      const storage = createStorageAdapter(createStorage());
      const store = createWatchlistStore({ storage, defaultSymbols: ["AAPL"] });
      const added = store.addSymbol(" tsla ");
      assert.strictEqual(added.added, true);
      assert.ok(store.getWatchlist().includes("TSLA"));
      const invalid = store.addSymbol("NVDA!");
      assert.strictEqual(invalid.added, false);
      assert.ok(!store.getWatchlist().includes("NVDA!"));
    },
  },
  {
    name: "removeSymbol updates watchlist and favorites together",
    fn: async () => {
      const storage = createStorageAdapter(createStorage());
      const watchlist = createWatchlistStore({ storage, defaultSymbols: ["AAPL"] });
      const favorites = createFavoritesStore({ storage });
      watchlist.addSymbol("TSLA");
      favorites.toggleFavorite("TSLA");
      const removed = removeSymbolFromWatchlist("TSLA", { watchlist, favorites });
      assert.strictEqual(removed, true);
      assert.ok(!watchlist.getWatchlist().includes("TSLA"));
      assert.ok(!favorites.getFavorites().includes("TSLA"));
    },
  },
  {
    name: "favorites-only filter still respects sector/cap/signal filters",
    fn: async () => {
      const favorites = new Set(["AAPL", "JPM"]);
      const entries = [
        createStockEntry({
          symbol: "AAPL",
          history: [100, 100, 100, 100, 100, 100, 100, 100, 100, 90],
          lastPrice: 90,
          sector: "Technology",
          cap: "Large",
        }),
        createStockEntry({
          symbol: "JPM",
          history: [100, 100, 100, 100, 100, 100, 100, 100, 100, 90],
          lastPrice: 90,
          sector: "Finance",
          cap: "Large",
        }),
      ];
      const filtered = applyMarketFilters(entries, {
        favoritesOnly: true,
        favorites,
        filters: {
          search: "",
          sector: "Technology",
          cap: "Large",
          signal: "buy",
          min: 0,
          max: 0,
          minMonth: 0,
        },
      });
      assert.deepStrictEqual(
        filtered.map((entry) => entry.symbol),
        ["AAPL"],
      );
    },
  },
  {
    name: "watchlist persistence survives reloads",
    fn: async () => {
      const backing = createStorage();
      const storage = createStorageAdapter(backing);
      const first = createWatchlistStore({ storage, defaultSymbols: ["AAPL"] });
      first.addSymbol("TSLA");
      const second = createWatchlistStore({ storage, defaultSymbols: ["AAPL"] });
      assert.ok(second.getWatchlist().includes("TSLA"));
    },
  },
  {
    name: "backtest returns deterministic trade counts",
    fn: async () => {
      const prices = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 90, 95, 105, 100, 110, 100];
      const signalFn = (slice) => {
        const length = slice.length;
        if (length === 3) {
          return "buy";
        }
        if (length === 6) {
          return "sell";
        }
        if (length === 10) {
          return "buy";
        }
        if (length === 13) {
          return "sell";
        }
        return "hold";
      };
      const summary = runBacktest30d(prices, { signalFn, minCandles: 5 });
      assert.strictEqual(summary.trades, 2);
      assert.strictEqual(summary.winRate, 50);
    },
  },
  {
    name: "backtest computes buy & hold return correctly",
    fn: async () => {
      const prices = [100, 110, 120, 130, 140, 150];
      const summary = runBacktest30d(prices, {
        signalFn: () => "hold",
        minCandles: 2,
      });
      assert.ok(Math.abs(summary.buyHoldReturn - 50) < 0.01);
    },
  },
  {
    name: "backtest computes max drawdown correctly",
    fn: async () => {
      const prices = [100, 120, 80, 140];
      const summary = runBacktest30d(prices, {
        signalFn: (slice) => (slice.length === 1 ? "buy" : "hold"),
        minCandles: 2,
      });
      assert.ok(Math.abs(summary.maxDrawdown - 33.3333) < 0.05);
    },
  },
  {
    name: "backtest signals only use past data",
    fn: async () => {
      const prices = [10, 12, 11, 13, 12, 14];
      const lengths = [];
      const summary = runBacktest30d(prices, {
        signalFn: (slice) => {
          lengths.push(slice.length);
          return "hold";
        },
        minCandles: 2,
      });
      assert.strictEqual(summary.hasEnoughData, true);
      assert.deepStrictEqual(lengths, [1, 2, 3, 4, 5]);
    },
  },
  {
    name: "trade page init is a no-op without a browser DOM",
    fn: async () => {
      assert.strictEqual(initTradePage(), false);
    },
  },
  {
    name: "live page init is a no-op without a browser DOM",
    fn: async () => {
      assert.strictEqual(initLivePage(), false);
    },
  },
];

(async () => {
  for (const test of tests) {
    await runTest(test.name, test.fn);
  }
})();
