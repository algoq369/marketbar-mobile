import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { CONDITION_LABELS, type AlertCondition } from '../utils/constants';

// ─── Configure notifications ────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Request Permission ─────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notification permission denied');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Price Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#34d399',
    });
  }

  return true;
}

// ─── Send Local Alert Notification ──────────────────────────────────
export async function sendAlertNotification(
  assetSymbol: string,
  assetName: string,
  condition: AlertCondition,
  currentPrice: number,
  targetValue: number
): Promise<void> {
  const condInfo = CONDITION_LABELS[condition];

  const title = `${condInfo.icon} ${assetSymbol} Alert`;

  let body = '';
  if (condition === 'price_above' || condition === 'price_below') {
    body = `${assetName} hit $${currentPrice.toLocaleString()} (target: $${targetValue.toLocaleString()})`;
  } else {
    body = `${assetName} — ${condInfo.label} triggered at $${currentPrice.toLocaleString()}`;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { assetSymbol, condition },
    },
    trigger: null, // immediate
  });
}
