// ─── Technical Indicators ───────────────────────────────────────────
// Pure functions for RSI, MACD, Fibonacci, momentum divergence.
// All calculations happen client-side on sparkline/price data.

// ─── RSI (Relative Strength Index) ─────────────────────────────────
export function calculateRSI(prices: number[], period = 14): number | null {
  if (prices.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

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

  // Detect crossover
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
  tolerance = 0.005 // 0.5% proximity
): boolean {
  const fibs = calculateFibLevels(prices);
  if (!fibs) return false;

  const range = fibs.high - fibs.low;
  const targetPrice = fibs.high - range * targetRatio;
  const diff = Math.abs(currentPrice - targetPrice) / targetPrice;
  return diff <= tolerance;
}

// ─── Volume Spike ───────────────────────────────────────────────────
export function isVolumeSpike(volumes: number[], multiplier = 2): boolean {
  if (volumes.length < 5) return false;
  const recent = volumes.slice(-5, -1);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const current = volumes[volumes.length - 1];
  return current > avg * multiplier;
}

// ─── Momentum Divergence ────────────────────────────────────────────
// Price making new highs but RSI making lower highs (bearish divergence)
// Price making new lows but RSI making higher lows (bullish divergence)
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
    case 'momentum_divergence': {
      const div = detectMomentumDivergence(sparkline);
      return div !== 'none';
    }
    default:
      return false;
  }
}
