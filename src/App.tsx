import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { HoraGrid } from './components/HoraGrid';
import { HoraDetailView } from './components/HoraDetailView';
import { WeekdayDetailView } from './components/WeekdayDetailView';
import { SettingsView } from './components/SettingsView';
import { AskView } from './components/AskView';
import { NotificationBanner } from './components/NotificationBanner';
import { useCurrentPeriod } from './hooks/useCurrentPeriod';
import { useLanguage } from './hooks/useLanguage';
import { useSettings } from './hooks/useSettings';
import { t } from './data/i18n';
import {
  requestPermission,
  getPermission,
  scheduleNotifications,
  subscribeToPush,
  startNotificationPolling,
  stopNotificationPolling,
} from './services/notificationService';
import type { Language, HoraLetter, TaskCategory, TaskPreference } from './types';
import styles from './App.module.css';

function GridPage({ language, onOpenSettings }: { language: Language; onOpenSettings: () => void }) {
  const currentPeriod = useCurrentPeriod();

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.appName}>Horas</span>
          <span className={styles.currentPeriodBadge}>
            {t(language, 'current_hour')}: <strong>{currentPeriod.letter}</strong>
          </span>
        </div>
        <div className={styles.topBarRight}>
          <button className={styles.iconBtn} onClick={onOpenSettings} aria-label="Settings">
            ⚙️
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <HoraGrid currentPeriod={currentPeriod} language={language} />
        <p className={styles.hint}>{t(language, 'tap_days_hint')}</p>
      </main>
    </div>
  );
}

function BottomNav({ language }: { language: Language }) {
  const location = useLocation();
  const navigate = useNavigate();
  const onMain = location.pathname === '/' || location.pathname === '/ask';
  if (!onMain) return null;

  return (
    <nav className={styles.bottomNav}>
      <button
        className={`${styles.navBtn} ${location.pathname === '/' ? styles.navBtnActive : ''}`}
        onClick={() => navigate('/')}
      >
        <span className={styles.navIcon}>📅</span>
        <span className={styles.navLabel}>{t(language, 'grid_nav_label')}</span>
      </button>
      <button
        className={`${styles.navBtn} ${location.pathname === '/ask' ? styles.navBtnActive : ''}`}
        onClick={() => navigate('/ask')}
      >
        <span className={styles.navIcon}>🔍</span>
        <span className={styles.navLabel}>{t(language, 'ask_nav_label')}</span>
      </button>
    </nav>
  );
}

export default function App() {
  const { language, setLanguage } = useLanguage();
  const { settings, setSettings, toggleFavoritePeriod, setTaskPreference, resetSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(getPermission);

  useEffect(() => {
    startNotificationPolling();
    return () => stopNotificationPolling();
  }, []);

  useEffect(() => {
    scheduleNotifications(settings, language).catch(() => {});
    subscribeToPush(settings, language).catch(() => {});
  }, [settings, language]);

  const handleRequestNotifPermission = async () => {
    const result = await requestPermission();
    setNotifPermission(result);
    if (result === 'granted') {
      subscribeToPush(settings, language).catch(() => {});
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setSettings({ ...settings, language: lang });
  };

  return (
    <>
      <NotificationBanner />
      {/* Language toggle */}
      <div className={styles.langToggle}>
        {(['en', 'es'] as Language[]).map((lang) => (
          <button
            key={lang}
            className={`${styles.langBtn} ${language === lang ? styles.langBtnActive : ''}`}
            onClick={() => handleLanguageChange(lang)}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      <Routes>
        <Route
          path="/"
          element={<GridPage language={language} onOpenSettings={() => setShowSettings(true)} />}
        />
        <Route
          path="/period/:letter"
          element={
            <HoraDetailView
              language={language}
              settings={settings}
              onToggleFavorite={(letter: HoraLetter) => toggleFavoritePeriod(letter)}
            />
          }
        />
        <Route path="/day/:weekday" element={<WeekdayDetailView language={language} />} />
        <Route
          path="/ask"
          element={
            <AskView
              language={language}
              onOpenSettings={() => setShowSettings(true)}
              settings={settings}
              notifPermission={notifPermission}
              onSetTaskPreference={(cat, pref) => setTaskPreference(cat, pref)}
              onRequestNotifPermission={handleRequestNotifPermission}
            />
          }
        />
      </Routes>

      <BottomNav language={language} />

      {showSettings && (
        <SettingsView
          language={language}
          settings={settings}
          onClose={() => setShowSettings(false)}
          onLanguageChange={handleLanguageChange}
          onToggleFavorite={(letter: HoraLetter) => toggleFavoritePeriod(letter)}
          onSetSettings={setSettings}
          onTaskPreferenceChange={(cat: TaskCategory, pref: TaskPreference) => setTaskPreference(cat, pref)}
          onReset={() => { resetSettings(); setShowSettings(false); }}
          notifPermission={notifPermission}
          onRequestNotifPermission={handleRequestNotifPermission}
        />
      )}
    </>
  );
}
