# ⚡ MarketBar Mobile — Price Alert Engine

**No-fluff mobile alert system for markets.** Get notified on price action, momentum divergence, Fibonacci zones, RSI extremes, and MACD crossovers.

![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![Expo](https://img.shields.io/badge/Expo-50-purple)

---

## Alert Conditions

| Type | Conditions |
|------|-----------|
| **Price** | Above target, Below target |
| **Momentum** | RSI Overbought (>70), RSI Oversold (<30), Momentum Divergence |
| **MACD** | Bullish crossover, Bearish crossover |
| **Fibonacci** | Approaching 0.236, 0.382, 0.500, 0.618, 0.786 levels |

All indicators are calculated client-side from sparkline data. Alerts fire as local push notifications.

---

## Quick Start

```bash
cd marketbar-mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `i` for iOS simulator / `a` for Android emulator.

### Requirements

- Node.js ≥ 18
- Expo Go app on your phone
- MarketBar backend running at `localhost:3001` (for live data)

---

## Stack

- **TypeScript** + **React Native** (Expo 50)
- **React Navigation** — tab + stack nav
- **Expo Notifications** — local push alerts
- **AsyncStorage** — persisted alert storage
- **Custom indicators** — RSI, MACD, Fibonacci, momentum divergence

---

## Project Structure

```
marketbar-mobile/
├── App.tsx                 # Entry + navigation
├── src/
│   ├── screens/
│   │   ├── MarketsScreen.tsx    # Live prices + RSI badge
│   │   ├── AlertsScreen.tsx     # Manage alerts
│   │   └── CreateAlertScreen.tsx # Indicator picker + alert creation
│   ├── services/
│   │   ├── api.ts               # MarketBar backend integration
│   │   ├── indicators.ts        # RSI, MACD, Fib, divergence
│   │   ├── alertEngine.ts       # Evaluate + fire alerts
│   │   └── notifications.ts     # Expo push notifications
│   └── utils/
│       └── constants.ts         # Theme, types, conditions
├── app.json
└── package.json
```

---

## How Alerts Work

1. **Markets refresh every 60s** from the MarketBar backend
2. On each refresh, the **alert engine evaluates all active alerts** against live data
3. Technical indicators (RSI, MACD, Fib proximity, divergence) are computed from sparkline data
4. When a condition triggers, a **push notification fires** and the alert is marked as triggered
5. Tap an alert to toggle pause/active. Long-press to delete.

---

## License

[MIT](../marketbar/LICENSE) — free and open source.

Built by [@algoq369](https://github.com/algoq369)
