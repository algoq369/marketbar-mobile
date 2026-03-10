import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadAlerts, removeAlert, toggleAlert } from '../services/alertEngine';
import { COLORS, PriceAlert, CONDITION_LABELS } from '../utils/constants';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAlerts().then(setAlerts);
    }, [])
  );

  const handleDelete = (id: string, symbol: string) => {
    Alert.alert('Delete Alert', `Remove ${symbol} alert?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => setAlerts(await removeAlert(id)),
      },
    ]);
  };

  const handleToggle = async (id: string) => {
    setAlerts(await toggleAlert(id));
  };

  const activeAlerts = alerts.filter(a => a.enabled && !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);
  const disabledAlerts = alerts.filter(a => !a.enabled && !a.triggered);

  const renderAlert = ({ item }: { item: PriceAlert }) => {
    const cond = CONDITION_LABELS[item.condition];
    const isTriggered = item.triggered;
    const isDisabled = !item.enabled;

    return (
      <TouchableOpacity
        style={[s.alertCard, isTriggered && s.triggeredCard, isDisabled && s.disabledCard]}
        onPress={() => handleToggle(item.id)}
        onLongPress={() => handleDelete(item.id, item.assetSymbol)}
        activeOpacity={0.7}
      >
        <View style={s.alertLeft}>
          <View style={s.alertHeader}>
            <Text style={[s.alertIcon, { color: cond.color }]}>{cond.icon}</Text>
            <Text style={s.alertSymbol}>{item.assetSymbol}</Text>
            {isTriggered && <Text style={s.triggeredBadge}>TRIGGERED</Text>}
            {isDisabled && <Text style={s.disabledBadge}>PAUSED</Text>}
          </View>
          <Text style={s.alertCondition}>{cond.label}</Text>
          {(item.condition === 'price_above' || item.condition === 'price_below') && (
            <Text style={s.alertTarget}>
              Target: ${item.targetValue.toLocaleString()}
              {item.currentValue ? ` · Now: $${item.currentValue.toLocaleString()}` : ''}
            </Text>
          )}
          {isTriggered && item.triggeredAt && (
            <Text style={s.triggeredTime}>
              {new Date(item.triggeredAt).toLocaleString()}
            </Text>
          )}
        </View>
        <View style={[s.statusDot, {
          backgroundColor: isTriggered ? COLORS.yellow : isDisabled ? COLORS.textMuted : COLORS.green,
        }]} />
      </TouchableOpacity>
    );
  };

  const sections = [
    { title: 'Active', data: activeAlerts, color: COLORS.green },
    { title: 'Triggered', data: triggeredAlerts, color: COLORS.yellow },
    { title: 'Paused', data: disabledAlerts, color: COLORS.textMuted },
  ].filter(s => s.data.length > 0);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>⚡ Alerts</Text>
        <Text style={s.subtitle}>
          {activeAlerts.length} active · {triggeredAlerts.length} triggered · Long press to delete
        </Text>
      </View>

      {alerts.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>⚡</Text>
          <Text style={s.emptyTitle}>No alerts yet</Text>
          <Text style={s.emptyText}>
            Tap any asset in Markets to create an alert.{'\n'}
            Price, RSI, MACD, Fibonacci, momentum divergence.
          </Text>
        </View>
      ) : (
        <FlatList
          data={[
            ...sections.flatMap(sec => [
              { _type: 'header', title: sec.title, color: sec.color, count: sec.data.length } as any,
              ...sec.data,
            ]),
          ]}
          keyExtractor={(item, i) => item._type === 'header' ? `h-${i}` : item.id}
          renderItem={({ item }) => {
            if (item._type === 'header') {
              return (
                <View style={s.sectionHeader}>
                  <View style={[s.sectionDot, { backgroundColor: item.color }]} />
                  <Text style={s.sectionTitle}>{item.title}</Text>
                  <Text style={s.sectionCount}>{item.count}</Text>
                </View>
              );
            }
            return renderAlert({ item });
          }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, fontFamily: 'monospace' },
  subtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontFamily: 'monospace' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6,
  },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  sectionCount: { fontSize: 10, color: COLORS.textMuted, fontFamily: 'monospace' },
  alertCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 4,
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  triggeredCard: { borderColor: 'rgba(251,191,36,0.2)', backgroundColor: 'rgba(251,191,36,0.04)' },
  disabledCard: { opacity: 0.5 },
  alertLeft: { flex: 1 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertIcon: { fontSize: 16 },
  alertSymbol: { fontSize: 14, fontWeight: '800', color: COLORS.text, fontFamily: 'monospace' },
  triggeredBadge: {
    fontSize: 8, fontWeight: '800', color: COLORS.yellow, backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, letterSpacing: 0.5,
  },
  disabledBadge: {
    fontSize: 8, fontWeight: '800', color: COLORS.textMuted, backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, letterSpacing: 0.5,
  },
  alertCondition: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  alertTarget: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontFamily: 'monospace' },
  triggeredTime: { fontSize: 10, color: COLORS.yellow, marginTop: 4, fontFamily: 'monospace' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
});
