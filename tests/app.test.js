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
  computeUsMarketSession,
  parseEpoch,
  normalizeQuote,
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
  getCacheTtl,
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
  buildExplainableReasons,
  buildConfidenceBreakdown,
  buildTradePlanDetails,
  buildInvalidationRules,
  formatTimestamp,
  runBacktest30d,
  getMarketIndicatorData,
  classifyQuoteQuality,
  getQuoteBadges,
  getLatestQuoteAsOf,
  handleMarketRowAction,
  updateMarketRowCells,
  getMarketTableColumnKeys,
  buildMarketRowMarkup,
  scheduleResultScroll,
  sortMarketEntries,
  buildTopOpportunitiesGroups,
  applyMarketFilters,
  removeSymbolFromWatchlist,
  getCachedAnalysis,
  setCachedAnalysis,
  resetAnalysisCache,
  fetchYahooQuotes,
  runRefreshCycle,
  getRefreshState,
  resetRefreshState,
  getLastRefreshSummary,
  initTradePage,
  initLivePage,
} = require("../core");
const { computeHeaderQuality, normalizeQuote: normalizeHeaderQuote } = require("../quoteQuality");
const { computeIndicators, scoreSignal, scoreMultiTimeframe } = require("../strategy");

function createResponse({ ok, status, json, text, jsonError, textError }) {
  return {
    ok,
    status,
    json: async () => {
      if (jsonError) {
        throw jsonError;
      }
      if (json instanceof Error) {
        throw json;
      }
      return json;
    },
    text: async () => {
      if (textError) {
        throw textError;
      }
      return text ?? "";
    },
    clone: () => createResponse({ ok, status, json, text, jsonError, textError }),
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

function createMockDomElement({ tagName = "DIV", classes = [], dataset = {} } = {}) {
  const listeners = new Map();
  const element = {
    tagName: tagName.toUpperCase(),
    dataset: { ...dataset },
    classList: createClassList(classes),
    style: {},
    className: "",
    textContent: "",
    innerHTML: "",
    parentElement: null,
    children: [],
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
    closest: function closest(selector) {
      if (selector === "tr[data-symbol]" && this.tagName === "TR" && this.dataset.symbol) {
        return this;
      }
      if (selector === "button[data-action]" && this.tagName === "BUTTON" && this.dataset.action) {
        return this;
      }
      if (selector === "button[data-action='analyze']" && this.tagName === "BUTTON" && this.dataset.action === "analyze") {
        return this;
      }
      return this.parentElement?.closest ? this.parentElement.closest(selector) : null;
    },
    focus: function focus() {
      if (this.ownerDocument) {
        this.ownerDocument.activeElement = this;
      }
    },
    appendChild: function appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    },
    querySelector: function querySelector() {
      return null;
    },
    querySelectorAll: function querySelectorAll() {
      return [];
    },
    setAttribute: function setAttribute() {},
  };
  return element;
}

function createMockDocument(elements = {}) {
  const listeners = new Map();
  const doc = {
    body: createMockDomElement({ tagName: "BODY" }),
    activeElement: null,
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
    getElementById: (id) => elements[id] ?? null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tagName) => createMockDomElement({ tagName }),
  };
  doc.body.ownerDocument = doc;
  Object.values(elements).forEach((element) => {
    element.ownerDocument = doc;
  });
  return doc;
}

function loadCoreWithDocument(mockDocument, windowOverrides = {}) {
  const originalDocument = global.document;
  const originalWindow = global.window;
  global.document = mockDocument;
  const baseLocation = { search: "" };
  const nextLocation = { ...baseLocation, ...(windowOverrides.location ?? {}) };
  global.window = { location: nextLocation, ...windowOverrides, location: nextLocation };
  delete require.cache[require.resolve("../core")];
  const core = require("../core");
  const restore = () => {
    global.document = originalDocument;
    global.window = originalWindow;
  };
  return { core, restore };
}

function createAnalysisResult(symbol = "AAPL") {
  return {
    symbol,
    action: "buy",
    signalScore: { total: 72, label: "Strong", components: [] },
    confidenceLabel: "High",
    confidenceScore: 84,
    confidenceReasons: ["Momentum is positive."],
    invalidationRules: ["Breakdown below support."],
    tradePlan: {
      entryDisplay: "$100 - $101",
      stopLossDisplay: "$96",
      takeProfitDisplay: "$110",
      positionSizeDisplay: "15 shares",
      isHold: false,
    },
    backtest: { hasEnoughData: false },
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
  dataSource = "REALTIME",
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

function buildTrendCandles({ start, step, count }) {
  return Array.from({ length: count }, (_, index) => {
    const close = start + step * index;
    return { close, high: close * 1.002, low: close * 0.998 };
  });
}

function buildChoppyCandles({ start, amplitude, count }) {
  return Array.from({ length: count }, (_, index) => {
    const offset = index % 2 === 0 ? amplitude : -amplitude;
    const close = start + offset;
    return { close, high: close * 1.003, low: close * 0.997 };
  });
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
    name: "normalizes realtime regular quotes",
    fn: async () => {
      const now = Date.now();
      const quote = normalizeQuote(
        {
          symbol: "AAPL",
          regularMarketPrice: 150,
          regularMarketChange: 1.2,
          regularMarketChangePercent: 0.8,
          regularMarketTime: Math.floor(now / 1000),
          marketState: "REGULAR",
        },
        now,
      );
      assert.strictEqual(quote.source, "REALTIME");
      assert.strictEqual(quote.session, "REGULAR");
      assert.strictEqual(quote.price, 150);
    },
  },
  {
    name: "normalizes premarket quotes with delayed source",
    fn: async () => {
      const now = Date.now();
      const quote = normalizeQuote(
        {
          symbol: "MSFT",
          preMarketPrice: 300,
          preMarketChange: 2,
          preMarketChangePercent: 0.5,
          preMarketTime: Math.floor((now - 10 * 60 * 1000) / 1000),
          marketState: "PRE",
        },
        now,
      );
      assert.strictEqual(quote.session, "PRE");
      assert.strictEqual(quote.source, "DELAYED");
    },
  },
  {
    name: "normalizes cached fallback quotes",
    fn: async () => {
      const now = Date.now();
      const quote = normalizeQuote(
        {
          symbol: "NVDA",
          price: 410,
          change: 5,
          changePct: 1.2,
          asOfTimestamp: now - 60 * 1000,
          session: "REGULAR",
          source: "CACHED",
        },
        now,
      );
      assert.strictEqual(quote.source, "CACHED");
      assert.strictEqual(quote.asOfTs, now - 60 * 1000);
    },
  },
  {
    name: "normalizes historical fallback quotes",
    fn: async () => {
      const now = Date.now();
      const quote = normalizeQuote(
        {
          symbol: "TSLA",
          price: 220,
          change: -3,
          changePct: -1.4,
          asOfTimestamp: now - 24 * 60 * 60 * 1000,
          session: "CLOSED",
          source: "LAST_CLOSE",
        },
        now,
      );
      assert.strictEqual(quote.source, "LAST_CLOSE");
      assert.strictEqual(quote.session, "CLOSED");
    },
  },
  {
    name: "does not overwrite known session on transient failures",
    fn: async () => {
      const stock = createStockEntry({
        symbol: "AMZN",
        history: [100, 110],
        lastPrice: 110,
      });
      stock.quoteSession = "REGULAR";
      updateStockWithQuote(stock, {
        price: 110,
        asOfTimestamp: Date.now(),
        session: "UNKNOWN",
        source: "CACHED",
      });
      assert.strictEqual(stock.quoteSession, "REGULAR");
    },
  },
  {
    name: "warns when market open but cached quote is used",
    fn: async () => {
      const now = Date.now();
      const quote = normalizeQuote(
        {
          symbol: "META",
          price: 280,
          change: 0.5,
          changePct: 0.2,
          asOfTimestamp: now - 60 * 1000,
          session: "REGULAR",
          source: "CACHED",
        },
        now,
      );
      assert.ok(quote.warnings.includes("Market open but live quote unavailable — using cached data."));
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
      const buyHistory = buildTrendCandles({ start: 100, step: 1.2, count: 40 }).map(
        (candle) => candle.close,
      );
      const sellHistory = buildTrendCandles({ start: 160, step: -1.2, count: 40 }).map(
        (candle) => candle.close,
      );
      const buyEntry = createStockEntry({
        symbol: "BUY1",
        history: buyHistory,
        lastPrice: buyHistory[buyHistory.length - 1],
        dailyChange: 1.2,
      });
      const sellEntry = createStockEntry({
        symbol: "SELL1",
        history: sellHistory,
        lastPrice: sellHistory[sellHistory.length - 1],
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
      const buyHistory = buildTrendCandles({ start: 120, step: 1.1, count: 40 }).map(
        (candle) => candle.close,
      );
      const sellHistory = buildTrendCandles({ start: 170, step: -1.1, count: 40 }).map(
        (candle) => candle.close,
      );
      const buyEntry = createStockEntry({
        symbol: "BUY2",
        history: buyHistory,
        lastPrice: buyHistory[buyHistory.length - 1],
      });
      const sellEntry = createStockEntry({
        symbol: "SELL2",
        history: sellHistory,
        lastPrice: sellHistory[sellHistory.length - 1],
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
    name: "parses JSON from text when response.json fails",
    fn: async () => {
      const fetchFn = createFetchSequence([
        createResponse({
          ok: true,
          status: 200,
          json: new Error("Invalid JSON"),
          text: JSON.stringify({ quoteResponse: { result: [] } }),
        }),
      ]);
      const payload = await fetchJsonWithRetry("https://example.com", {
        fetchFn,
        timeoutMs: 5,
        maxAttempts: 1,
        provider: "Yahoo Finance",
        symbol: "AAPL",
      });
      assert.deepStrictEqual(payload, { quoteResponse: { result: [] } });
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
        source: "CACHED",
      });

      const fetchFn = createFetchSequence([
        createResponse({ ok: false, status: 503, json: {} }),
        createResponse({ ok: false, status: 503, json: {} }),
        createResponse({ ok: false, status: 503, json: {} }),
        createResponse({ ok: false, status: 503, json: {} }),
      ]);

      const result = await getQuote("AAPL", { fetchFn, maxAttempts: 1 });
      assert.strictEqual(result.source, "CACHED");
    },
  },
  {
    name: "falls back to secondary provider when primary fails",
    fn: async () => {
      resetQuoteCache();
      const fetchFn = async (url) => {
        if (String(url).includes("stooq.com")) {
          return createResponse({
            ok: true,
            status: 200,
            text: "Symbol,Date,Time,Open,High,Low,Close,Volume\nAAPL.US,2024-01-02,15:00:00,0,0,0,189.5,100",
          });
        }
        return createResponse({ ok: false, status: 503, json: {} });
      };
      const quote = await getQuote("AAPL", { fetchFn, maxAttempts: 1 });
      assert.strictEqual(quote.providerUsed, "Stooq");
      assert.strictEqual(quote.price, 189.5);
      assert.ok(["DELAYED", "LAST_CLOSE"].includes(quote.source));
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
          preMarketTime: Math.floor(Date.now() / 1000),
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
          postMarketTime: Math.floor(Date.now() / 1000),
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
    name: "parses epoch seconds and milliseconds",
    fn: async () => {
      const iso = "2024-01-02T15:00:00.000Z";
      assert.strictEqual(parseEpoch("1700000000"), 1700000000000);
      assert.strictEqual(parseEpoch(1700000000), 1700000000000);
      assert.strictEqual(parseEpoch(1700000000000), 1700000000000);
      assert.strictEqual(parseEpoch(iso), Date.parse(iso));
      assert.strictEqual(parseEpoch("not-a-time"), null);
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
    name: "derives session from ET trading hours when marketState is missing",
    fn: async () => {
      const now = Date.UTC(2024, 0, 2, 15, 0, 0);
      assert.strictEqual(
        deriveMarketSession({ exchangeTimezoneName: "America/New_York" }, now),
        "REGULAR",
      );
    },
  },
  {
    name: "computes US market sessions using America/New_York time",
    fn: async () => {
      const regular = computeUsMarketSession(new Date(Date.UTC(2024, 0, 2, 15, 0, 0)));
      const pre = computeUsMarketSession(new Date(Date.UTC(2024, 0, 2, 12, 0, 0)));
      const post = computeUsMarketSession(new Date(Date.UTC(2024, 0, 2, 22, 30, 0)));
      const weekend = computeUsMarketSession(new Date(Date.UTC(2024, 0, 6, 15, 0, 0)));
      assert.strictEqual(regular.session, "REGULAR");
      assert.strictEqual(pre.session, "PRE");
      assert.strictEqual(post.session, "POST");
      assert.strictEqual(weekend.session, "CLOSED");
    },
  },
  {
    name: "finds the latest quote timestamp across entries",
    fn: async () => {
      const entries = [
        { lastPrice: 101, quoteAsOf: 1700000000000 },
        { lastPrice: 102, quoteAsOf: 1700000500000 },
        { lastPrice: null, quoteAsOf: 1700001000000 },
      ];
      assert.strictEqual(getLatestQuoteAsOf(entries), 1700000500000);
    },
  },
  {
    name: "handles daylight saving time when computing sessions",
    fn: async () => {
      const winter = computeUsMarketSession(new Date(Date.UTC(2024, 0, 2, 14, 45, 0)));
      const summer = computeUsMarketSession(new Date(Date.UTC(2024, 6, 1, 13, 45, 0)));
      assert.strictEqual(winter.session, "REGULAR");
      assert.strictEqual(summer.session, "REGULAR");
    },
  },
  {
    name: "marks stale regular-session quotes as delayed based on as-of timestamp",
    fn: async () => {
      const now = Date.UTC(2024, 0, 2, 15, 10, 0);
      const quote = normalizeQuote(
        {
          symbol: "AAPL",
          marketState: "REGULAR",
          regularMarketPrice: 150,
          regularMarketPreviousClose: 148,
          regularMarketChange: 2,
          regularMarketChangePercent: 1.35,
          regularMarketTime: Math.floor((now - 10 * 60 * 1000) / 1000),
        },
        now,
      );
      assert.strictEqual(quote.session, "REGULAR");
      assert.strictEqual(quote.source, "DELAYED");
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
        source: "CACHED",
      });
      const fetchFn = createFetchSequence([
        createResponse({ ok: false, status: 429, json: {} }),
      ]);
      const result = await getQuote("AAPL", { fetchFn, maxAttempts: 1 });
      assert.strictEqual(result.source, "CACHED");
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
        source: "CACHED",
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
      assert.strictEqual(result.source, "CACHED");
    },
  },
  {
    name: "retries after timeout and returns realtime quote",
    fn: async () => {
      resetQuoteCache();
      let callCount = 0;
      const fetchFn = (url, { signal }) => {
        callCount += 1;
        if (callCount === 1) {
          return new Promise((resolve, reject) => {
            signal.addEventListener("abort", () => {
              const error = new Error("Aborted");
              error.name = "AbortError";
              reject(error);
            });
          });
        }
        return Promise.resolve(
          createResponse({
            ok: true,
            status: 200,
            json: {
              quoteResponse: {
                result: [
                  {
                    symbol: "AAPL",
                    marketState: "REGULAR",
                    regularMarketPrice: 190,
                    regularMarketChange: 1.5,
                    regularMarketChangePercent: 0.8,
                    regularMarketTime: Math.floor(Date.now() / 1000),
                  },
                ],
              },
            },
          }),
        );
      };
      const result = await getQuote("AAPL", { fetchFn, maxAttempts: 2, timeoutMs: 5 });
      assert.strictEqual(result.source, "REALTIME");
      assert.strictEqual(callCount, 2);
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
        source: "CACHED",
      });
      const fetchFn = createFetchSequence([
        createResponse({ ok: true, status: 200, json: { quoteResponse: { result: [] } } }),
      ]);
      const quote = await getQuote("TSLA", { fetchFn, maxAttempts: 1 });
      assert.strictEqual(quote.session, "REGULAR");
      assert.strictEqual(quote.unavailable, true);
      assert.strictEqual(quote.source, "CACHED");
    },
  },
  {
    name: "labels session badge for market indicator",
    fn: async () => {
      const preSessionNow = new Date(Date.UTC(2024, 0, 2, 12, 0, 0));
      const regularSessionNow = new Date(Date.UTC(2024, 0, 2, 15, 0, 0));
      const indicator = getMarketIndicatorData({
        quoteSession: "PRE",
        dataSource: "REALTIME",
        quoteAsOf: Date.now(),
      }, { now: preSessionNow });
      const cachedIndicator = getMarketIndicatorData({
        quoteSession: "REGULAR",
        dataSource: "CACHED",
        quoteAsOf: Date.now(),
        lastPrice: 101,
      }, { now: regularSessionNow });
      assert.strictEqual(indicator.sessionBadge.label, "PRE");
      assert.strictEqual(cachedIndicator.sessionBadge.label, "REGULAR");
    },
  },
  {
    name: "classifies realtime freshness during regular session",
    fn: async () => {
      const nowMs = Date.UTC(2024, 0, 2, 15, 0, 0);
      const quality = classifyQuoteQuality({
        quote: { lastPrice: 100, quoteAsOf: nowMs - 5000 },
        nowMs,
        session: "REGULAR",
      });
      assert.strictEqual(quality.badge, "REALTIME");
      assert.strictEqual(quality.isLive, true);
    },
  },
  {
    name: "classifies delayed freshness during regular session",
    fn: async () => {
      const nowMs = Date.UTC(2024, 0, 2, 15, 0, 0);
      const quality = classifyQuoteQuality({
        quote: { lastPrice: 100, quoteAsOf: nowMs - 80 * 1000 },
        nowMs,
        session: "REGULAR",
      });
      assert.strictEqual(quality.badge, "DELAYED");
      assert.strictEqual(quality.isLive, false);
    },
  },
  {
    name: "downgrades stale realtime quotes during regular session",
    fn: async () => {
      const nowMs = Date.UTC(2024, 0, 2, 15, 0, 0);
      const quality = classifyQuoteQuality({
        quote: { lastPrice: 100, quoteAsOf: nowMs - 30 * 60 * 1000, dataSource: "REALTIME" },
        nowMs,
        session: "REGULAR",
      });
      assert.strictEqual(quality.badge, "CACHED");
      assert.strictEqual(quality.showWarning, true);
    },
  },
  {
    name: "treats missing timestamp as delayed during regular session",
    fn: async () => {
      const nowMs = Date.UTC(2024, 0, 2, 15, 0, 0);
      const quality = classifyQuoteQuality({
        quote: { lastPrice: 100 },
        nowMs,
        session: "REGULAR",
      });
      assert.strictEqual(quality.badge, "DELAYED");
      assert.strictEqual(quality.reason, "missing_timestamp");
    },
  },
  {
    name: "classifies cached freshness with warning during regular session",
    fn: async () => {
      const nowMs = Date.UTC(2024, 0, 2, 15, 0, 0);
      const quality = classifyQuoteQuality({
        quote: { lastPrice: 100, quoteAsOf: nowMs - 30 * 60 * 1000 },
        nowMs,
        session: "REGULAR",
      });
      assert.strictEqual(quality.badge, "CACHED");
      assert.strictEqual(quality.showWarning, true);
    },
  },
  {
    name: "classifies last close when session is closed",
    fn: async () => {
      const nowMs = Date.UTC(2024, 0, 2, 22, 0, 0);
      const quality = classifyQuoteQuality({
        quote: { lastPrice: 100, quoteAsOf: nowMs - 6 * 60 * 60 * 1000, dataSource: "LAST_CLOSE" },
        nowMs,
        session: "CLOSED",
      });
      assert.strictEqual(quality.badge, "LAST_CLOSE");
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
        dataSource: "REALTIME",
        quoteAsOf: timestamp,
        lastPrice: 101,
      }, { now: new Date(Date.UTC(2024, 0, 2, 15, 0, 0)) });
      assert.strictEqual(indicator.asOfLabel, "As of 12:30 UTC");
    },
  },
  {
    name: "shows open status and realtime or delayed freshness during regular session",
    fn: async () => {
      const regularSessionNow = new Date(Date.UTC(2024, 0, 2, 15, 0, 0));
      const realtimeIndicator = getMarketIndicatorData({
        quoteSession: "REGULAR",
        dataSource: "REALTIME",
        quoteAsOf: Date.now(),
        isRealtime: true,
        lastPrice: 188,
      }, { now: regularSessionNow });
      const delayedIndicator = getMarketIndicatorData({
        quoteSession: "REGULAR",
        dataSource: "DELAYED",
        quoteAsOf: Date.now(),
        isRealtime: false,
        lastPrice: 188,
      }, { now: regularSessionNow });
      assert.strictEqual(realtimeIndicator.marketStatus, "Open");
      assert.strictEqual(realtimeIndicator.sourceBadge.label, "REALTIME");
      assert.strictEqual(delayedIndicator.marketStatus, "Open");
      assert.strictEqual(delayedIndicator.sourceBadge.label, "DELAYED");
    },
  },
  {
    name: "infers realtime status when cached source is fresh during regular session",
    fn: async () => {
      const regularSessionNow = new Date(Date.UTC(2024, 0, 2, 15, 0, 0));
      const cachedIndicator = getMarketIndicatorData({
        quoteSession: "REGULAR",
        dataSource: "CACHED",
        quoteAsOf: regularSessionNow.getTime(),
        lastPrice: 150,
      }, { now: regularSessionNow });
      assert.strictEqual(cachedIndicator.marketStatus, "Open");
      assert.strictEqual(cachedIndicator.sourceBadge.label, "REALTIME");
      assert.notStrictEqual(cachedIndicator.marketStatus, "Unavailable");
    },
  },
  {
    name: "market indicator prefers realtime and clears cached note when any live quote is present",
    fn: async () => {
      const regularSessionNow = new Date(Date.UTC(2024, 0, 2, 15, 0, 0));
      const indicator = getMarketIndicatorData(null, {
        now: regularSessionNow,
        marketEntries: [
          { lastPrice: 100, quoteAsOf: regularSessionNow.getTime() - 5000, dataSource: "REALTIME" },
          { lastPrice: 101, quoteAsOf: regularSessionNow.getTime() - 600 * 1000, dataSource: "CACHED" },
        ],
      });
      assert.strictEqual(indicator.sourceBadge.label, "REALTIME");
      assert.strictEqual(indicator.usingCached, false);
    },
  },
  {
    name: "computeHeaderQuality prefers realtime when mixed with cached",
    fn: async () => {
      const nowMs = Date.UTC(2024, 0, 2, 15, 0, 0);
      const realtimeQuotes = Array.from({ length: 10 }, (_, index) => ({
        symbol: `RT${index}`,
        price: 100 + index,
        quoteTimeMs: nowMs - 5000,
        source: "REALTIME",
        session: "REGULAR",
      }));
      const cachedQuotes = Array.from({ length: 2 }, (_, index) => ({
        symbol: `CC${index}`,
        price: 90 + index,
        quoteTimeMs: nowMs - 600 * 1000,
        source: "CACHED",
        session: "REGULAR",
      }));
      const result = computeHeaderQuality([...realtimeQuotes, ...cachedQuotes], nowMs, "REGULAR");
      assert.strictEqual(result.headerSourceBadge, "REALTIME");
      assert.strictEqual(result.usingCachedData, false);
    },
  },
  {
    name: "computeHeaderQuality returns delayed when all quotes are delayed",
    fn: async () => {
      const nowMs = Date.UTC(2024, 0, 2, 15, 0, 0);
      const delayedQuotes = Array.from({ length: 3 }, (_, index) => ({
        symbol: `DL${index}`,
        price: 200 + index,
        quoteTimeMs: nowMs - 5 * 60 * 1000,
        source: "DELAYED",
        session: "REGULAR",
      }));
      const result = computeHeaderQuality(delayedQuotes, nowMs, "REGULAR");
      assert.strictEqual(result.headerSourceBadge, "DELAYED");
      assert.strictEqual(result.usingCachedData, false);
    },
  },
  {
    name: "computeHeaderQuality returns last close when all quotes are last close",
    fn: async () => {
      const nowMs = Date.UTC(2024, 0, 2, 22, 0, 0);
      const lastCloseQuotes = Array.from({ length: 2 }, (_, index) => ({
        symbol: `LC${index}`,
        price: 300 + index,
        quoteTimeMs: nowMs - 6 * 60 * 60 * 1000,
        source: "LAST_CLOSE",
        session: "CLOSED",
      }));
      const result = computeHeaderQuality(lastCloseQuotes, nowMs, "CLOSED");
      assert.strictEqual(result.headerSourceBadge, "LAST_CLOSE");
      assert.strictEqual(result.usingCachedData, true);
    },
  },
  {
    name: "regular session cached quotes trigger cached header",
    fn: async () => {
      const nowMs = Date.UTC(2024, 0, 2, 15, 0, 0);
      const cachedQuotes = [
        { symbol: "AAPL", price: 180, quoteTimeMs: nowMs - 30 * 60 * 1000, source: "CACHED", session: "REGULAR" },
      ];
      const result = computeHeaderQuality(cachedQuotes, nowMs, "REGULAR");
      assert.strictEqual(result.headerSourceBadge, "CACHED");
      assert.strictEqual(result.usingCachedData, true);
      const indicator = getMarketIndicatorData({
        quoteSession: "REGULAR",
        dataSource: "CACHED",
        quoteAsOf: nowMs - 30 * 60 * 1000,
        lastPrice: 180,
      }, { now: new Date(nowMs) });
      assert.ok(indicator.warningMessage.includes("Market open but live quote unavailable"));
    },
  },
  {
    name: "computeHeaderQuality keeps fresh timestamps from being treated as cached",
    fn: async () => {
      const nowMs = Date.UTC(2024, 0, 2, 15, 0, 0);
      const realtimeQuote = normalizeHeaderQuote(
        { symbol: "AAPL", price: 120, quoteTimeMs: nowMs - 10 * 1000, session: "REGULAR" },
        nowMs,
      );
      const delayedQuote = normalizeHeaderQuote(
        { symbol: "MSFT", price: 340, quoteTimeMs: nowMs - 10 * 60 * 1000, session: "REGULAR" },
        nowMs,
      );
      const realtimeResult = computeHeaderQuality([realtimeQuote], nowMs, "REGULAR");
      const delayedResult = computeHeaderQuality([delayedQuote], nowMs, "REGULAR");
      assert.strictEqual(realtimeResult.headerSourceBadge, "REALTIME");
      assert.strictEqual(delayedResult.headerSourceBadge, "DELAYED");
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
    name: "prefers available quote quality when some entries are missing data",
    fn: async () => {
      const regularSessionNow = new Date(Date.UTC(2024, 0, 2, 15, 0, 0));
      const indicator = getMarketIndicatorData(null, {
        now: regularSessionNow,
        marketEntries: [
          { lastPrice: 100, quoteAsOf: Date.now(), dataSource: "REALTIME" },
          { lastPrice: null, quoteAsOf: null, dataSource: "UNAVAILABLE" },
        ],
      });
      assert.strictEqual(indicator.sourceBadge.label, "REALTIME");
      assert.notStrictEqual(indicator.sourceBadge.label, "UNAVAILABLE");
    },
  },
  {
    name: "selects badges and warnings for unavailable regular-session quotes",
    fn: async () => {
      const asOf = Date.UTC(2024, 0, 2, 15, 30, 0);
      const badges = getQuoteBadges({
        price: 101.5,
        session: "REGULAR",
        source: "UNAVAILABLE",
        asOfTimestamp: asOf,
      });
      assert.strictEqual(badges.sourceBadge.label, "CACHED");
      assert.strictEqual(badges.sessionBadge.label, "REGULAR");
      assert.ok(badges.asOfLabel.startsWith("As of "));
      assert.strictEqual(badges.showWarning, true);
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
        source: "CACHED",
      });
      hydrateMarketStateFromCache();
      const stock = getStockEntry("AAPL");
      const display = getMarketRowDisplay(stock);
      assert.notStrictEqual(display.priceDisplay, "Price unavailable");
      assert.notStrictEqual(display.changeDisplay, "n/a");
      assert.strictEqual(display.sourceBadge.label, "CACHED");
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
        source: "CACHED",
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
    name: "does not overwrite a known session with unknown during transient failures",
    fn: async () => {
      const stock = { quoteSession: "REGULAR" };
      updateStockWithQuote(stock, {
        price: 92.1,
        change: -0.2,
        changePct: -0.21,
        asOfTimestamp: Date.now(),
        isRealtime: false,
        session: "UNKNOWN",
        source: "CACHED",
      });
      assert.strictEqual(stock.quoteSession, "REGULAR");
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
        source: "CACHED",
      });
      const fetchFn = createFetchSequence([
        createResponse({ ok: false, status: 503, json: {} }),
      ]);
      const quote = await getQuote("AAPL", { fetchFn, maxAttempts: 1 });
      const stock = getStockEntry("AAPL");
      updateStockWithQuote(stock, quote);
      const display = getMarketRowDisplay(stock);
      assert.strictEqual(quote.source, "CACHED");
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
        source: "REALTIME",
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
        dataSource: "REALTIME",
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
    name: "keeps regular session open when unavailable quote is returned",
    fn: async () => {
      const stock = getStockEntry("AAPL");
      updateStockWithQuote(stock, {
        price: 148.1,
        change: -0.9,
        changePct: -0.6,
        asOfTimestamp: Date.now() - 30000,
        isRealtime: false,
        session: "REGULAR",
        source: "CACHED",
      });
      updateStockWithQuote(stock, {
        price: 148.1,
        change: -0.9,
        changePct: -0.6,
        asOfTimestamp: Date.now() - 10000,
        isRealtime: false,
        session: "UNKNOWN",
        source: "CACHED",
        unavailable: true,
      });
      const indicator = getMarketIndicatorData(stock, {
        now: new Date(Date.UTC(2024, 0, 2, 15, 0, 0)),
      });
      assert.strictEqual(stock.quoteSession, "REGULAR");
      assert.strictEqual(indicator.marketStatus, "Open");
      assert.strictEqual(indicator.sourceBadge.label, "REALTIME");
    },
  },
  {
    name: "keeps regular session open after live quote fetch failure",
    fn: async () => {
      resetQuoteCache();
      setLastKnownQuote("AAPL", {
        price: 445.2,
        change: 1.1,
        changePct: 0.25,
        asOfTimestamp: Date.now() - 30000,
        isRealtime: true,
        session: "REGULAR",
        source: "CACHED",
      });
      const fetchFn = createFetchSequence([createResponse({ ok: false, status: 503, json: {} })]);
      const quote = await getQuote("AAPL", { fetchFn, maxAttempts: 1 });
      const stock = getStockEntry("AAPL");
      updateStockWithQuote(stock, quote);
      const indicator = getMarketIndicatorData(stock, {
        now: new Date(Date.UTC(2024, 0, 2, 15, 0, 0)),
      });
      assert.strictEqual(stock.quoteSession, "REGULAR");
      assert.strictEqual(indicator.marketStatus, "Open");
      assert.strictEqual(indicator.sourceBadge.label, "REALTIME");
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
        source: "REALTIME",
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
        source: "REALTIME",
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
    name: "uses longer cache ttl when market is closed",
    fn: async () => {
      const regularTtl = getCacheTtl("REGULAR");
      const closedTtl = getCacheTtl("CLOSED");
      assert.strictEqual(regularTtl, 5000);
      assert.ok(closedTtl > regularTtl);
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
        symbol: "TEST",
        sector: "Technology",
        entryPrice: 10,
        priceLabel: "Last close",
        priceAsOf: null,
        prices,
        cash: 1000,
        risk: "moderate",
        positionSizingMode: "risk_percent",
        riskPercent: 5,
      });
      assert.strictEqual(plan.riskBudget, 50);
      assert.ok(plan.riskAmount <= plan.riskBudget);
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
        symbol: "TEST",
        sector: "Technology",
        entryPrice: 100,
        priceLabel: "Last close",
        priceAsOf: null,
        prices,
        cash: 10000,
        risk: "moderate",
        positionSizingMode: "risk_percent",
        riskPercent: 1,
      });
      assert.strictEqual(plan.riskBudget, 100);
      assert.ok(plan.riskAmount <= plan.riskBudget);
      assert.strictEqual(plan.positionSize, 33);
      assert.ok(plan.stopDistance > 0);
    },
  },
  {
    name: "sizes positions from auto risk percent by tolerance",
    fn: async () => {
      const prices = Array.from({ length: 12 }, () => 100);
      const plan = calculateTradePlan({
        action: "buy",
        symbol: "AUTO",
        sector: "Technology",
        entryPrice: 100,
        priceLabel: "Last close",
        priceAsOf: null,
        prices,
        cash: 10000,
        risk: "high",
        positionSizingMode: "risk_auto",
        atrLike: 2,
      });
      assert.strictEqual(plan.riskBudget, 200);
      assert.strictEqual(plan.positionSize, 83);
    },
  },
  {
    name: "caps positions by max position percent",
    fn: async () => {
      const prices = Array.from({ length: 12 }, () => 100);
      const plan = calculateTradePlan({
        action: "buy",
        symbol: "CAP",
        sector: "Technology",
        entryPrice: 100,
        priceLabel: "Last close",
        priceAsOf: null,
        prices,
        cash: 10000,
        risk: "moderate",
        positionSizingMode: "max_position_cap",
        atrLike: 2,
      });
      assert.strictEqual(plan.positionSize, 15);
    },
  },
  {
    name: "applies sector exposure caps from portfolio",
    fn: async () => {
      const prices = Array.from({ length: 12 }, () => 100);
      const plan = calculateTradePlan({
        action: "buy",
        symbol: "SECTOR",
        sector: "Technology",
        entryPrice: 100,
        priceLabel: "Last close",
        priceAsOf: null,
        prices,
        cash: 10000,
        risk: "moderate",
        positionSizingMode: "risk_auto",
        atrLike: 2,
        portfolioPositions: [
          { symbol: "EXIST", sector: "Technology", notional: 2400, horizon: "swing" },
        ],
      });
      assert.strictEqual(plan.positionSize, 7);
      assert.ok(plan.sizingWarnings.length === 0);
      assert.ok(plan.sizingNotes.some((note) => note.includes("portfolio")));
    },
  },
  {
    name: "supports fractional shares when broker allows",
    fn: async () => {
      const prices = Array.from({ length: 12 }, () => 100);
      const plan = calculateTradePlan({
        action: "buy",
        symbol: "FRAC",
        sector: "Technology",
        entryPrice: 100,
        priceLabel: "Last close",
        priceAsOf: null,
        prices,
        cash: 10000,
        risk: "moderate",
        positionSizingMode: "risk_percent",
        riskPercent: 1,
        atrLike: 2.5,
        broker: { allowFractional: true, fractionalPrecision: 2 },
      });
      assert.strictEqual(plan.positionSize, 33.33);
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
      const prices = Array.from({ length: 40 }, (_, index) => 100 + index);
      const score = calculateSignalScore({ prices, price: prices[prices.length - 1] });
      assert.strictEqual(score.total, 76);
      assert.strictEqual(score.components.length, 4);
    },
  },
  {
    name: "returns multi-timeframe error on insufficient candles",
    fn: async () => {
      const candles = buildTrendCandles({ start: 100, step: 1.2, count: 8 });
      const scored = scoreMultiTimeframe(candles, { price: candles[candles.length - 1].close });
      assert.strictEqual(scored.signal, "hold");
      assert.ok(scored.error);
      assert.ok(scored.error.message.includes("Not enough price history"));
    },
  },
  {
    name: "builds explainable reasons snapshot for multi-timeframe signal",
    fn: async () => {
      const candles = buildTrendCandles({ start: 100, step: 1.2, count: 40 });
      const scored = scoreMultiTimeframe(candles, { price: candles[candles.length - 1].close });
      const reasons = buildExplainableReasons({
        scoredSignal: scored,
        recent: candles[candles.length - 1].close,
        atrPercent: 1.8,
      });
      assert.deepStrictEqual(reasons.slice(0, 3), [
        "Long-term EMA trend is bullish (5.13% vs slow, slope 0.86%).",
        "Long-term RSI is bullish (100.0).",
        "Short-term EMA trend is bullish (1.79% vs slow, slope 0.83%).",
      ]);
    },
  },
  {
    name: "builds trade plan details schema",
    fn: async () => {
      const tradePlan = calculateTradePlan({
        action: "buy",
        entryPrice: 100,
        priceLabel: "Last close",
        priceAsOf: null,
        prices: Array.from({ length: 20 }, (_, index) => 90 + index),
        cash: 10000,
        risk: "moderate",
      });
      const details = buildTradePlanDetails({
        action: "buy",
        tradePlan,
        timeHorizon: { shortLabel: "Swing" },
        invalidationRules: ["Price closes below key EMA."],
        confidenceBreakdown: buildConfidenceBreakdown({ scoredSignal: null, prices: [1, 2, 3] }),
        dataSnapshot: { priceAsOf: 123, indicators: {} },
        reasons: ["Short-term trend aligned with long-term bias."],
      });
      assert.strictEqual(details.signal, "BUY");
      assert.strictEqual(details.horizon, "Swing");
      assert.ok(details.entry_zone);
      assert.ok(details.stop_loss);
      assert.ok(details.target);
      assert.ok(details.invalidation.length);
      assert.ok(details.confidence_breakdown.length);
      assert.ok(details.data_snapshot);
      assert.ok(details.why.length);
    },
  },
  {
    name: "scores a strong uptrend as BUY",
    fn: async () => {
      const candles = buildTrendCandles({ start: 100, step: 1.5, count: 40 });
      const indicators = computeIndicators(candles);
      const scored = scoreSignal(indicators, { price: candles[candles.length - 1].close });
      assert.strictEqual(scored.signal, "buy");
      assert.ok(scored.score >= 65);
    },
  },
  {
    name: "scores a strong downtrend as SELL",
    fn: async () => {
      const candles = buildTrendCandles({ start: 140, step: -1.5, count: 40 });
      const indicators = computeIndicators(candles);
      const scored = scoreSignal(indicators, { price: candles[candles.length - 1].close });
      assert.strictEqual(scored.signal, "sell");
      assert.ok(scored.score <= 35);
    },
  },
  {
    name: "scores choppy price action as HOLD",
    fn: async () => {
      const candles = buildChoppyCandles({ start: 100, amplitude: 1, count: 40 });
      const indicators = computeIndicators(candles);
      const scored = scoreSignal(indicators, { price: candles[candles.length - 1].close });
      assert.strictEqual(scored.signal, "hold");
      assert.ok(scored.score > 35 && scored.score < 65);
    },
  },
  {
    name: "score increases as trend strengthens",
    fn: async () => {
      const mild = buildTrendCandles({ start: 100, step: 0.4, count: 40 });
      const strong = buildTrendCandles({ start: 100, step: 1.2, count: 40 });
      const mildScore = scoreSignal(computeIndicators(mild), { price: mild[mild.length - 1].close }).score;
      const strongScore = scoreSignal(computeIndicators(strong), { price: strong[strong.length - 1].close }).score;
      assert.ok(strongScore > mildScore);
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
        dataSource: "REALTIME",
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
        dataSource: "REALTIME",
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
        dataSource: "REALTIME",
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
        dataSource: "REALTIME",
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
        dataSource: "REALTIME",
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
        dataSource: "REALTIME",
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
        dataSource: "REALTIME",
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
    name: "watchlist store never persists an empty list",
    fn: async () => {
      const backing = createStorage();
      const storage = createStorageAdapter(backing);
      const store = createWatchlistStore({ storage, defaultSymbols: ["AAPL", "MSFT"] });
      store.removeSymbol("AAPL");
      store.removeSymbol("MSFT");
      const reloaded = createWatchlistStore({ storage, defaultSymbols: ["AAPL", "MSFT"] });
      assert.deepStrictEqual(reloaded.getWatchlist(), ["AAPL", "MSFT"]);
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
      const buyHistory = buildTrendCandles({ start: 90, step: 1.0, count: 40 }).map(
        (candle) => candle.close,
      );
      const favorites = new Set(["AAPL", "JPM"]);
      const entries = [
        createStockEntry({
          symbol: "AAPL",
          history: buyHistory,
          lastPrice: buyHistory[buyHistory.length - 1],
          sector: "Technology",
          cap: "Large",
        }),
        createStockEntry({
          symbol: "JPM",
          history: buyHistory,
          lastPrice: buyHistory[buyHistory.length - 1],
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
    name: "refresh cycle transitions to error on timeout",
    fn: async () => {
      resetRefreshState();
      const refreshFn = () => new Promise(() => {});
      await runRefreshCycle({ timeoutMs: 10, refreshFn });
      const state = getRefreshState();
      assert.strictEqual(state.status, "error");
      assert.notStrictEqual(state.status, "loading");
      assert.strictEqual(state.lastError.type, "timeout");
    },
  },
  {
    name: "refresh cycle tracks requested symbols when timing out",
    fn: async () => {
      const storage = createStorage();
      storage.setItem("watchlist_v1", JSON.stringify(["AAPL", "MSFT"]));
      const originalLocalStorage = global.localStorage;
      global.localStorage = storage;
      const { core, restore } = loadCoreWithDocument(createMockDocument());
      try {
        core.resetRefreshState();
        const refreshFn = () => new Promise(() => {});
        await core.runRefreshCycle({ timeoutMs: 10, refreshFn });
        const summary = core.getLastRefreshSummary();
        assert.strictEqual(summary.totalCount, 2);
        assert.strictEqual(summary.okCount, 0);
      } finally {
        restore();
        global.localStorage = originalLocalStorage;
      }
    },
  },
  {
    name: "refresh cycle aborts in-flight refresh when a new cycle starts",
    fn: async () => {
      resetRefreshState();
      let firstSignal = null;
      let firstAborted = false;
      const firstRefreshFn = ({ signal }) =>
        new Promise((resolve) => {
          firstSignal = signal;
          signal.addEventListener("abort", () => {
            firstAborted = true;
            resolve({
              symbolsCount: 1,
              okCount: 0,
              errorCount: 1,
              hadQuoteFailure: true,
              errorTypes: ["timeout"],
            });
          });
        });
      const secondRefreshFn = () =>
        Promise.resolve({
          symbolsCount: 1,
          okCount: 1,
          errorCount: 0,
          hadQuoteFailure: false,
          errorTypes: [],
        });

      const firstPromise = runRefreshCycle({ timeoutMs: 1000, refreshFn: firstRefreshFn });
      await new Promise((resolve) => setTimeout(resolve, 0));
      await runRefreshCycle({ timeoutMs: 1000, refreshFn: secondRefreshFn });
      await firstPromise;

      assert.strictEqual(firstSignal.aborted, true);
      assert.strictEqual(firstAborted, true);
    },
  },
  {
    name: "refresh cycle shows partial cached banner when realtime quotes succeed",
    fn: async () => {
      const quoteStatusBanner = createMockDomElement({ classes: ["hidden"] });
      const quoteStatusMessage = createMockDomElement();
      const mockDocument = createMockDocument({
        "quote-status-banner": quoteStatusBanner,
        "quote-status-message": quoteStatusMessage,
      });
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        await core.runRefreshCycle({
          timeoutMs: 1000,
          refreshFn: async () => ({
            symbolsCount: 2,
            okCount: 2,
            errorCount: 1,
            hadQuoteFailure: true,
            errorTypes: ["timeout"],
            realtimeOk: 1,
            cachedCount: 1,
            failedCount: 0,
          }),
        });
        assert.strictEqual(quoteStatusMessage.textContent, "Some symbols cached (1/2).");
        assert.strictEqual(quoteStatusBanner.classList.contains("hidden"), false);
        assert.strictEqual(core.getRefreshState().lastError, null);
      } finally {
        restore();
      }
    },
  },
  {
    name: "refresh cycle shows timeout banner when no realtime quotes succeed",
    fn: async () => {
      const quoteStatusBanner = createMockDomElement({ classes: ["hidden"] });
      const quoteStatusMessage = createMockDomElement();
      const mockDocument = createMockDocument({
        "quote-status-banner": quoteStatusBanner,
        "quote-status-message": quoteStatusMessage,
      });
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        await core.runRefreshCycle({
          timeoutMs: 1000,
          refreshFn: async () => ({
            symbolsCount: 2,
            okCount: 0,
            errorCount: 2,
            hadQuoteFailure: true,
            errorTypes: ["timeout"],
            realtimeOk: 0,
            cachedCount: 2,
            failedCount: 0,
          }),
        });
        assert.strictEqual(
          quoteStatusMessage.textContent,
          "Live quotes unavailable (timeout). Showing cached/last close.",
        );
        assert.strictEqual(quoteStatusBanner.classList.contains("hidden"), false);
      } finally {
        restore();
      }
    },
  },
  {
    name: "refresh symbols fall back to watchlist when favorites are empty",
    fn: async () => {
      const storage = createStorage();
      storage.setItem("watchlist_v1", JSON.stringify(["AAPL", "MSFT"]));
      const favoritesToggle = createMockElement();
      favoritesToggle.checked = true;
      const originalLocalStorage = global.localStorage;
      global.localStorage = storage;
      const { core, restore } = loadCoreWithDocument(
        createMockDocument({
          "filter-favorites": favoritesToggle,
        }),
      );
      try {
        const symbols = core.getRefreshSymbolsForCycle();
        assert.deepStrictEqual(symbols, ["AAPL", "MSFT"]);
      } finally {
        restore();
        global.localStorage = originalLocalStorage;
      }
    },
  },
  {
    name: "refresh keeps cached quotes when quote fetch fails",
    fn: async () => {
      const storage = createStorage();
      storage.setItem("watchlist_v1", JSON.stringify(["AAPL"]));
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const mockDocument = createMockDocument({ "market-body": marketBody });
      const originalLocalStorage = global.localStorage;
      const originalFetch = global.fetch;
      global.localStorage = storage;
      global.fetch = async () => {
        throw new Error("network down");
      };
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        const stock = core.getStockEntry("AAPL");
        core.updateStockWithQuote(stock, {
          price: 101,
          change: 1,
          changePct: 1,
          asOfTimestamp: Date.now(),
          session: "REGULAR",
          source: "REALTIME",
        });
        stock.quoteAsOf = Date.now() - 60 * 1000;
        stock.lastUpdatedAt = stock.quoteAsOf;
        const summary = await core.refreshVisibleQuotes();
        const refreshed = core.getStockEntry("AAPL");
        assert.strictEqual(refreshed.lastPrice, 101);
        assert.strictEqual(summary.hadQuoteFailure, true);
      } finally {
        restore();
        global.localStorage = originalLocalStorage;
        global.fetch = originalFetch;
      }
    },
  },
  {
    name: "refresh summary includes provider meta for realtime quotes",
    fn: async () => {
      const storage = createStorage();
      storage.setItem("watchlist_v1", JSON.stringify(["AAPL"]));
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const mockDocument = createMockDocument({ "market-body": marketBody });
      const originalLocalStorage = global.localStorage;
      const originalFetch = global.fetch;
      const originalNow = Date.now;
      const nowMs = Date.parse("2024-05-01T15:00:00Z");
      Date.now = () => nowMs;
      global.localStorage = storage;
      global.fetch = async () =>
        createResponse({
          ok: true,
          status: 200,
          json: {
            quoteResponse: {
              result: [
                {
                  symbol: "AAPL",
                  marketState: "REGULAR",
                  regularMarketPrice: 100,
                  regularMarketChange: 1,
                  regularMarketChangePercent: 1,
                  regularMarketTime: Math.floor(nowMs / 1000),
                  regularMarketPreviousClose: 99,
                },
              ],
            },
          },
        });
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        const summary = await core.refreshVisibleQuotes();
        assert.strictEqual(summary.meta.providerMode, "realtime");
        assert.strictEqual(summary.meta.session, "REGULAR");
      } finally {
        restore();
        global.localStorage = originalLocalStorage;
        global.fetch = originalFetch;
        Date.now = originalNow;
      }
    },
  },
  {
    name: "quote batch uses allSettled and keeps successful results",
    fn: async () => {
      const responses = [
        createResponse({
          ok: true,
          status: 200,
          json: {
            quoteResponse: { result: [{ symbol: "AAPL", regularMarketPrice: 100 }] },
          },
        }),
        new Error("proxy down"),
      ];
      const fetchFn = createFetchSequence(responses);
      const result = await fetchYahooQuotes(["AAPL", "MSFT"], { fetchFn, batchSize: 1, maxAttempts: 1 });
      assert.strictEqual(result.quotes.length, 1);
      assert.strictEqual(result.quotes[0].symbol, "AAPL");
      assert.strictEqual(result.hadFailure, true);
    },
  },
  {
    name: "quote batch uses a single request when symbols fit in one batch",
    fn: async () => {
      const fetchFn = createFetchSequence([
        createResponse({
          ok: true,
          status: 200,
          json: { quoteResponse: { result: [{ symbol: "AAPL", regularMarketPrice: 100 }] } },
        }),
      ]);
      await fetchYahooQuotes(["AAPL", "MSFT"], { fetchFn, batchSize: 8, maxAttempts: 1 });
      assert.strictEqual(fetchFn.getCallCount(), 1);
    },
  },
  {
    name: "quote batch reuses cached responses within the ttl",
    fn: async () => {
      const originalNow = Date.now;
      let now = 1700000000000;
      Date.now = () => now;
      resetQuoteCache();
      const fetchFn = createFetchSequence([
        createResponse({
          ok: true,
          status: 200,
          json: { quoteResponse: { result: [{ symbol: "AAPL", regularMarketPrice: 100 }] } },
        }),
        createResponse({
          ok: true,
          status: 200,
          json: { quoteResponse: { result: [{ symbol: "AAPL", regularMarketPrice: 101 }] } },
        }),
      ]);
      try {
        const first = await fetchYahooQuotes(["AAPL"], { fetchFn, batchSize: 1, maxAttempts: 1 });
        now += 1000;
        const second = await fetchYahooQuotes(["AAPL"], { fetchFn, batchSize: 1, maxAttempts: 1 });
        assert.strictEqual(fetchFn.getCallCount(), 1);
        assert.strictEqual(first.quotes[0].regularMarketPrice, 100);
        assert.strictEqual(second.quotes[0].regularMarketPrice, 100);
        now += 8000;
        const third = await fetchYahooQuotes(["AAPL"], { fetchFn, batchSize: 1, maxAttempts: 1 });
        assert.strictEqual(fetchFn.getCallCount(), 2);
        assert.strictEqual(third.quotes[0].regularMarketPrice, 101);
      } finally {
        Date.now = originalNow;
      }
    },
  },
  {
    name: "refresh marks missing symbols as unavailable while keeping cached price",
    fn: async () => {
      const storage = createStorage();
      storage.setItem("watchlist_v1", JSON.stringify(["AAPL", "MSFT"]));
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const mockDocument = createMockDocument({ "market-body": marketBody });
      const originalLocalStorage = global.localStorage;
      const originalFetch = global.fetch;
      global.localStorage = storage;
      global.fetch = async () =>
        createResponse({
          ok: true,
          status: 200,
          json: {
            quoteResponse: {
              result: [
                {
                  symbol: "AAPL",
                  regularMarketPrice: 100,
                  regularMarketChange: 1,
                  regularMarketChangePercent: 1,
                  regularMarketTime: Math.floor(Date.now() / 1000),
                  regularMarketPreviousClose: 99,
                },
              ],
            },
          },
        });
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        const msftEntry = core.getStockEntry("MSFT");
        msftEntry.lastPrice = 250;
        msftEntry.previousClose = 250;
        await core.refreshVisibleQuotes();
        const msft = core.getStockEntry("MSFT");
        assert.strictEqual(msft.lastPrice, 250);
        assert.strictEqual(msft.quoteUnavailable, true);
      } finally {
        restore();
        global.localStorage = originalLocalStorage;
        global.fetch = originalFetch;
      }
    },
  },
  {
    name: "live page renders stored watchlist rows even when quotes fail",
    fn: async () => {
      const storage = createStorage();
      storage.setItem("watchlist_v1", JSON.stringify(["AAPL", "MSFT", "NVDA"]));
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const mockDocument = createMockDocument({ "market-body": marketBody });
      const originalLocalStorage = global.localStorage;
      const originalFetch = global.fetch;
      global.localStorage = storage;
      global.fetch = async () => {
        throw new Error("network down");
      };
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        core.initLivePage();
        assert.strictEqual(marketBody.children.length, 3);
      } finally {
        restore();
        global.localStorage = originalLocalStorage;
        global.fetch = originalFetch;
      }
    },
  },
  {
    name: "market pulse header hides cached note when live quotes succeed",
    fn: async () => {
      const storage = createStorage();
      storage.setItem("watchlist_v1", JSON.stringify(["AAPL", "MSFT"]));
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const marketOpenText = createMockDomElement();
      const marketSessionBadge = createMockDomElement();
      const marketAsOf = createMockDomElement();
      const marketSourceBadge = createMockDomElement();
      const marketCacheNote = createMockDomElement({ classes: ["hidden"] });
      const mockDocument = createMockDocument({
        "market-body": marketBody,
        "market-open-text": marketOpenText,
        "market-session-badge": marketSessionBadge,
        "market-as-of": marketAsOf,
        "market-source-badge": marketSourceBadge,
        "market-cache-note": marketCacheNote,
      });
      const originalLocalStorage = global.localStorage;
      const originalFetch = global.fetch;
      global.localStorage = storage;
      global.fetch = async (url) => {
        const stringUrl = String(url);
        if (stringUrl.includes("/v8/finance/chart/")) {
          return createResponse({
            ok: true,
            status: 200,
            json: {
              chart: {
                result: [
                  {
                    indicators: { quote: [{ close: [100, 101] }] },
                    timestamp: [1700000000, 1700000600],
                  },
                ],
              },
            },
          });
        }
        return createResponse({
          ok: true,
          status: 200,
          json: {
            quoteResponse: {
              result: [
                {
                  symbol: "AAPL",
                  regularMarketPrice: 190,
                  regularMarketTime: Math.floor(Date.now() / 1000),
                  marketState: "REGULAR",
                },
                {
                  symbol: "MSFT",
                  regularMarketPrice: 330,
                  regularMarketTime: Math.floor(Date.now() / 1000),
                  marketState: "REGULAR",
                },
              ],
            },
          },
        });
      };
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        core.initLivePage({ skipInitialLoad: true });
        await core.runRefreshCycle({ symbols: ["AAPL", "MSFT"] });
        assert.strictEqual(marketSourceBadge.textContent, "REALTIME");
        assert.strictEqual(marketCacheNote.classList.contains("hidden"), true);
      } finally {
        restore();
        global.localStorage = originalLocalStorage;
        global.fetch = originalFetch;
      }
    },
  },
  {
    name: "live page uses default watchlist when storage is invalid",
    fn: async () => {
      const storage = createStorage();
      storage.setItem("watchlist_v1", "not-json");
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const mockDocument = createMockDocument({ "market-body": marketBody });
      const originalLocalStorage = global.localStorage;
      const originalFetch = global.fetch;
      global.localStorage = storage;
      global.fetch = async () => {
        throw new Error("network down");
      };
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        core.initLivePage();
        assert.strictEqual(marketBody.children.length, 10);
      } finally {
        restore();
        global.localStorage = originalLocalStorage;
        global.fetch = originalFetch;
      }
    },
  },
  {
    name: "live page uses default watchlist when storage is empty",
    fn: async () => {
      const storage = createStorage();
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const mockDocument = createMockDocument({ "market-body": marketBody });
      const originalLocalStorage = global.localStorage;
      const originalFetch = global.fetch;
      global.localStorage = storage;
      global.fetch = async () => {
        throw new Error("network down");
      };
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        core.initLivePage();
        assert.strictEqual(marketBody.children.length, 10);
      } finally {
        restore();
        global.localStorage = originalLocalStorage;
        global.fetch = originalFetch;
      }
    },
  },
  {
    name: "live page renders default watchlist rows immediately when storage is empty",
    fn: async () => {
      const storage = createStorage();
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const mockDocument = createMockDocument({ "market-body": marketBody });
      const originalLocalStorage = global.localStorage;
      const originalFetch = global.fetch;
      global.localStorage = storage;
      global.fetch = async () => new Promise(() => {});
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        core.initLivePage({ skipInitialLoad: true });
        assert.strictEqual(marketBody.children.length, 10);
      } finally {
        restore();
        global.localStorage = originalLocalStorage;
        global.fetch = originalFetch;
      }
    },
  },
  {
    name: "live page loads watchlist from legacy storage keys",
    fn: async () => {
      const storage = createStorage();
      storage.setItem("marketPulse.watchlist", JSON.stringify(["META", "NFLX"]));
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const mockDocument = createMockDocument({ "market-body": marketBody });
      const originalLocalStorage = global.localStorage;
      const originalFetch = global.fetch;
      global.localStorage = storage;
      global.fetch = async () => {
        throw new Error("network down");
      };
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        core.initLivePage();
        assert.strictEqual(marketBody.children.length, 2);
      } finally {
        restore();
        global.localStorage = originalLocalStorage;
        global.fetch = originalFetch;
      }
    },
  },
  {
    name: "empty filters state shows message without deleting watchlist rows",
    fn: async () => {
      const storage = createStorage();
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const marketEmptyState = createMockDomElement({ classes: ["hidden"] });
      const marketEmptyMessage = createMockDomElement();
      const filterSearch = createMockElement({ value: "ZZZZ" });
      const mockDocument = createMockDocument({
        "market-body": marketBody,
        "market-empty-state": marketEmptyState,
        "market-empty-message": marketEmptyMessage,
        "filter-search": filterSearch,
      });
      const originalLocalStorage = global.localStorage;
      const originalFetch = global.fetch;
      global.localStorage = storage;
      global.fetch = async () => {
        throw new Error("network down");
      };
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        core.initLivePage();
        assert.strictEqual(marketEmptyState.classList.contains("hidden"), false);
        assert.ok(marketEmptyMessage.textContent.includes("Empty filters"));
        assert.strictEqual(marketBody.children.length, 10);
      } finally {
        restore();
        global.localStorage = originalLocalStorage;
        global.fetch = originalFetch;
      }
    },
  },
  {
    name: "default market filters do not exclude rows",
    fn: async () => {
      const entries = [
        {
          symbol: "AAPL",
          sector: "Technology",
          cap: "Large",
          history: [],
          lastPrice: null,
          monthlyChange: null,
        },
      ];
      const filtered = applyMarketFilters(entries, {
        favoritesOnly: false,
        favorites: [],
        filters: {
          search: "",
          sector: "all",
          cap: "all",
          signal: "all",
          min: 0,
          max: 0,
          minMonth: 0,
        },
      });
      assert.strictEqual(filtered.length, 1);
    },
  },
  {
    name: "top opportunities does not mutate the source array",
    fn: async () => {
      const entries = [
        { symbol: "AAA", sector: "Tech", cap: "Large", history: [], lastPrice: null, monthlyChange: null },
        { symbol: "BBB", sector: "Tech", cap: "Large", history: [], lastPrice: null, monthlyChange: null },
      ];
      const snapshot = [...entries];
      buildTopOpportunitiesGroups(entries);
      assert.deepStrictEqual(entries, snapshot);
    },
  },
  {
    name: "live page analyze only triggers from analyze button",
    fn: async () => {
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const mockDocument = createMockDocument({ "market-body": marketBody });
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        let calledSymbol = null;
        core.initLivePage({
          onAnalyze: (symbol) => {
            calledSymbol = symbol;
          },
          skipInitialLoad: true,
          skipRender: true,
        });
        const row = createMockDomElement({ tagName: "TR", dataset: { symbol: "AAPL" } });
        marketBody.dispatchEvent({ type: "click", target: row, preventDefault: () => {} });
        assert.strictEqual(calledSymbol, null);
        const analyzeButton = createMockDomElement({
          tagName: "BUTTON",
          dataset: { action: "analyze", symbol: "AAPL" },
        });
        marketBody.dispatchEvent({ type: "click", target: analyzeButton, preventDefault: () => {} });
        assert.strictEqual(calledSymbol, "AAPL");
      } finally {
        restore();
      }
    },
  },
  {
    name: "live page does not run analyze for favorite/remove clicks",
    fn: async () => {
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const mockDocument = createMockDocument({ "market-body": marketBody });
      const { core, restore } = loadCoreWithDocument(mockDocument);
      try {
        let calledCount = 0;
        core.initLivePage({
          onAnalyze: () => {
            calledCount += 1;
          },
          skipInitialLoad: true,
          skipRender: true,
        });
        const favoriteButton = createMockDomElement({
          tagName: "BUTTON",
          dataset: { action: "favorite", symbol: "AAPL" },
        });
        marketBody.dispatchEvent({ type: "click", target: favoriteButton, preventDefault: () => {} });
        const removeButton = createMockDomElement({
          tagName: "BUTTON",
          dataset: { action: "remove", symbol: "AAPL" },
        });
        marketBody.dispatchEvent({ type: "click", target: removeButton, preventDefault: () => {} });
        assert.strictEqual(calledCount, 0);
      } finally {
        restore();
      }
    },
  },
  {
    name: "live page analyze navigates to trade analysis with autorun",
    fn: async () => {
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const mockDocument = createMockDocument({ "market-body": marketBody });
      const assignCalls = [];
      const { core, restore } = loadCoreWithDocument(mockDocument, {
        location: {
          search: "",
          assign: (url) => assignCalls.push(url),
        },
      });
      try {
        core.initLivePage({
          onAnalyze: (symbol) => {
            const url = core.buildAnalyzeUrl(symbol, { autoRun: true });
            global.window.location.assign(url);
          },
          skipInitialLoad: true,
          skipRender: true,
        });
        const analyzeButton = createMockDomElement({
          tagName: "BUTTON",
          dataset: { action: "analyze", symbol: "AAPL" },
        });
        marketBody.dispatchEvent({
          type: "click",
          target: analyzeButton,
          preventDefault: () => {},
        });
        assert.deepStrictEqual(assignCalls, ["index.html?symbol=AAPL&autorun=1"]);
      } finally {
        restore();
      }
    },
  },
  {
    name: "live page favorite/remove clicks do not navigate",
    fn: async () => {
      const marketBody = createMockDomElement({ tagName: "TBODY" });
      const mockDocument = createMockDocument({ "market-body": marketBody });
      const assignCalls = [];
      const { core, restore } = loadCoreWithDocument(mockDocument, {
        location: {
          search: "",
          assign: (url) => assignCalls.push(url),
        },
      });
      try {
        core.initLivePage({
          onAnalyze: (symbol) => {
            const url = core.buildAnalyzeUrl(symbol, { autoRun: true });
            global.window.location.assign(url);
          },
          skipInitialLoad: true,
          skipRender: true,
        });
        const favoriteButton = createMockDomElement({
          tagName: "BUTTON",
          dataset: { action: "favorite", symbol: "AAPL" },
        });
        marketBody.dispatchEvent({
          type: "click",
          target: favoriteButton,
          preventDefault: () => {},
        });
        const removeButton = createMockDomElement({
          tagName: "BUTTON",
          dataset: { action: "remove", symbol: "AAPL" },
        });
        marketBody.dispatchEvent({
          type: "click",
          target: removeButton,
          preventDefault: () => {},
        });
        assert.deepStrictEqual(assignCalls, []);
      } finally {
        restore();
      }
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
