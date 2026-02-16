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
  const DELAYED_FRESHNESS_MS = 20 * 60 * 1000;

  function parseEpoch(value) {
    if (value == null) {
      return null;
    }
    if (value instanceof Date) {
      const timestamp = value.getTime();
      return Number.isFinite(timestamp) ? timestamp : null;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      const numericMatch = /^-?\d+(\.\d+)?$/.test(trimmed);
      if (numericMatch) {
        const numeric = Number.parseFloat(trimmed);
        if (!Number.isFinite(numeric) || numeric <= 0) {
          return null;
        }
        return numeric > 1e12 ? numeric : numeric * 1000;
      }
      const parsed = Date.parse(trimmed);
      return Number.isNaN(parsed) ? null : parsed;
    }
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }
    return value > 1e12 ? value : value * 1000;
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
    const delayedFlag = rawQuote.isDelayed === true || rawQuote.delay === true || rawQuote.delayed === true;
    let source = normalizeSource(rawQuote.source ?? rawQuote.dataSource);
    let sourceReason = "unknown";
    if (source) {
      sourceReason = `provider_${source.toLowerCase()}`;
    } else if (rawQuote.isRealtime === true) {
      source = QUOTE_SOURCES.REALTIME;
      sourceReason = "provider_realtime";
    } else if (delayedFlag) {
      source = QUOTE_SOURCES.DELAYED;
      sourceReason = "provider_delayed";
    } else if (session === QUOTE_SESSIONS.CLOSED) {
      source = QUOTE_SOURCES.LAST_CLOSE;
      sourceReason = "session_closed";
    } else if (quoteTimeMs == null) {
      if (session === QUOTE_SESSIONS.REGULAR || session === QUOTE_SESSIONS.PRE || session === QUOTE_SESSIONS.POST) {
        source = QUOTE_SOURCES.DELAYED;
        sourceReason = "missing_timestamp";
      } else {
        source = QUOTE_SOURCES.CACHED;
        sourceReason = "missing_timestamp";
      }
    } else {
      const ageMs = Math.max(0, nowMs - quoteTimeMs);
      if (session === QUOTE_SESSIONS.PRE || session === QUOTE_SESSIONS.POST) {
        if (ageMs <= REALTIME_FRESHNESS_MS && !delayedFlag) {
          source = QUOTE_SOURCES.REALTIME;
          sourceReason = "age_realtime_extended";
        } else {
          source = QUOTE_SOURCES.DELAYED;
          sourceReason = "extended_hours";
        }
      } else if (session === QUOTE_SESSIONS.REGULAR) {
        if (ageMs <= REALTIME_FRESHNESS_MS && !delayedFlag) {
          source = QUOTE_SOURCES.REALTIME;
          sourceReason = "age_realtime";
        } else if (ageMs <= DELAYED_FRESHNESS_MS || delayedFlag) {
          source = QUOTE_SOURCES.DELAYED;
          sourceReason = delayedFlag ? "provider_delayed" : "age_delayed";
        } else {
          source = QUOTE_SOURCES.CACHED;
          sourceReason = "age_cached";
        }
      } else {
        source = QUOTE_SOURCES.DELAYED;
        sourceReason = "fallback_delayed";
      }
    }
    return {
      symbol: rawQuote.symbol ?? null,
      price,
      quoteTimeMs,
      source,
      sourceReason,
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
