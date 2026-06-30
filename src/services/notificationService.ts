import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { weeklyGrid } from '../data/grid';
import { formatTime12Hour } from '../data/timeSlots';
import { getTimeSlots } from './horaCalculator';
import type { Settings, HoraLetter } from '../types';

const WORKER_URL = 'https://horas-push.raf2177act.workers.dev';

interface NotifDB extends DBSchema {
  scheduled: {
    key: string;
    value: {
      id: string;
      title: string;
      body: string;
      fireAt: number;
    };
  };
}

let db: IDBPDatabase<NotifDB> | null = null;

async function getDB() {
  if (!db) {
    db = await openDB<NotifDB>('horas-notifications', 1, {
      upgrade(d) { d.createObjectStore('scheduled', { keyPath: 'id' }); },
    });
  }
  return db;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export function getPermission(): NotificationPermission | null {
  if (!('Notification' in window)) return null;
  return Notification.permission;
}

type ScheduledNotif = { id: string; title: string; body: string; fireAt: number };

function buildSchedule(settings: Settings, lang: 'en' | 'es'): ScheduledNotif[] {
  const notifs: ScheduledNotif[] = [];
  const slots = getTimeSlots();

  if (settings.favoritePeriods.length > 0) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const dayIdx = targetDate.getDay();

      for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
        const letter = weeklyGrid[slotIdx][dayIdx] as HoraLetter;
        if (!settings.favoritePeriods.includes(letter)) continue;

        const slot = slots[slotIdx];
        const fireAt = new Date(targetDate);
        fireAt.setHours(slot.startHour, slot.startMinute - settings.favoriteReminderMinutes, 0, 0);
        if (fireAt.getTime() < Date.now()) continue;

        const timeStr = formatTime12Hour(slot.startHour, slot.startMinute);
        const id = `fav_${letter}_${dayOffset}_${slotIdx}`;
        const title = lang === 'es' ? '⭐ Período Favorito Comenzando' : '⭐ Favorite Period Starting';
        const body = lang === 'es'
          ? `Período ${letter} comienza a las ${timeStr} - ¡uno de tus períodos favoritos!`
          : `Period ${letter} starts at ${timeStr} - one of your favorite periods!`;

        notifs.push({ id, title, body, fireAt: fireAt.getTime() });
      }
    }
  }

  if (settings.dailyForecastEnabled) {
    const [fhStr, fmStr] = settings.dailyForecastTime.split(':');
    const fh = parseInt(fhStr, 10);
    const fm = parseInt(fmStr, 10);
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const fireAt = new Date();
      fireAt.setDate(fireAt.getDate() + dayOffset);
      fireAt.setHours(fh, fm, 0, 0);
      if (fireAt.getTime() < Date.now()) continue;
      const id = `forecast_${dayOffset}`;
      const title = lang === 'es' ? 'Pronóstico Hora de Hoy' : "Today's Hora Forecast";
      const body = lang === 'es'
        ? 'Revisa tu app Hora para los períodos óptimos de hoy'
        : "Check your Hora app for today's optimal periods";
      notifs.push({ id, title, body, fireAt: fireAt.getTime() });
    }
  }

  return notifs;
}

export async function scheduleNotifications(settings: Settings, lang: 'en' | 'es') {
  if (Notification.permission !== 'granted') return;
  const schedule = buildSchedule(settings, lang);
  const database = await getDB();
  await database.clear('scheduled');
  for (const notif of schedule) {
    await database.put('scheduled', notif);
  }
  try {
    localStorage.setItem('horas_notif_settings', JSON.stringify({ lang, favPeriods: settings.favoritePeriods, reminderMin: settings.favoriteReminderMinutes }));
  } catch { /* ignore */ }
}

export async function scheduleTestNotification(lang: 'en' | 'es') {
  if (Notification.permission !== 'granted') return;
  const database = await getDB();
  const fireAt = Date.now() + 2 * 60 * 1000;
  const title = lang === 'es' ? '✅ Horas — Notificación de Prueba' : '✅ Horas — Test Notification';
  const body  = lang === 'es' ? '¡Las notificaciones están funcionando!' : 'Notifications are working!';
  await database.put('scheduled', { id: 'test_notif', title, body, fireAt });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush(settings: Settings, lang: 'en' | 'es'): Promise<void> {
  if (Notification.permission !== 'granted') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY as string).buffer as ArrayBuffer,
      });
    }

    const schedule = buildSchedule(settings, lang);
    await fetch(`${WORKER_URL}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), notifications: schedule }),
    });
  } catch (err) {
    console.warn('Push subscription failed:', err);
  }
}

export async function clearAllNotifications() {
  const database = await getDB();
  await database.clear('scheduled');
}

let pollingId: ReturnType<typeof setInterval> | null = null;

export function startNotificationPolling() {
  if (pollingId) return;
  pollingId = setInterval(checkAndFireNotifications, 30_000);
}

export function stopNotificationPolling() {
  if (pollingId) { clearInterval(pollingId); pollingId = null; }
}

async function checkAndFireNotifications() {
  if (Notification.permission !== 'granted') return;
  const database = await getDB();
  const all = await database.getAll('scheduled');
  const now = Date.now();
  const due = all.filter((n) => n.fireAt <= now && n.fireAt > now - 120_000);

  for (const notif of due) {
    new Notification(notif.title, { body: notif.body, icon: '/icons/icon-192.png' });
    await database.delete('scheduled', notif.id);
  }
}
