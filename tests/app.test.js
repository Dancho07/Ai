const assert = require("assert");
const {
  MarketDataError,
  fetchJsonWithRetry,
  isValidSymbol,
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
      const stock = getStockEntry("AAPL");
      updateStockWithQuote(stock, {
        price: 101,
        change: 0.5,
        changePct: 0.5,
        asOfTimestamp: Date.now(),
        isRealtime: true,
        session: "REGULAR",
        source: "primary",
      });
      const regularDelay = getNextRefreshDelay({
        symbols: ["AAPL"],
        visible: true,
        backoffActive: false,
      });
      assert.strictEqual(regularDelay, 10000);
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
];

(async () => {
  for (const test of tests) {
    await runTest(test.name, test.fn);
  }
})();
