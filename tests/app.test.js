const assert = require("assert");
const {
  MarketDataError,
  fetchJsonWithRetry,
  isValidSymbol,
  normalizeSymbolInput,
  getSymbolValidationMessage,
  persistFormState,
  loadPersistedFormState,
  getQuote,
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
  getStockEntry,
  calculateAtrLike,
  getConfidenceLabel,
  calculateTradePlan,
  buildSignalReasons,
  formatTimestamp,
  getMarketIndicatorData,
  handleMarketRowAction,
} = require("../app");

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
      assert.strictEqual(isValidSymbol("123"), false);
    },
  },
  {
    name: "normalizes and validates symbol input messages",
    fn: async () => {
      assert.strictEqual(normalizeSymbolInput("  brk.b "), "BRK.B");
      assert.strictEqual(normalizeSymbolInput("aapl!"), "AAPL");
      assert.strictEqual(getSymbolValidationMessage(""), "Please enter a stock symbol.");
      assert.strictEqual(getSymbolValidationMessage("AAPL"), "");
      assert.strictEqual(
        getSymbolValidationMessage("AAPL1"),
        "Stock symbols can include 1-5 letters and an optional suffix (e.g. BRK.B).",
      );
    },
  },
  {
    name: "restores persisted form state from storage",
    fn: async () => {
      const storage = createStorage();
      persistFormState(storage, { symbol: " msft ", cash: "2500", risk: "high" });
      const restored = loadPersistedFormState(storage);
      assert.deepStrictEqual(restored, { symbol: "MSFT", cash: "2500", risk: "high" });
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
    name: "throws invalid symbol error when provider returns no data",
    fn: async () => {
      resetQuoteCache();
      const fetchFn = createFetchSequence([
        createResponse({ ok: true, status: 200, json: { quoteResponse: { result: [] } } }),
      ]);

      await assert.rejects(
        () => getQuote("ZZZZ", { fetchFn, maxAttempts: 1 }),
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
          regularMarketState: "CLOSED",
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
      });
      assert.strictEqual(indicator.sessionBadge.label, "PRE");
      assert.strictEqual(cachedIndicator.sessionBadge.label, "CACHED");
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
      assert.strictEqual(regularDelay, 10000);
      const preDelay = getNextRefreshDelay({
        symbols: ["MSFT"],
        visible: true,
        backoffActive: false,
      });
      assert.strictEqual(preDelay, 20000);
      const closedDelay = getNextRefreshDelay({
        symbols: ["NVDA"],
        visible: true,
        backoffActive: false,
      });
      assert.strictEqual(closedDelay, 600000);
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
      assert.strictEqual(backedOff, 20000);
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
        yearlyChange: 8,
        atrPercent: 1.5,
      });
      assert.ok(reasons.length >= 3 && reasons.length <= 5);
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
];

(async () => {
  for (const test of tests) {
    await runTest(test.name, test.fn);
  }
})();
