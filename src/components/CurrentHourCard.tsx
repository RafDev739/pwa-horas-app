import { horaDetailsEnglish, horaDetailsSpanish } from '../data/horaContent';
import { getTimeSlots } from '../services/horaCalculator';
import { formatTime12Hour } from '../data/timeSlots';
import { periodColors } from '../styles/colors';
import { t } from '../data/i18n';
import type { CurrentPeriod, Language } from '../types';
import styles from './CurrentHourCard.module.css';

interface Props {
  currentPeriod: CurrentPeriod;
  language: Language;
}

export function CurrentHourCard({ currentPeriod, language }: Props) {
  const { letter, slotIndex } = currentPeriod;
  const details = language === 'es' ? horaDetailsSpanish[letter] : horaDetailsEnglish[letter];
  const slot = getTimeSlots()[slotIndex];
  const timeRange = `${formatTime12Hour(slot.startHour, slot.startMinute)} – ${formatTime12Hour(slot.endHour, slot.endMinute)}`;
  const color = periodColors[letter];

  const goodItems = details.goodFor.split('\n').filter(Boolean).slice(0, 5);
  const avoidItems = details.avoid.split('\n').filter(Boolean).slice(0, 5);

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <div className={styles.letterCircle} style={{ background: color }}>
          {letter}
        </div>
        <div className={styles.headerText}>
          <span className={styles.timeRange}>{timeRange}</span>
          <p className={styles.summary}>{details.summary}</p>
        </div>
      </div>

      <div className={styles.listsRow}>
        <div className={styles.listCol}>
          <span className={styles.listLabel} style={{ color: 'var(--favorable-green)' }}>
            {t(language, 'good_for')}
          </span>
          <ul className={styles.list}>
            {goodItems.map((item, i) => (
              <li key={i} className={styles.listItem}>{item.replace(/^•\s*/, '')}</li>
            ))}
          </ul>
        </div>
        <div className={styles.listCol}>
          <span className={styles.listLabel} style={{ color: 'var(--unfavorable-red)' }}>
            {t(language, 'avoid')}
          </span>
          <ul className={styles.list}>
            {avoidItems.map((item, i) => (
              <li key={i} className={styles.listItem}>{item.replace(/^•\s*/, '')}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
