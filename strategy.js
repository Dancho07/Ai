const signalConfig =
  typeof module !== "undefined" && module.exports
    ? require("./signalConfig")
    : typeof window !== "undefined"
      ? window.SignalConfig
      : null;

const DEFAULT_CONFIG = {
  indicators: {
    timeframes: {
      long: {
        periods: {
          emaFast: 12,
          emaSlow: 26,
          rsi: 14,
          atr: 14,
          returns: 10,
          slope: 5,
        },
      },
    },
  },
  score: {
    thresholds: { buy: 65, sell: 35 },
    weights: {
      trend: 22,
      momentum: 13,
      meanReversion: 10,
      volatility: 5,
    },
    trendDiffDivider: 2,
    trendSlopeDivider: 1.5,
    trendBiasDivider: 2,
    meanReversionDivider: 3.5,
  },
  volatility: {
    profiles: [
      { max: 2.5, label: "low", stability: 1, bias: 0.1, caution: "Low volatility: confirm momentum." },
      { max: 4, label: "moderate", stability: 0.8, bias: 0, caution: "Moderate volatility: stay disciplined." },
      { max: 6, label: "high", stability: 0.45, bias: -0.4, caution: "High volatility: reduce size or wait." },
      { max: Infinity, label: "very high", stability: 0.2, bias: -0.7, caution: "Very high volatility: avoid choppy tape." },
    ],
  },
  confidence: {
    alignmentWeight: 50,
    distanceWeight: 30,
    volatilityWeight: 20,
    conflictPenalty: 12,
  },
};

const ACTIVE_CONFIG = signalConfig ?? DEFAULT_CONFIG;

const DEFAULT_PERIODS = ACTIVE_CONFIG.indicators.timeframes.long.periods;
const SCORE_THRESHOLDS = ACTIVE_CONFIG.score.thresholds;

function clampNumber(value, min, max) {
  if (value == null || Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function getClose(candle) {
  if (typeof candle === "number") {
    return candle;
  }
  if (!candle) {
    return null;
  }
  return candle.close ?? candle.price ?? null;
}

function getHigh(candle) {
  if (typeof candle === "number") {
    return candle;
  }
  return candle?.high ?? candle?.close ?? candle?.price ?? null;
}

function getLow(candle) {
  if (typeof candle === "number") {
    return candle;
  }
  return candle?.low ?? candle?.close ?? candle?.price ?? null;
}

function extractCloses(candles) {
  return candles
    .map((candle) => getClose(candle))
    .filter((value) => typeof value === "number" && Number.isFinite(value));
}

function calculateEma(values, period) {
  if (!Array.isArray(values) || values.length < period) {
    return { current: null, previous: null };
  }
  const smoothing = 2 / (period + 1);
  let ema = values[0];
  let previous = null;
  for (let index = 1; index < values.length; index += 1) {
    if (index === values.length - 1) {
      previous = ema;
    }
    ema = values[index] * smoothing + ema * (1 - smoothing);
  }
  return { current: ema, previous };
}

function calculateRsi(values, period) {
  if (!Array.isArray(values) || values.length <= period) {
    return null;
  }
  let gains = 0;
  let losses = 0;
  for (let index = values.length - period; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  const averageGain = gains / period;
  const averageLoss = losses / period;
  if (averageLoss === 0) {
    return 100;
  }
  if (averageGain === 0) {
    return 0;
  }
  const rs = averageGain / averageLoss;
  return 100 - 100 / (1 + rs);
}

function calculateAtr(candles, period) {
  if (!Array.isArray(candles) || candles.length < 2) {
    return null;
  }
  const ranges = [];
  for (let index = 1; index < candles.length; index += 1) {
    const current = candles[index];
    const previous = candles[index - 1];
    const high = getHigh(current);
    const low = getLow(current);
    const prevClose = getClose(previous);
    if ([high, low, prevClose].some((value) => value == null)) {
      continue;
    }
    const trueRange = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose),
    );
    ranges.push(trueRange);
  }
  if (!ranges.length) {
    return null;
  }
  const slice = ranges.slice(-period);
  const total = slice.reduce((sum, value) => sum + value, 0);
  return total / slice.length;
}

function calculateReturns(closes, lookback) {
  if (!Array.isArray(closes) || closes.length < 2) {
    return [];
  }
  const slice = closes.slice(-1 * (lookback + 1));
  return slice.slice(1).map((value, index) => {
    const previous = slice[index];
    return previous ? ((value - previous) / previous) * 100 : 0;
  });
}

function computeTrend({ emaFast, emaSlow, emaFastPrev }) {
  if (emaFast == null || emaSlow == null) {
    return { direction: 0, strength: 0, slope: 0 };
  }
  const diffPct = ((emaFast - emaSlow) / emaSlow) * 100;
  const slope = emaFastPrev ? ((emaFast - emaFastPrev) / emaFastPrev) * 100 : 0;
  const direction =
    emaFast > emaSlow && slope > 0 ? 1 : emaFast < emaSlow && slope < 0 ? -1 : 0;
  const strength = clampNumber(Math.abs(diffPct) / 2, 0, 1);
  return { direction, strength, slope };
}

function computeIndicators(candles, params = {}) {
  const periods = { ...DEFAULT_PERIODS, ...(params.periods ?? {}) };
  const closes = extractCloses(candles ?? []);
  const { current: emaFast, previous: emaFastPrev } = calculateEma(closes, periods.emaFast);
  const { current: emaSlow } = calculateEma(closes, periods.emaSlow);
  const rsi = calculateRsi(closes, periods.rsi);
  const atr = calculateAtr(candles ?? [], periods.atr);
  const returns = calculateReturns(closes, periods.returns);
  const trend = computeTrend({ emaFast, emaSlow, emaFastPrev });

  return {
    rsi,
    emaFast,
    emaSlow,
    atr,
    returns,
    trend,
  };
}

function buildVolatilityProfile(atrPercent, config = ACTIVE_CONFIG) {
  if (atrPercent == null) {
    return { label: "unknown", stability: 0.45, bias: 0, caution: "Volatility data limited." };
  }
  const profiles = config?.volatility?.profiles ?? DEFAULT_CONFIG.volatility.profiles;
  const match =
    profiles.find((profile) => typeof profile.max === "number" && atrPercent <= profile.max) ??
    profiles[profiles.length - 1];
  return {
    label: match?.label ?? "unknown",
    stability: match?.stability ?? 0.45,
    bias: match?.bias ?? 0,
    caution: match?.caution ?? "Volatility data limited.",
  };
}

function formatPercent(value) {
  if (value == null || Number.isNaN(value)) {
    return "n/a";
  }
  return `${value.toFixed(2)}%`;
}

/**
 * Scores signals on a 0–100 scale with BUY >= 65, SELL <= 35, HOLD otherwise.
 * Trend (EMA cross + slope), RSI momentum, mean reversion distance to EMA,
 * and volatility regime are blended into a weighted score and confidence.
 */
function scoreSignal(indicators, params = {}) {
  const config = params.config ?? ACTIVE_CONFIG;
  const weights = config?.score?.weights ?? DEFAULT_CONFIG.score.weights;
  const price = params.price ?? null;
  const emaFast = indicators?.emaFast ?? null;
  const emaSlow = indicators?.emaSlow ?? null;
  const rsi = indicators?.rsi ?? null;
  const atr = indicators?.atr ?? null;
  const trend = indicators?.trend ?? { direction: 0, strength: 0, slope: 0 };
  const atrPercent = price && atr ? (atr / price) * 100 : null;

  let trendBias = 0;
  if (emaFast != null && emaSlow != null) {
    const diffPct = ((emaFast - emaSlow) / emaSlow) * 100;
    const slopeAdj = trend.slope / (config?.score?.trendSlopeDivider ?? DEFAULT_CONFIG.score.trendSlopeDivider);
    const diffWeight = config?.score?.trendDiffDivider ?? DEFAULT_CONFIG.score.trendDiffDivider;
    const biasDivisor = config?.score?.trendBiasDivider ?? DEFAULT_CONFIG.score.trendBiasDivider;
    trendBias = clampNumber((diffPct / diffWeight + slopeAdj) / biasDivisor, -1, 1);
  }

  let momentumBias = 0;
  if (rsi != null) {
    if (rsi > 60) {
      momentumBias = clampNumber((rsi - 60) / 20, 0, 1);
    } else if (rsi < 40) {
      momentumBias = -clampNumber((40 - rsi) / 20, 0, 1);
    }
  }

  let meanReversionBias = 0;
  if (price != null && emaFast != null) {
    const distancePct = ((price - emaFast) / emaFast) * 100;
    const divider = config?.score?.meanReversionDivider ?? DEFAULT_CONFIG.score.meanReversionDivider;
    meanReversionBias = clampNumber(-distancePct / divider, -1, 1);
  }

  const volatilityProfile = buildVolatilityProfile(atrPercent, config);

  const contributions = [
    { key: "trend", label: "Trend", weight: weights.trend, bias: trendBias },
    { key: "momentum", label: "Momentum (RSI)", weight: weights.momentum, bias: momentumBias },
    { key: "meanReversion", label: "Mean reversion", weight: weights.meanReversion, bias: meanReversionBias },
    { key: "volatility", label: "Volatility regime", weight: weights.volatility, bias: volatilityProfile.bias },
  ];

  const score = clampNumber(
    Math.round(
      50 +
        contributions.reduce((sum, component) => sum + component.bias * component.weight, 0),
    ),
    0,
    100,
  );

  const thresholds = config?.score?.thresholds ?? SCORE_THRESHOLDS;
  const signal = score >= thresholds.buy ? "buy" : score <= thresholds.sell ? "sell" : "hold";

  const alignedCount = contributions.filter((component) => {
    if (signal === "hold") {
      return Math.abs(component.bias) < 0.2;
    }
    return signal === "buy" ? component.bias > 0.1 : component.bias < -0.1;
  }).length;
  const alignmentWeight =
    config?.confidence?.alignmentWeight ?? DEFAULT_CONFIG.confidence.alignmentWeight;
  const alignmentScore = (alignedCount / contributions.length) * alignmentWeight;
  const distanceFromThreshold =
    signal === "buy"
      ? (score - thresholds.buy) / (100 - thresholds.buy)
      : signal === "sell"
        ? (thresholds.sell - score) / thresholds.sell
        : Math.min(score - thresholds.sell, thresholds.buy - score) / 30;
  const confidenceConfig = config?.confidence ?? DEFAULT_CONFIG.confidence;
  const distanceScore = clampNumber(distanceFromThreshold, 0, 1) * confidenceConfig.distanceWeight;
  const volatilityScore = volatilityProfile.stability * confidenceConfig.volatilityWeight;
  const confidence = clampNumber(
    Math.round(alignmentScore + distanceScore + volatilityScore),
    0,
    100,
  );

  const reasons = [
    trendBias > 0.15
      ? "EMA trend is bullish with rising slope confirmation."
      : trendBias < -0.15
        ? "EMA trend is bearish with downside slope confirmation."
        : "EMA trend is mixed and lacks slope confirmation.",
    rsi == null
      ? "RSI momentum is unavailable due to limited history."
      : rsi > 60
        ? `RSI momentum is bullish (${rsi.toFixed(1)}).`
        : rsi < 40
          ? `RSI momentum is bearish (${rsi.toFixed(1)}).`
          : `RSI is neutral (${rsi.toFixed(1)}).`,
    price != null && emaFast != null
      ? `Price is ${formatPercent(((price - emaFast) / emaFast) * 100)} vs EMA fast.`
      : "Price/EMA distance is unavailable.",
    `ATR volatility regime is ${volatilityProfile.label} (${atrPercent != null ? `${atrPercent.toFixed(2)}%` : "n/a"}).`,
  ];

  return {
    signal,
    score,
    confidence,
    reasons,
    caution: volatilityProfile.caution,
    components: contributions.map((component) => ({
      key: component.key,
      label: component.label,
      max: component.weight,
      score: Math.round(((component.bias + 1) / 2) * component.weight),
      bias: component.bias,
    })),
  };
}

function getMinCandles(periods) {
  if (!periods) {
    return 0;
  }
  const values = Object.values(periods).filter((value) => Number.isFinite(value));
  return values.length ? Math.max(...values) + 1 : 0;
}

function scoreMultiTimeframe(candles = [], params = {}) {
  const config = params.config ?? ACTIVE_CONFIG;
  const timeframes = config?.indicators?.timeframes ?? DEFAULT_CONFIG.indicators.timeframes;
  const shortConfig = timeframes.short ?? timeframes.long;
  const longConfig = timeframes.long ?? timeframes.short;
  const prices = Array.isArray(candles) ? candles : [];
  const resolvedPrice =
    params.price ??
    (prices.length
      ? typeof prices[prices.length - 1] === "number"
        ? prices[prices.length - 1]
        : prices[prices.length - 1]?.close ?? prices[prices.length - 1]?.price ?? null
      : null);
  const shortSlice = prices.slice(-shortConfig.lookback);
  const longSlice = prices.slice(-longConfig.lookback);
  const shortMin = getMinCandles(shortConfig.periods);
  const longMin = getMinCandles(longConfig.periods);

  if (shortSlice.length < shortMin || longSlice.length < longMin) {
    const needed = Math.max(shortMin, longMin);
    return {
      signal: "hold",
      score: 50,
      confidence: 0,
      reasons: [],
      components: [],
      error: {
        message: "Not enough price history to compute multi-timeframe signals.",
        needed,
        available: prices.length,
      },
    };
  }

  const shortIndicators = computeIndicators(shortSlice, { periods: shortConfig.periods });
  const longIndicators = computeIndicators(longSlice, { periods: longConfig.periods });
  const shortScore = scoreSignal(shortIndicators, { price: resolvedPrice, config });
  const longScore = scoreSignal(longIndicators, { price: resolvedPrice, config });

  const shortWeight = shortConfig.weight ?? 0.5;
  const longWeight = longConfig.weight ?? 0.5;
  const combinedScore = Math.round(shortScore.score * shortWeight + longScore.score * longWeight);
  const thresholds = config?.score?.thresholds ?? SCORE_THRESHOLDS;
  let signal = combinedScore >= thresholds.buy ? "buy" : combinedScore <= thresholds.sell ? "sell" : "hold";
  let conflict = null;
  if (shortScore.signal !== longScore.signal) {
    const conflictPenalty = config?.confidence?.conflictPenalty ?? DEFAULT_CONFIG.confidence.conflictPenalty;
    if (
      (longScore.signal === "buy" && shortScore.signal === "sell") ||
      (longScore.signal === "sell" && shortScore.signal === "buy")
    ) {
      signal = "hold";
    }
    conflict = {
      shortSignal: shortScore.signal,
      longSignal: longScore.signal,
      resolution:
        signal === "hold"
          ? "Short-term and long-term signals conflict; defaulting to HOLD."
          : `Long-term ${longScore.signal.toUpperCase()} trend dominates; treat short-term ${shortScore.signal.toUpperCase()} as tactical timing.`,
      penalty: conflictPenalty,
    };
  }

  const mergedComponents = (shortScore.components ?? []).map((component) => {
    const match = (longScore.components ?? []).find((entry) => entry.key === component.key);
    const shortComponentScore = component.score ?? 0;
    const longComponentScore = match?.score ?? 0;
    return {
      key: component.key,
      label: component.label,
      max: component.max ?? match?.max ?? 0,
      score: Math.round(shortComponentScore * shortWeight + longComponentScore * longWeight),
      bias: clampNumber(((component.bias ?? 0) + (match?.bias ?? 0)) / 2, -1, 1),
    };
  });

  return {
    signal,
    score: combinedScore,
    confidence: Math.round((shortScore.confidence + longScore.confidence) / 2),
    reasons: [...(longScore.reasons ?? []), ...(shortScore.reasons ?? [])].slice(0, 5),
    components: mergedComponents,
    timeframes: {
      short: {
        label: shortConfig.label,
        lookback: shortConfig.lookback,
        indicators: shortIndicators,
        score: shortScore,
      },
      long: {
        label: longConfig.label,
        lookback: longConfig.lookback,
        indicators: longIndicators,
        score: longScore,
      },
    },
    conflict,
  };
}

const strategy = { computeIndicators, scoreSignal, scoreMultiTimeframe, SCORE_THRESHOLDS };

if (typeof window !== "undefined") {
  window.Strategy = strategy;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = strategy;
}
