import { useState } from 'react';
import { TaskPreferenceRow } from './TaskPreferenceRow';
import { t } from '../data/i18n';
import { HORA_LETTERS } from '../types';
import { periodColors } from '../styles/colors';
import type { Language, Settings, HoraLetter, TaskCategory, TaskPreference, TaskGroup } from '../types';
import styles from './SettingsView.module.css';

const DEFAULT_TASK_PREF: TaskPreference = { notifyGood: false, notifyBad: false, minutesBefore: 10 };

type GroupedCategories = {
  standalone: TaskCategory[];
  groups: { key: TaskGroup; categories: TaskCategory[] }[];
};

const CATEGORY_STRUCTURE: GroupedCategories = {
  standalone: [
    'loan_applications', 'request_favors', 'new_business_ventures', 'contract_signing',
    'marriage_engagements', 'moving_relocation', 'debt_collection', 'loan_money',
    'gambling_lotto_stocks', 'travel_planning', 'medical_procedures',
    'legal_proceedings', 'physical_exercise', 'study_research', 'health_treatments',
    'deal_with_lawyers', 'deal_with_government', 'mechanical_technical',
  ],
  groups: [
    {
      key: 'business',
      categories: ['business_general', 'business_credit', 'business_operations', 'business_startup', 'business_advancement'],
    },
    {
      key: 'medical',
      categories: ['medical_therapy', 'medical_surgery'],
    },
    {
      key: 'legal',
      categories: ['legal_preparation', 'legal_filing', 'legal_disputes'],
    },
    {
      key: 'travel',
      categories: ['travel_short', 'travel_long'],
    },
  ],
};

interface Props {
  language: Language;
  settings: Settings;
  onClose: () => void;
  onLanguageChange: (lang: Language) => void;
  onToggleFavorite: (letter: HoraLetter) => void;
  onSetSettings: (s: Settings) => void;
  onTaskPreferenceChange: (cat: TaskCategory, pref: TaskPreference) => void;
  onReset: () => void;
  notifPermission: NotificationPermission | null;
  onRequestNotifPermission: () => void;
}

export function SettingsView({
  language, settings, onClose, onLanguageChange, onToggleFavorite,
  onSetSettings, onTaskPreferenceChange, onReset,
  notifPermission, onRequestNotifPermission,
}: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>{t(language, 'settings')}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>
          {/* Notification permission */}
          {notifPermission !== 'granted' && (
            <div className={styles.notifBanner}>
              <p className={styles.notifBannerText}>{t(language, 'notification_permission_message')}</p>
              <button className={styles.notifBtn} onClick={onRequestNotifPermission}>
                {t(language, 'authorize_notifications')}
              </button>
              {notifPermission === 'denied' && (
                <p className={styles.notifDenied}>{t(language, 'notifications_denied')}</p>
              )}
            </div>
          )}
          {notifPermission === 'granted' && (
            <div className={styles.notifGranted}>✓ {t(language, 'notifications_granted')}</div>
          )}

          {/* Language */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t(language, 'language_settings')}</h3>
            <div className={styles.langRow}>
              {(['en', 'es'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  className={`${styles.langBtn} ${language === lang ? styles.langBtnActive : ''}`}
                  onClick={() => onLanguageChange(lang)}
                >
                  {lang === 'en' ? '🇺🇸 English' : '🇪🇸 Español'}
                </button>
              ))}
            </div>
          </section>

          {/* Favorite periods */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t(language, 'favorite_periods')}</h3>
            <p className={styles.sectionDesc}>{t(language, 'favorite_periods_desc')}</p>

            <div className={styles.reminderRow}>
              <span className={styles.reminderLabel}>{t(language, 'reminder_time')}:</span>
              <select
                className={styles.select}
                value={settings.favoriteReminderMinutes}
                onChange={(e) => onSetSettings({ ...settings, favoriteReminderMinutes: Number(e.target.value) })}
              >
                {[5, 10, 15, 30].map((m) => (
                  <option key={m} value={m}>{m} {t(language, 'minutes_before')}</option>
                ))}
              </select>
            </div>

            <div className={styles.periodGrid}>
              {HORA_LETTERS.map((letter) => {
                const isFav = settings.favoritePeriods.includes(letter);
                return (
                  <button
                    key={letter}
                    className={`${styles.periodBtn} ${isFav ? styles.periodBtnActive : ''}`}
                    style={isFav ? { background: periodColors[letter], borderColor: periodColors[letter] } : {}}
                    onClick={() => onToggleFavorite(letter)}
                  >
                    <span className={styles.periodBtnLetter}>{letter}</span>
                    <span className={styles.periodBtnStar}>{isFav ? '⭐' : '☆'}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Daily forecast */}
          <section className={styles.section}>
            <div className={styles.rowBetween}>
              <div>
                <h3 className={styles.sectionTitle}>{t(language, 'daily_forecast')}</h3>
                <p className={styles.sectionDesc}>{t(language, 'daily_forecast_desc')}</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.dailyForecastEnabled}
                  onChange={(e) => onSetSettings({ ...settings, dailyForecastEnabled: e.target.checked })}
                />
                <span className="toggle-slider" />
              </label>
            </div>
            {settings.dailyForecastEnabled && (
              <div className={styles.reminderRow} style={{ marginTop: 12 }}>
                <span className={styles.reminderLabel}>{t(language, 'forecast_time')}:</span>
                <input
                  type="time"
                  className={styles.timeInput}
                  value={settings.dailyForecastTime}
                  onChange={(e) => onSetSettings({ ...settings, dailyForecastTime: e.target.value })}
                />
              </div>
            )}
          </section>

          {/* Smart notifications */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t(language, 'smart_notifications')}</h3>
            <p className={styles.sectionDesc}>{t(language, 'smart_notifications_desc')}</p>

            {/* Standalone categories */}
            {CATEGORY_STRUCTURE.standalone.map((cat) => (
              <TaskPreferenceRow
                key={cat}
                category={cat}
                language={language}
                pref={settings.taskPreferences[cat] ?? DEFAULT_TASK_PREF}
                onChange={(pref) => onTaskPreferenceChange(cat, pref)}
              />
            ))}

            {/* Grouped categories */}
            {CATEGORY_STRUCTURE.groups.map(({ key, categories }) => {
              const groupKey = `${key}_group` as Parameters<typeof t>[1];
              const isExpanded = expandedGroups[key];
              return (
                <div key={key} className={styles.group}>
                  <button className={styles.groupHeader} onClick={() => toggleGroup(key)}>
                    <span className={styles.groupTitle}>{t(language, groupKey)}</span>
                    <span className={styles.groupChevron}>{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  {isExpanded && categories.map((cat) => (
                    <TaskPreferenceRow
                      key={cat}
                      category={cat}
                      language={language}
                      pref={settings.taskPreferences[cat] ?? DEFAULT_TASK_PREF}
                      onChange={(pref) => onTaskPreferenceChange(cat, pref)}
                    />
                  ))}
                </div>
              );
            })}
          </section>

          {/* Reset */}
          <section className={styles.section}>
            <button className={styles.resetBtn} onClick={onReset}>
              {t(language, 'reset_all_preferences')}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
