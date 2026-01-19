const DEFAULT_PERIODS = {
  emaFast: 12,
  emaSlow: 26,
  rsi: 14,
  atr: 14,
  returns: 10,
  slope: 5,
};

const SCORE_THRESHOLDS = {
  buy: 65,
  sell: 35,
};

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

function buildVolatilityProfile(atrPercent) {
  if (atrPercent == null) {
    return { label: "unknown", stability: 0.45, bias: 0, caution: "Volatility data limited." };
  }
  if (atrPercent <= 2.5) {
    return { label: "low", stability: 1, bias: 0.1, caution: "Low volatility: confirm momentum." };
  }
  if (atrPercent <= 4) {
    return { label: "moderate", stability: 0.8, bias: 0, caution: "Moderate volatility: stay disciplined." };
  }
  if (atrPercent <= 6) {
    return { label: "high", stability: 0.45, bias: -0.4, caution: "High volatility: reduce size or wait." };
  }
  return { label: "very high", stability: 0.2, bias: -0.7, caution: "Very high volatility: avoid choppy tape." };
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
  const weights = {
    trend: 22,
    momentum: 13,
    meanReversion: 10,
    volatility: 5,
  };
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
    const slopeAdj = trend.slope / 1.5;
    trendBias = clampNumber((diffPct / 2 + slopeAdj) / 2, -1, 1);
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
    meanReversionBias = clampNumber(-distancePct / 3.5, -1, 1);
  }

  const volatilityProfile = buildVolatilityProfile(atrPercent);

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

  const signal = score >= SCORE_THRESHOLDS.buy ? "buy" : score <= SCORE_THRESHOLDS.sell ? "sell" : "hold";

  const alignedCount = contributions.filter((component) => {
    if (signal === "hold") {
      return Math.abs(component.bias) < 0.2;
    }
    return signal === "buy" ? component.bias > 0.1 : component.bias < -0.1;
  }).length;
  const alignmentScore = (alignedCount / contributions.length) * 50;
  const distanceFromThreshold =
    signal === "buy"
      ? (score - SCORE_THRESHOLDS.buy) / (100 - SCORE_THRESHOLDS.buy)
      : signal === "sell"
        ? (SCORE_THRESHOLDS.sell - score) / SCORE_THRESHOLDS.sell
        : Math.min(score - SCORE_THRESHOLDS.sell, SCORE_THRESHOLDS.buy - score) / 30;
  const distanceScore = clampNumber(distanceFromThreshold, 0, 1) * 30;
  const volatilityScore = volatilityProfile.stability * 20;
  const confidence = clampNumber(Math.round(alignmentScore + distanceScore + volatilityScore), 0, 100);

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
    })),
  };
}

const strategy = { computeIndicators, scoreSignal, SCORE_THRESHOLDS };

if (typeof window !== "undefined") {
  window.Strategy = strategy;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = strategy;
}
