import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExpandableSection } from './ExpandableSection';
import { detailedContentEnglish, detailedContentSpanish } from '../data/horaContent';
import { t } from '../data/i18n';
import { periodColors } from '../styles/colors';
import { HORA_LETTERS } from '../types';
import type { Language, HoraLetter, Settings } from '../types';
import styles from './HoraDetailView.module.css';

interface Props {
  language: Language;
  settings: Settings;
  onToggleFavorite: (letter: HoraLetter) => void;
}

export function HoraDetailView({ language, settings, onToggleFavorite }: Props) {
  const { letter: paramLetter } = useParams<{ letter: string }>();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<HoraLetter>((paramLetter as HoraLetter) || 'A');

  const content = language === 'es' ? detailedContentSpanish[selected] : detailedContentEnglish[selected];
  const accentColor = periodColors[selected];
  const isFavorite = settings.favoritePeriods.includes(selected);

  return (
    <div className={styles.container}>
      {/* Back */}
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        ← {t(language, 'close')}
      </button>

      {/* Period selector */}
      <div className={styles.selectorRow}>
        <span className={styles.selectorLabel}>{t(language, 'select_period')}</span>
        <div className={styles.selector}>
          {HORA_LETTERS.map((l) => (
            <button
              key={l}
              className={`${styles.selectorBtn} ${l === selected ? styles.selectorBtnActive : ''}`}
              style={l === selected ? { background: accentColor } : {}}
              onClick={() => { setSelected(l); navigate(`/period/${l}`, { replace: true }); }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Period header circle */}
      <div className={styles.headerCircle} style={{ background: accentColor }}>
        <span className={styles.headerLetter}>{selected}</span>
        <button
          className={styles.starBtn}
          onClick={() => onToggleFavorite(selected)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '⭐' : '☆'}
        </button>
      </div>

      {/* Summary */}
      <p className={styles.summary}>{content.generalDescription}</p>

      {/* Expandable sections */}
      <ExpandableSection
        title={t(language, 'period_characteristics')}
        accentColor="var(--characteristics-purple)"
        defaultOpen
      >
        <p className={styles.sectionText}>{content.characteristics}</p>
      </ExpandableSection>

      <ExpandableSection
        title={t(language, 'favorable_activities')}
        accentColor="var(--favorable-green)"
        defaultOpen
      >
        <div className={styles.activityList}>
          {content.favorableActivities.map((line, i) => (
            <p key={i} className={line.startsWith('•') ? styles.bullet : line === '' ? styles.spacer : styles.categoryHeader}>
              {line}
            </p>
          ))}
        </div>
      </ExpandableSection>

      <ExpandableSection
        title={t(language, 'unfavorable_activities')}
        accentColor="var(--unfavorable-red)"
      >
        <div className={styles.activityList}>
          {content.unfavorableActivities.map((line, i) => (
            <p key={i} className={line.startsWith('•') ? styles.bullet : line === '' ? styles.spacer : styles.categoryHeader}>
              {line}
            </p>
          ))}
        </div>
      </ExpandableSection>
    </div>
  );
}
