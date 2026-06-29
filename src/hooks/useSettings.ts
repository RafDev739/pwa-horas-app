import { useState, useCallback } from 'react';
import type { Settings, TaskCategory, TaskPreference, HoraLetter } from '../types';

const STORAGE_KEY = 'horas_settings';

const defaultSettings: Settings = {
  language: 'en',
  favoritePeriods: [],
  favoriteReminderMinutes: 10,
  dailyForecastEnabled: false,
  dailyForecastTime: '07:00',
  taskPreferences: {},
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return defaultSettings;
}

function persist(settings: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(load);

  const setSettings = useCallback((next: Settings) => {
    persist(next);
    setSettingsState(next);
  }, []);

  const toggleFavoritePeriod = useCallback((letter: HoraLetter) => {
    setSettingsState((prev) => {
      const has = prev.favoritePeriods.includes(letter);
      const next: Settings = {
        ...prev,
        favoritePeriods: has
          ? prev.favoritePeriods.filter((l) => l !== letter)
          : [...prev.favoritePeriods, letter],
      };
      persist(next);
      return next;
    });
  }, []);

  const setTaskPreference = useCallback((category: TaskCategory, pref: TaskPreference) => {
    setSettingsState((prev) => {
      const next: Settings = {
        ...prev,
        taskPreferences: { ...prev.taskPreferences, [category]: pref },
      };
      persist(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const next = { ...defaultSettings };
    persist(next);
    setSettingsState(next);
  }, []);

  return { settings, setSettings, toggleFavoritePeriod, setTaskPreference, resetSettings };
}
