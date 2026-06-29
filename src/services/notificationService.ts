import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { weeklyGrid } from '../data/grid';
import { formatTime12Hour } from '../data/timeSlots';
import { getTimeSlots } from './horaCalculator';
import type { Settings, HoraLetter } from '../types';

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

export async function scheduleNotifications(settings: Settings, lang: 'en' | 'es') {
  if (Notification.permission !== 'granted') return;
  const database = await getDB();
  await database.clear('scheduled');

  const slots = getTimeSlots();

  // Schedule favorite period notifications for each slot × weekday for the next 7 days
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

        await database.put('scheduled', { id, title, body, fireAt: fireAt.getTime() });
      }
    }
  }

  // Daily forecast
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
      await database.put('scheduled', { id, title, body, fireAt: fireAt.getTime() });
    }
  }

  // Store settings for SW periodic sync reference
  try {
    localStorage.setItem('horas_notif_settings', JSON.stringify({ lang, favPeriods: settings.favoritePeriods, reminderMin: settings.favoriteReminderMinutes }));
  } catch { /* ignore */ }
}

export async function clearAllNotifications() {
  const database = await getDB();
  await database.clear('scheduled');
}

// Poll for due notifications (called when app is open)
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
