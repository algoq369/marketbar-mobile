import { Asset, API_BASE } from '../utils/constants';

// ─── Fetch All Assets from MarketBar Backend ────────────────────────
export async function fetchMarkets(): Promise<Asset[]> {
  try {
    // Try backend first
    const [cryptoRes, tradRes] = await Promise.all([
      fetch(`${API_BASE}/crypto/markets`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/traditional/all`).then(r => r.json()).catch(() => null),
    ]);

    const assets: Asset[] = [];

    // Traditional assets
    if (tradRes?.data) {
      const TRAD_META: Record<string, { symbol: string; name: string; category: 'indices' | 'commodities' }> = {
        sp500: { symbol: 'SPX', name: 'S&P 500', category: 'indices' },
        djia: { symbol: 'DJI', name: 'Dow Jones', category: 'indices' },
        nasdaq: { symbol: 'NDX', name: 'Nasdaq 100', category: 'indices' },
        ftse: { symbol: 'FTSE', name: 'FTSE 100', category: 'indices' },
        dax: { symbol: 'DAX', name: 'DAX 40', category: 'indices' },
        nikkei: { symbol: 'N225', name: 'Nikkei 225', category: 'indices' },
        gold: { symbol: 'XAU', name: 'Gold', category: 'commodities' },
        silver: { symbol: 'XAG', name: 'Silver', category: 'commodities' },
        'oil-wti': { symbol: 'WTI', name: 'Crude Oil WTI', category: 'commodities' },
        'oil-brent': { symbol: 'BRN', name: 'Brent Crude', category: 'commodities' },
        natgas: { symbol: 'NG', name: 'Natural Gas', category: 'commodities' },
        platinum: { symbol: 'XPT', name: 'Platinum', category: 'commodities' },
        palladium: { symbol: 'XPD', name: 'Palladium', category: 'commodities' },
        copper: { symbol: 'HG', name: 'Copper', category: 'commodities' },
        wheat: { symbol: 'ZW', name: 'Wheat', category: 'commodities' },
        corn: { symbol: 'ZC', name: 'Corn', category: 'commodities' },
      };

      Object.entries(tradRes.data).forEach(([id, d]: [string, any]) => {
        const meta = TRAD_META[id];
        if (meta && d.price) {
          assets.push({
            id,
            symbol: meta.symbol,
            name: meta.name,
            category: meta.category,
            current_price: d.price,
            price_change_percentage_24h: d.changePercent ?? null,
            sparkline: d.sparkline || [],
          });
        }
      });
    }

    // Crypto assets
    if (cryptoRes?.data && Array.isArray(cryptoRes.data)) {
      cryptoRes.data.forEach((c: any) => {
        assets.push({
          id: c.id,
          symbol: c.symbol.toUpperCase(),
          name: c.name,
          category: 'crypto',
          current_price: c.current_price,
          price_change_percentage_24h: c.price_change_percentage_24h,
          sparkline: c.sparkline_in_7d?.price || [],
          image: c.image,
        });
      });
    }

    return assets;
  } catch (err) {
    console.warn('Failed to fetch markets:', err);
    return [];
  }
}
