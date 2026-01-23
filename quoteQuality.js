(function createQuoteQualityModule(root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else if (root) {
    root.QuoteQuality = factory();
  }
})(typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : null, () => {
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
    UNKNOWN: "UNKNOWN",
  };

  const REALTIME_FRESHNESS_MS = 2 * 60 * 1000;

  function parseEpoch(value) {
    if (value == null) {
      return null;
    }
    const numeric = typeof value === "string" ? Number.parseFloat(value) : value;
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return null;
    }
    return numeric > 1e12 ? numeric : numeric * 1000;
  }

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

  function normalizeQuote(rawQuote, nowMs = Date.now()) {
    if (!rawQuote) {
      return null;
    }
    const session =
      normalizeSession(
        rawQuote.session ?? rawQuote.quoteSession ?? rawQuote.marketState ?? rawQuote.regularMarketState,
      ) ?? QUOTE_SESSIONS.UNKNOWN;
    const price =
      rawQuote.price ??
      rawQuote.lastPrice ??
      rawQuote.regularMarketPrice ??
      rawQuote.preMarketPrice ??
      rawQuote.postMarketPrice ??
      null;
    const quoteTimeMs = parseEpoch(
      rawQuote.quoteTimeMs ??
        rawQuote.quoteAsOf ??
        rawQuote.lastUpdatedAt ??
        rawQuote.asOfTimestamp ??
        rawQuote.timestamp ??
        rawQuote.regularMarketTime ??
        rawQuote.preMarketTime ??
        rawQuote.postMarketTime ??
        null,
    );
    let source = normalizeSource(rawQuote.source ?? rawQuote.dataSource);
    if (!source) {
      if (rawQuote.isRealtime === true) {
        source = QUOTE_SOURCES.REALTIME;
      } else if (rawQuote.isDelayed === true) {
        source = QUOTE_SOURCES.DELAYED;
      } else if (session === QUOTE_SESSIONS.CLOSED) {
        source = QUOTE_SOURCES.LAST_CLOSE;
      } else if (quoteTimeMs && nowMs - quoteTimeMs > REALTIME_FRESHNESS_MS) {
        source = QUOTE_SOURCES.DELAYED;
      } else {
        source = QUOTE_SOURCES.REALTIME;
      }
    }
    return {
      symbol: rawQuote.symbol ?? null,
      price,
      quoteTimeMs,
      source,
      session,
      isDelayed: source === QUOTE_SOURCES.DELAYED,
      isFallback: [QUOTE_SOURCES.CACHED, QUOTE_SOURCES.LAST_CLOSE, QUOTE_SOURCES.UNAVAILABLE].includes(source),
    };
  }

  function getLatestQuoteTimeMs(quotes = []) {
    return quotes.reduce((latest, quote) => {
      const timestamp = quote?.quoteTimeMs ?? null;
      if (!timestamp || !Number.isFinite(timestamp)) {
        return latest;
      }
      if (latest == null || timestamp > latest) {
        return timestamp;
      }
      return latest;
    }, null);
  }

  function computeHeaderQuality(quotes = [], lastRefreshAtMs, marketSession) {
    const counts = {
      [QUOTE_SOURCES.REALTIME]: 0,
      [QUOTE_SOURCES.DELAYED]: 0,
      [QUOTE_SOURCES.LAST_CLOSE]: 0,
      [QUOTE_SOURCES.CACHED]: 0,
      [QUOTE_SOURCES.UNAVAILABLE]: 0,
    };
    quotes.forEach((quote) => {
      const source = normalizeSource(quote?.source) ?? QUOTE_SOURCES.UNAVAILABLE;
      counts[source] = (counts[source] ?? 0) + 1;
    });
    const priority = [
      QUOTE_SOURCES.REALTIME,
      QUOTE_SOURCES.DELAYED,
      QUOTE_SOURCES.LAST_CLOSE,
      QUOTE_SOURCES.CACHED,
      QUOTE_SOURCES.UNAVAILABLE,
    ];
    const headerSourceBadge = priority.find((source) => (counts[source] ?? 0) > 0) ?? QUOTE_SOURCES.UNAVAILABLE;
    const headerAsOfMs = getLatestQuoteTimeMs(quotes) ?? (Number.isFinite(lastRefreshAtMs) ? lastRefreshAtMs : null);
    const usingCachedData = [QUOTE_SOURCES.CACHED, QUOTE_SOURCES.LAST_CLOSE].includes(headerSourceBadge);
    const mixedQuality =
      Object.values(counts).filter((count) => typeof count === "number" && count > 0).length > 1;
    return {
      headerSourceBadge,
      headerAsOfMs,
      usingCachedData,
      mixedQuality,
      counts,
      marketSession: normalizeSession(marketSession) ?? QUOTE_SESSIONS.UNKNOWN,
    };
  }

  return {
    QUOTE_SOURCES,
    QUOTE_SESSIONS,
    normalizeQuote,
    computeHeaderQuality,
  };
});
