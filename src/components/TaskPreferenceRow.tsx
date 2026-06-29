import { useState } from 'react';
import { t } from '../data/i18n';
import type { Language, TaskCategory, TaskPreference } from '../types';
import styles from './TaskPreferenceRow.module.css';

interface Props {
  category: TaskCategory;
  language: Language;
  pref: TaskPreference;
  onChange: (pref: TaskPreference) => void;
}

export function TaskPreferenceRow({ category, language, pref, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const nameKey = `${category}_task` as Parameters<typeof t>[1];
  const descKey = `${category}_desc` as Parameters<typeof t>[1];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.nameBtn} onClick={() => setExpanded((v) => !v)}>
          <span className={styles.name}>{t(language, nameKey)}</span>
          <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
        </button>
        <div className={styles.toggles}>
          <label className={styles.toggleLabel}>
            <span className={styles.toggleText}>{t(language, 'favorable_periods_track')}</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={pref.notifyGood}
                onChange={(e) => onChange({ ...pref, notifyGood: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </label>
          <label className={styles.toggleLabel}>
            <span className={styles.toggleText}>{t(language, 'unfavorable_periods_track')}</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={pref.notifyBad}
                onChange={(e) => onChange({ ...pref, notifyBad: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </label>
        </div>
      </div>

      {(pref.notifyGood || pref.notifyBad) && (
        <div className={styles.timeRow}>
          <span className={styles.timeLabel}>{t(language, 'reminder_time')}:</span>
          <select
            className={styles.timeSelect}
            value={pref.minutesBefore}
            onChange={(e) => onChange({ ...pref, minutesBefore: Number(e.target.value) })}
          >
            {[5, 10, 15, 30].map((m) => (
              <option key={m} value={m}>{m} {t(language, 'minutes_before')}</option>
            ))}
          </select>
        </div>
      )}

      {expanded && (
        <p className={styles.description}>{t(language, descKey)}</p>
      )}
    </div>
  );
}
