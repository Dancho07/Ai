(function createSignalConfigModule(root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else if (root) {
    root.SignalConfig = factory();
  }
})(typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : null, () => ({
  indicators: {
    timeframes: {
      short: {
        label: "10D",
        lookback: 10,
        weight: 0.45,
        periods: {
          emaFast: 3,
          emaSlow: 8,
          rsi: 5,
          atr: 5,
          returns: 5,
          slope: 3,
        },
      },
      long: {
        label: "30D",
        lookback: 30,
        weight: 0.55,
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
    thresholds: {
      buy: 65,
      sell: 35,
    },
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
    atrLookback: 30,
  },
  confidence: {
    alignmentWeight: 50,
    distanceWeight: 30,
    volatilityWeight: 20,
    conflictPenalty: 12,
  },
  tradePlan: {
    entryRangePct: 0.003,
    atrStopMultiplier: 1.2,
    atrFallbackPct: 0.02,
    riskRewardMultiple: 2,
    swingLookback: 10,
    holdLookback: {
      min: 10,
      max: 20,
    },
    stopDistanceLimits: {
      minPct: 0.0025,
      maxPct: 0.2,
      minAbs: 0.05,
    },
  },
  invalidation: {
    maThreshold: 1,
    volatilityThreshold: 5,
    volatilityHoldThreshold: 6,
  },
  timeHorizon: {
    trendWeak: 2,
    trendModerate: 5,
    volatilityLow: 2.5,
    volatilityMedium: 4.5,
  },
  risk: {
    limits: {
      low: 0.2,
      moderate: 0.4,
      high: 0.6,
    },
    perTrade: {
      low: 0.005,
      moderate: 0.01,
      high: 0.015,
    },
    sizing: {
      riskPercentByTolerance: {
        low: 0.5,
        moderate: 1,
        high: 2,
      },
      maxPositionPctByTolerance: {
        low: 0.1,
        moderate: 0.15,
        high: 0.25,
      },
    },
    percentLimits: {
      min: 0.1,
      max: 5,
      fallback: 1,
    },
  },
  broker: {
    allowFractional: false,
    fractionalPrecision: 2,
  },
  portfolio: {
    sectorExposureCap: {
      low: 0.2,
      moderate: 0.25,
      high: 0.3,
    },
    correlationBucketCap: {
      low: 0.2,
      moderate: 0.25,
      high: 0.3,
    },
    maxOpenPositionsByHorizon: {
      scalp: 3,
      swing: 5,
      position: 7,
    },
    megaCapTechSymbols: ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA"],
    openPositions: [],
  },
  backtest: {
    minCandles: 15,
  },
}));
