import { useNavigate, useParams } from 'react-router-dom';
import { weeklyGrid } from '../data/grid';
import { getSlotDisplayText } from '../data/timeSlots';
import { getTimeSlots } from '../services/horaCalculator';
import { t, WEEKDAY_KEYS } from '../data/i18n';
import { periodColors } from '../styles/colors';
import { getCurrentTimeSlotIndex, getCurrentWeekdayIndex } from '../services/horaCalculator';
import type { Language } from '../types';
import styles from './WeekdayDetailView.module.css';

interface Props {
  language: Language;
}

export function WeekdayDetailView({ language }: Props) {
  const { weekday } = useParams<{ weekday: string }>();
  const navigate = useNavigate();
  const dayIdx = parseInt(weekday ?? '0', 10);
  const slots = getTimeSlots();
  const currentSlotIdx = getCurrentTimeSlotIndex();
  const currentDayIdx = getCurrentWeekdayIndex();
  const isToday = dayIdx === currentDayIdx;

  const dayName = t(language, WEEKDAY_KEYS[dayIdx]);

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}>
        ← {t(language, 'close')}
      </button>

      <h2 className={styles.title}>{dayName}</h2>
      {isToday && <span className={styles.todayBadge}>{t(language, 'today')}</span>}

      <div className={styles.list}>
        {slots.map((slot: import('../types').TimeSlot, slotIdx: number) => {
          const letter = weeklyGrid[slotIdx][dayIdx];
          const isCurrent = isToday && slotIdx === currentSlotIdx;
          const bg = isCurrent ? 'var(--accent-orange)' : periodColors[letter];

          return (
            <button
              key={slotIdx}
              className={`${styles.row} ${isCurrent ? styles.currentRow : ''}`}
              onClick={() => navigate(`/period/${letter}`)}
            >
              <span className={styles.timeRange}>{getSlotDisplayText(slot)}</span>
              <span className={styles.letterBadge} style={{ background: bg }}>
                {letter}
              </span>
              {isCurrent && <span className={styles.currentLabel}>{t(language, 'current_hour')}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
