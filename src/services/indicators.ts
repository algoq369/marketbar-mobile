// ─── Technical Indicators ───────────────────────────────────────────
// Pure functions for RSI, MACD, Fibonacci, momentum divergence.
// Aligned with AlgoQ Trading Engine v1.0 rulebook.

// ─── RSI (Wilder's Smoothing — industry standard) ──────────────────
export function calculateRSI(prices: number[], period = 14): number | null {
  if (prices.length < period + 1) return null;

  // First RSI: simple average for initial seed
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;

  // Wilder's smoothing for remaining data
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ─── MACD ───────────────────────────────────────────────────────────
function ema(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    result.push(prices[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

export interface MACDResult {
  macdLine: number;
  signalLine: number;
  histogram: number;
  crossover: 'bullish' | 'bearish' | 'none';
}

export function calculateMACD(
  prices: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDResult | null {
  if (prices.length < slowPeriod + signalPeriod) return null;

  const fastEMA = ema(prices, fastPeriod);
  const slowEMA = ema(prices, slowPeriod);

  const macdValues: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    macdValues.push(fastEMA[i] - slowEMA[i]);
  }

  const signalEMA = ema(macdValues, signalPeriod);

  const current = macdValues.length - 1;
  const prev = current - 1;

  const macdLine = macdValues[current];
  const signalLine = signalEMA[current];
  const histogram = macdLine - signalLine;

  let crossover: 'bullish' | 'bearish' | 'none' = 'none';
  if (prev >= 0) {
    const prevMacd = macdValues[prev];
    const prevSignal = signalEMA[prev];
    if (prevMacd <= prevSignal && macdLine > signalLine) crossover = 'bullish';
    if (prevMacd >= prevSignal && macdLine < signalLine) crossover = 'bearish';
  }

  return { macdLine, signalLine, histogram, crossover };
}

// ─── Fibonacci Levels ───────────────────────────────────────────────
export interface FibLevels {
  high: number;
  low: number;
  levels: { ratio: number; price: number; label: string }[];
}

export function calculateFibLevels(prices: number[]): FibLevels | null {
  if (prices.length < 5) return null;

  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const range = high - low;

  if (range === 0) return null;

  const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const levels = ratios.map((r) => ({
    ratio: r,
    price: high - range * r,
    label: r === 0 ? 'High' : r === 1 ? 'Low' : `${(r * 100).toFixed(1)}%`,
  }));

  return { high, low, levels };
}

export function isNearFibLevel(
  currentPrice: number,
  prices: number[],
  targetRatio: number,
  tolerance = 0.005
): boolean {
  const fibs = calculateFibLevels(prices);
  if (!fibs) return false;

  const range = fibs.high - fibs.low;
  const targetPrice = fibs.high - range * targetRatio;
  const diff = Math.abs(currentPrice - targetPrice) / targetPrice;
  return diff <= tolerance;
}

// ─── Volume Spike (2× average — per engine rulebook) ────────────────
export function isVolumeSpike(volumes: number[], multiplier = 2): boolean {
  if (volumes.length < 5) return false;
  const recent = volumes.slice(-5, -1);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const current = volumes[volumes.length - 1];
  return current > avg * multiplier;
}

// ─── Momentum Divergence ────────────────────────────────────────────
export type DivergenceType = 'bullish' | 'bearish' | 'none';

export function detectMomentumDivergence(prices: number[]): DivergenceType {
  if (prices.length < 28) return 'none';

  const half = Math.floor(prices.length / 2);
  const firstHalf = prices.slice(0, half);
  const secondHalf = prices.slice(half);

  const rsi1 = calculateRSI(firstHalf);
  const rsi2 = calculateRSI(secondHalf);
  if (rsi1 == null || rsi2 == null) return 'none';

  const priceHigh1 = Math.max(...firstHalf);
  const priceHigh2 = Math.max(...secondHalf);
  const priceLow1 = Math.min(...firstHalf);
  const priceLow2 = Math.min(...secondHalf);

  // Bearish: price higher highs, RSI lower highs
  if (priceHigh2 > priceHigh1 && rsi2 < rsi1 - 3) return 'bearish';

  // Bullish: price lower lows, RSI higher lows
  if (priceLow2 < priceLow1 && rsi2 > rsi1 + 3) return 'bullish';

  return 'none';
}

// ─── Funding Rate Alert (per engine rulebook thresholds) ────────────
export type FundingSignal = 'extreme_long' | 'heavy_long' | 'squeeze_risk' | 'neutral';

export function evaluateFundingRate(rate8h: number): FundingSignal {
  if (rate8h >= 0.001) return 'extreme_long';   // >+0.1% — strong short signal
  if (rate8h >= 0.0005) return 'heavy_long';     // >+0.05% — caution on longs
  if (rate8h <= -0.0002) return 'squeeze_risk';  // <-0.02% — short squeeze potential
  return 'neutral';
}

// ─── Evaluate Alert Condition ───────────────────────────────────────
export function evaluateCondition(
  condition: string,
  targetValue: number,
  currentPrice: number,
  sparkline: number[]
): boolean {
  switch (condition) {
    case 'price_above':
      return currentPrice >= targetValue;
    case 'price_below':
      return currentPrice <= targetValue;
    case 'rsi_overbought': {
      const rsi = calculateRSI(sparkline);
      return rsi != null && rsi >= 70;
    }
    case 'rsi_oversold': {
      const rsi = calculateRSI(sparkline);
      return rsi != null && rsi <= 30;
    }
    case 'macd_bullish_cross': {
      const macd = calculateMACD(sparkline);
      return macd != null && macd.crossover === 'bullish';
    }
    case 'macd_bearish_cross': {
      const macd = calculateMACD(sparkline);
      return macd != null && macd.crossover === 'bearish';
    }
    case 'fib_236':
      return isNearFibLevel(currentPrice, sparkline, 0.236);
    case 'fib_382':
      return isNearFibLevel(currentPrice, sparkline, 0.382);
    case 'fib_500':
      return isNearFibLevel(currentPrice, sparkline, 0.5);
    case 'fib_618':
      return isNearFibLevel(currentPrice, sparkline, 0.618);
    case 'fib_786':
      return isNearFibLevel(currentPrice, sparkline, 0.786);
    case 'volume_spike':
      // Volume spike needs volume data — evaluate from sparkline price volatility as proxy
      // (True volume spike detection requires volume array from API, not just sparkline)
      if (sparkline.length < 10) return false;
      const recent = sparkline.slice(-10);
      const changes = recent.map((v, i) => i === 0 ? 0 : Math.abs(v - recent[i-1]) / recent[i-1]);
      const avgChange = changes.slice(1, -1).reduce((a, b) => a + b, 0) / (changes.length - 2);
      const lastChange = changes[changes.length - 1];
      return lastChange > avgChange * 2.5; // price volatility spike as volume proxy
    case 'momentum_divergence': {
      const div = detectMomentumDivergence(sparkline);
      return div !== 'none';
    }
    default:
      return false;
  }
}
