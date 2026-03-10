import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  StyleSheet, TextInput, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchMarkets } from '../services/api';
import { evaluateAlerts } from '../services/alertEngine';
import { calculateRSI } from '../services/indicators';
import { COLORS, Asset } from '../utils/constants';

export default function MarketsScreen() {
  const nav = useNavigation<any>();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'indices' | 'commodities' | 'crypto'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchMarkets();
    setAssets(data);
    setLoading(false);
    // Evaluate alerts on every refresh
    if (data.length > 0) evaluateAlerts(data);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, [load]);

  const filtered = assets.filter(a => {
    if (filter !== 'all' && a.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q);
    }
    return true;
  });

  const fmtPrice = (n: number) => {
    if (n >= 10000) return '$' + Math.round(n).toLocaleString();
    if (n >= 1) return '$' + n.toFixed(2);
    return '$' + n.toFixed(4);
  };

  const renderAsset = ({ item }: { item: Asset }) => {
    const pct = item.price_change_percentage_24h;
    const color = pct == null ? COLORS.textMuted : pct >= 0 ? COLORS.green : COLORS.red;
    const rsi = calculateRSI(item.sparkline);

    return (
      <TouchableOpacity
        style={s.row}
        activeOpacity={0.6}
        onPress={() => nav.navigate('CreateAlert', { asset: item })}
      >
        <View style={s.rowLeft}>
          <Text style={s.symbol}>{item.symbol}</Text>
          <Text style={s.name} numberOfLines={1}>{item.name}</Text>
        </View>
        <View style={s.rowRight}>
          <Text style={s.price}>{fmtPrice(item.current_price)}</Text>
          <View style={[s.pctBadge, { backgroundColor: pct && pct >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)' }]}>
            <Text style={[s.pct, { color }]}>
              {pct != null ? (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%' : '—'}
            </Text>
          </View>
        </View>
        {rsi != null && (
          <View style={[s.rsiBadge, {
            backgroundColor: rsi > 70 ? 'rgba(248,113,113,0.12)' : rsi < 30 ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
          }]}>
            <Text style={[s.rsiText, {
              color: rsi > 70 ? COLORS.red : rsi < 30 ? COLORS.green : COLORS.textMuted,
            }]}>RSI {rsi.toFixed(0)}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filters = ['all', 'indices', 'commodities', 'crypto'] as const;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>◈ Markets</Text>
        <Text style={s.subtitle}>{assets.length} assets · Tap to set alert</Text>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          placeholder="Search..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Filter */}
      <View style={s.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, filter === f && s.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Asset List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderAsset}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.accent} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, fontFamily: 'monospace' },
  subtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, fontFamily: 'monospace' },
  searchWrap: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: {
    backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    color: COLORS.text, fontSize: 13, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'transparent',
  },
  filterBtnActive: { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.2)' },
  filterText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.accent },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  rowLeft: { flex: 1 },
  symbol: { fontSize: 13, fontWeight: '700', color: COLORS.text, fontFamily: 'monospace' },
  name: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  price: { fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: 'monospace' },
  pctBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pct: { fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
  rsiBadge: { marginLeft: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  rsiText: { fontSize: 9, fontWeight: '700', fontFamily: 'monospace' },
});
