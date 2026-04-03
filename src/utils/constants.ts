// ─── Theme ──────────────────────────────────────────────────────────
export const COLORS = {
  bg: '#0c0e13',
  card: '#141720',
  cardBorder: 'rgba(255,255,255,0.06)',
  surface: '#1a1d24',
  green: '#34d399',
  red: '#f87171',
  yellow: '#fbbf24',
  blue: '#60a5fa',
  purple: '#a78bfa',
  text: '#f0f1f3',
  textSecondary: '#9ca3af',
  textMuted: '#4b5563',
  accent: '#34d399',
} as const;

export const FONTS = {
  mono: 'monospace',
};

// ─── Alert Types ────────────────────────────────────────────────────
export type AlertCondition =
  | 'price_above'
  | 'price_below'
  | 'rsi_overbought'
  | 'rsi_oversold'
  | 'macd_bullish_cross'
  | 'macd_bearish_cross'
  | 'fib_236'
  | 'fib_382'
  | 'fib_500'
  | 'fib_618'
  | 'fib_786'
  | 'volume_spike'
  | 'momentum_divergence';

export interface PriceAlert {
  id: string;
  assetId: string;
  assetSymbol: string;
  assetName: string;
  condition: AlertCondition;
  targetValue: number;
  currentValue?: number;
  label: string;
  enabled: boolean;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  category: 'indices' | 'commodities' | 'crypto';
  current_price: number;
  price_change_percentage_24h: number | null;
  sparkline: number[];
  image?: string | null;
}

// ─── Condition Labels ───────────────────────────────────────────────
export const CONDITION_LABELS: Record<AlertCondition, { label: string; icon: string; color: string; description: string }> = {
  price_above:         { label: 'Price Above',         icon: '↑', color: COLORS.green,  description: 'Alert when price crosses above target' },
  price_below:         { label: 'Price Below',         icon: '↓', color: COLORS.red,    description: 'Alert when price crosses below target' },
  rsi_overbought:      { label: 'RSI Overbought',      icon: '⚡', color: COLORS.red,    description: 'RSI crosses above 70 (overbought zone)' },
  rsi_oversold:        { label: 'RSI Oversold',        icon: '⚡', color: COLORS.green,  description: 'RSI crosses below 30 (oversold zone)' },
  macd_bullish_cross:  { label: 'MACD Bull Cross',     icon: '✦', color: COLORS.green,  description: 'MACD line crosses above signal line' },
  macd_bearish_cross:  { label: 'MACD Bear Cross',     icon: '✦', color: COLORS.red,    description: 'MACD line crosses below signal line' },
  fib_236:             { label: 'Fib 0.236',           icon: '◇', color: COLORS.blue,   description: 'Price approaching 23.6% Fibonacci level' },
  fib_382:             { label: 'Fib 0.382',           icon: '◇', color: COLORS.blue,   description: 'Price approaching 38.2% Fibonacci level' },
  fib_500:             { label: 'Fib 0.500',           icon: '◇', color: COLORS.yellow, description: 'Price approaching 50% Fibonacci level' },
  fib_618:             { label: 'Fib 0.618',           icon: '◇', color: COLORS.purple, description: 'Price approaching 61.8% golden ratio level' },
  fib_786:             { label: 'Fib 0.786',           icon: '◇', color: COLORS.purple, description: 'Price approaching 78.6% Fibonacci level' },
  volume_spike:        { label: 'Volume Spike',        icon: '▮', color: COLORS.yellow, description: 'Volume exceeds 2x average (unusual activity)' },
  momentum_divergence: { label: 'Momentum Divergence', icon: '⟁', color: COLORS.purple, description: 'Price and momentum moving in opposite directions' },
};

// ─── Backend URL ────────────────────────────────────────────────────
// For dev: your local MarketBar backend
// For prod: replace with your deployed server URL
export const API_BASE = __DEV__
  ? 'https://marketbar.vercel.app/api'
  : 'https://your-server.com/api';
