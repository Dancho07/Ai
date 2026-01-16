const assert = require("assert");
const {
  MarketDataError,
  fetchJsonWithRetry,
  isValidSymbol,
  loadSymbolSnapshot,
  resetSymbolCache,
  extraSymbolData,
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
      resetSymbolCache();
      extraSymbolData.set("AAPL", {
        symbol: "AAPL",
        name: "Apple",
        history: [150, 152, 151, 153, 154, 156, 155, 157, 158, 159],
        lastPrice: 159,
        previousClose: 158,
        dailyChange: 0.63,
        monthlyChange: null,
        yearlyChange: null,
        lastUpdated: "10:00 AM",
        lastUpdatedAt: Date.now() - 60000,
        dataSource: "live",
      });

      const fetchFn = createFetchSequence([
        createResponse({ ok: false, status: 503, json: {} }),
        createResponse({ ok: false, status: 503, json: {} }),
        createResponse({ ok: false, status: 503, json: {} }),
        createResponse({ ok: false, status: 503, json: {} }),
      ]);

      const result = await loadSymbolSnapshot("AAPL", { fetchFn });
      assert.strictEqual(result.status, "cache");
    },
  },
  {
    name: "throws invalid symbol error when provider returns no data",
    fn: async () => {
      resetSymbolCache();
      const fetchFn = createFetchSequence([
        createResponse({ ok: true, status: 200, json: { quoteResponse: { result: [] } } }),
      ]);
      const fetchFnChart = createFetchSequence([
        createResponse({ ok: true, status: 200, json: { chart: { result: [] } } }),
      ]);

      const combinedFetch = async (url, options) => {
        if (url.includes("quote")) {
          return fetchFn(url, options);
        }
        return fetchFnChart(url, options);
      };

      await assert.rejects(
        () => loadSymbolSnapshot("ZZZZ", { fetchFn: combinedFetch }),
        (error) => error instanceof MarketDataError && error.type === "invalid_symbol",
      );
    },
  },
];

(async () => {
  for (const test of tests) {
    await runTest(test.name, test.fn);
  }
})();
