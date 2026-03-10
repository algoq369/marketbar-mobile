import AsyncStorage from '@react-native-async-storage/async-storage';
import { PriceAlert, Asset } from '../utils/constants';
import { evaluateCondition } from './indicators';
import { sendAlertNotification } from './notifications';
import type { AlertCondition } from '../utils/constants';

const ALERTS_KEY = '@marketbar_alerts';

// ─── Persist Alerts ─────────────────────────────────────────────────
export async function loadAlerts(): Promise<PriceAlert[]> {
  try {
    const raw = await AsyncStorage.getItem(ALERTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveAlerts(alerts: PriceAlert[]): Promise<void> {
  await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

export async function addAlert(alert: PriceAlert): Promise<PriceAlert[]> {
  const alerts = await loadAlerts();
  alerts.unshift(alert);
  await saveAlerts(alerts);
  return alerts;
}

export async function removeAlert(id: string): Promise<PriceAlert[]> {
  let alerts = await loadAlerts();
  alerts = alerts.filter(a => a.id !== id);
  await saveAlerts(alerts);
  return alerts;
}

export async function toggleAlert(id: string): Promise<PriceAlert[]> {
  const alerts = await loadAlerts();
  const alert = alerts.find(a => a.id === id);
  if (alert) {
    alert.enabled = !alert.enabled;
    if (alert.enabled) alert.triggered = false; // re-arm
  }
  await saveAlerts(alerts);
  return alerts;
}

// ─── Evaluate All Alerts Against Live Data ──────────────────────────
export async function evaluateAlerts(assets: Asset[]): Promise<PriceAlert[]> {
  const alerts = await loadAlerts();
  let changed = false;

  for (const alert of alerts) {
    if (!alert.enabled || alert.triggered) continue;

    const asset = assets.find(a => a.id === alert.assetId);
    if (!asset) continue;

    alert.currentValue = asset.current_price;

    const triggered = evaluateCondition(
      alert.condition,
      alert.targetValue,
      asset.current_price,
      asset.sparkline
    );

    if (triggered) {
      alert.triggered = true;
      alert.triggeredAt = new Date().toISOString();
      changed = true;

      // Fire notification
      await sendAlertNotification(
        alert.assetSymbol,
        alert.assetName,
        alert.condition as AlertCondition,
        asset.current_price,
        alert.targetValue
      );
    }
  }

  if (changed) {
    await saveAlerts(alerts);
  }

  return alerts;
}

// ─── Create Alert Helper ────────────────────────────────────────────
export function createAlert(
  asset: Asset,
  condition: AlertCondition,
  targetValue: number,
  label?: string
): PriceAlert {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    assetId: asset.id,
    assetSymbol: asset.symbol,
    assetName: asset.name,
    condition,
    targetValue,
    currentValue: asset.current_price,
    label: label || `${asset.symbol} ${condition}`,
    enabled: true,
    triggered: false,
    createdAt: new Date().toISOString(),
  };
}
