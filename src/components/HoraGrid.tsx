import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HoraCellView } from './HoraCellView';
import { weeklyGrid } from '../data/grid';
import { getSlotDisplayText } from '../data/timeSlots';
import { getTimeSlots } from '../services/horaCalculator';
import { t, WEEKDAY_KEYS } from '../data/i18n';
import type { Language, CurrentPeriod } from '../types';
import styles from './HoraGrid.module.css';

interface Props {
  currentPeriod: CurrentPeriod;
  language: Language;
}

export function HoraGrid({ currentPeriod, language }: Props) {
  const navigate = useNavigate();
  const slots = getTimeSlots();

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {/* Top-left empty corner */}
        <div className={styles.cornerCell}>
          <span className={styles.cornerLabel}>{t(language, 'time_header')}</span>
        </div>

        {/* Day headers */}
        {WEEKDAY_KEYS.map((key, dayIdx) => (
          <button
            key={key}
            className={`${styles.dayHeader} ${dayIdx === currentPeriod.weekdayIndex ? styles.currentDay : ''}`}
            onClick={() => navigate(`/day/${dayIdx}`)}
          >
            {t(language, key)}
          </button>
        ))}

        {/* Rows: time slot × weekday */}
        {slots.map((slot: import('../types').TimeSlot, slotIdx: number) => (
          <React.Fragment key={slotIdx}>
            <div className={`${styles.timeLabel} ${slotIdx === currentPeriod.slotIndex ? styles.currentSlot : ''}`}>
              <span className={styles.timeLabelText}>{getSlotDisplayText(slot)}</span>
            </div>

            {WEEKDAY_KEYS.map((_, dayIdx) => {
              const letter = weeklyGrid[slotIdx][dayIdx];
              const isCurrent = slotIdx === currentPeriod.slotIndex && dayIdx === currentPeriod.weekdayIndex;
              return (
                <div key={`${slotIdx}-${dayIdx}`} className={styles.cellWrapper}>
                  <HoraCellView
                    letter={letter}
                    isCurrent={isCurrent}
                    onClick={() => navigate(`/period/${letter}`)}
                  />
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
