import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createAlert, addAlert } from '../services/alertEngine';
import { calculateRSI, calculateMACD, calculateFibLevels } from '../services/indicators';
import {
  COLORS, CONDITION_LABELS, Asset,
  type AlertCondition,
} from '../utils/constants';

type ConditionGroup = {
  title: string;
  conditions: AlertCondition[];
};

const CONDITION_GROUPS: ConditionGroup[] = [
  {
    title: 'Price',
    conditions: ['price_above', 'price_below'],
  },
  {
    title: 'Momentum',
    conditions: ['rsi_overbought', 'rsi_oversold', 'momentum_divergence'],
  },
  {
    title: 'MACD',
    conditions: ['macd_bullish_cross', 'macd_bearish_cross'],
  },
  {
    title: 'Fibonacci',
    conditions: ['fib_236', 'fib_382', 'fib_500', 'fib_618', 'fib_786'],
  },
];

export default function CreateAlertScreen() {
  const nav = useNavigation();
  const route = useRoute<any>();
  const asset: Asset = route.params?.asset;

  const [selectedCondition, setSelectedCondition] = useState<AlertCondition | null>(null);
  const [targetValue, setTargetValue] = useState(asset ? asset.current_price.toString() : '');

  if (!asset) {
    return (
      <SafeAreaView style={s.container}>
        <Text style={s.errorText}>No asset selected</Text>
      </SafeAreaView>
    );
  }

  // Live indicator values
  const rsi = calculateRSI(asset.sparkline);
  const macd = calculateMACD(asset.sparkline);
  const fibs = calculateFibLevels(asset.sparkline);

  const handleCreate = async () => {
    if (!selectedCondition) {
      Alert.alert('Select a condition', 'Pick an indicator or price condition for the alert.');
      return;
    }

    const value = parseFloat(targetValue);
    if ((selectedCondition === 'price_above' || selectedCondition === 'price_below') && (isNaN(value) || value <= 0)) {
      Alert.alert('Invalid price', 'Enter a valid target price.');
      return;
    }

    const alert = createAlert(asset, selectedCondition, value || 0);
    await addAlert(alert);
    nav.goBack();
  };

  const needsPrice = selectedCondition === 'price_above' || selectedCondition === 'price_below';

  const fmtPrice = (n: number) => {
    if (n >= 1000) return '$' + Math.round(n).toLocaleString();
    if (n >= 1) return '$' + n.toFixed(2);
    return '$' + n.toFixed(4);
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}>
              <Text style={s.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={s.title}>New Alert</Text>
          </View>

          {/* Asset Info */}
          <View style={s.assetCard}>
            <Text style={s.assetSymbol}>{asset.symbol}</Text>
            <Text style={s.assetName}>{asset.name}</Text>
            <Text style={s.assetPrice}>{fmtPrice(asset.current_price)}</Text>
            {asset.price_change_percentage_24h != null && (
              <Text style={[s.assetPct, {
                color: asset.price_change_percentage_24h >= 0 ? COLORS.green : COLORS.red,
              }]}>
                {asset.price_change_percentage_24h >= 0 ? '+' : ''}
                {asset.price_change_percentage_24h.toFixed(2)}% 24h
              </Text>
            )}
          </View>

          {/* Live Indicators */}
          <View style={s.indicatorsRow}>
            {rsi != null && (
              <View style={[s.indicatorChip, {
                borderColor: rsi > 70 ? COLORS.red : rsi < 30 ? COLORS.green : COLORS.cardBorder,
              }]}>
                <Text style={s.indicatorLabel}>RSI</Text>
                <Text style={[s.indicatorValue, {
                  color: rsi > 70 ? COLORS.red : rsi < 30 ? COLORS.green : COLORS.text,
                }]}>{rsi.toFixed(1)}</Text>
              </View>
            )}
            {macd != null && (
              <View style={[s.indicatorChip, {
                borderColor: macd.histogram > 0 ? COLORS.green : COLORS.red,
              }]}>
                <Text style={s.indicatorLabel}>MACD</Text>
                <Text style={[s.indicatorValue, {
                  color: macd.histogram > 0 ? COLORS.green : COLORS.red,
                }]}>{macd.histogram > 0 ? 'Bullish' : 'Bearish'}</Text>
              </View>
            )}
            {fibs != null && (
              <View style={[s.indicatorChip, { borderColor: COLORS.blue }]}>
                <Text style={s.indicatorLabel}>Fib Range</Text>
                <Text style={[s.indicatorValue, { color: COLORS.blue }]}>
                  {fmtPrice(fibs.low)} — {fmtPrice(fibs.high)}
                </Text>
              </View>
            )}
          </View>

          {/* Condition Picker */}
          {CONDITION_GROUPS.map(group => (
            <View key={group.title}>
              <Text style={s.groupTitle}>{group.title}</Text>
              <View style={s.conditionGrid}>
                {group.conditions.map(cond => {
                  const info = CONDITION_LABELS[cond];
                  const isSelected = selectedCondition === cond;
                  return (
                    <TouchableOpacity
                      key={cond}
                      style={[s.conditionBtn, isSelected && { borderColor: info.color, backgroundColor: info.color + '15' }]}
                      onPress={() => {
                        setSelectedCondition(cond);
                        // Auto-fill fib price targets
                        if (cond.startsWith('fib_') && fibs) {
                          const ratio = parseFloat(cond.replace('fib_', '')) / 1000;
                          const level = fibs.high - (fibs.high - fibs.low) * ratio;
                          setTargetValue(level.toFixed(2));
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.conditionIcon, { color: info.color }]}>{info.icon}</Text>
                      <Text style={[s.conditionLabel, isSelected && { color: COLORS.text }]}>{info.label}</Text>
                      <Text style={s.conditionDesc} numberOfLines={2}>{info.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Target Price Input (for price alerts) */}
          {needsPrice && (
            <View style={s.priceInputWrap}>
              <Text style={s.inputLabel}>Target Price</Text>
              <TextInput
                style={s.priceInput}
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
              />
              <View style={s.quickPriceRow}>
                {[0.95, 0.98, 1.02, 1.05, 1.10].map(mult => (
                  <TouchableOpacity
                    key={mult}
                    style={s.quickPriceBtn}
                    onPress={() => setTargetValue((asset.current_price * mult).toFixed(2))}
                  >
                    <Text style={s.quickPriceText}>
                      {mult < 1 ? `${((1 - mult) * 100).toFixed(0)}%↓` : `+${((mult - 1) * 100).toFixed(0)}%↑`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Create Button */}
          <TouchableOpacity
            style={[s.createBtn, !selectedCondition && s.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!selectedCondition}
            activeOpacity={0.8}
          >
            <Text style={s.createBtnText}>
              {selectedCondition ? `⚡ Create ${CONDITION_LABELS[selectedCondition].label} Alert` : 'Select a Condition'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 16, paddingBottom: 0 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 14, color: COLORS.accent, fontFamily: 'monospace' },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  errorText: { color: COLORS.red, textAlign: 'center', marginTop: 40 },
  assetCard: {
    margin: 16, padding: 16, backgroundColor: COLORS.surface, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  assetSymbol: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, fontFamily: 'monospace', letterSpacing: 1 },
  assetName: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  assetPrice: { fontSize: 28, fontWeight: '800', color: COLORS.text, fontFamily: 'monospace', marginTop: 8 },
  assetPct: { fontSize: 13, fontWeight: '600', marginTop: 4, fontFamily: 'monospace' },
  indicatorsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  indicatorChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: COLORS.surface, borderWidth: 1,
  },
  indicatorLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, fontFamily: 'monospace', letterSpacing: 1 },
  indicatorValue: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace', marginTop: 2 },
  groupTitle: {
    fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1.5,
    textTransform: 'uppercase', paddingHorizontal: 16, marginTop: 12, marginBottom: 8,
  },
  conditionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  conditionBtn: {
    width: '47%', padding: 12, borderRadius: 12, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  conditionIcon: { fontSize: 18, marginBottom: 4 },
  conditionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  conditionDesc: { fontSize: 10, color: COLORS.textMuted, marginTop: 4, lineHeight: 14 },
  priceInputWrap: { padding: 16 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 8 },
  priceInput: {
    backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: COLORS.text, fontSize: 20, fontWeight: '700', fontFamily: 'monospace',
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  quickPriceRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  quickPriceBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  quickPriceText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, fontFamily: 'monospace' },
  createBtn: {
    margin: 16, paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: COLORS.accent,
  },
  createBtnDisabled: { backgroundColor: COLORS.surface, opacity: 0.5 },
  createBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.bg },
});
