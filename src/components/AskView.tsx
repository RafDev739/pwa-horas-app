import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../data/i18n';
import {
  ALL_CATEGORIES,
  CATEGORIES_BY_GROUP,
  CATEGORY_DISPLAY_GROUP,
  searchActivity,
  searchByFreeText,
  type AskDisplayGroup,
  type ActivitySearchResult,
} from '../data/activitySearch';
import { periodColors } from '../styles/colors';
import type { Language, TaskCategory, HoraLetter } from '../types';
import styles from './AskView.module.css';

type TKey = Parameters<typeof t>[1];

const ASK_GROUPS: (AskDisplayGroup | 'all')[] = ['all', 'business', 'medical', 'legal', 'travel', 'other'];

const GROUP_LABEL_KEYS: Record<AskDisplayGroup | 'all', TKey> = {
  all: 'ask_all_group',
  business: 'business_group',
  medical: 'medical_group',
  legal: 'legal_group',
  travel: 'travel_group',
  other: 'other_group',
};

interface HourBadgesProps {
  letters: HoraLetter[];
  variant: 'good' | 'bad' | 'mixed' | 'neutral';
}

function HourBadges({ letters, variant }: HourBadgesProps) {
  const navigate = useNavigate();
  return (
    <div className={styles.badges}>
      {letters.map(letter => (
        <button
          key={letter}
          className={`${styles.hourBadge} ${styles[`badge_${variant}`]}`}
          style={variant === 'good' || variant === 'mixed' ? { background: periodColors[letter] } : undefined}
          onClick={() => navigate(`/period/${letter}`)}
          aria-label={`Period ${letter}`}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}

interface ResultsPanelProps {
  title: string;
  description?: string;
  result: ActivitySearchResult;
  language: Language;
}

function ResultsPanel({ title, description, result, language }: ResultsPanelProps) {
  return (
    <div className={styles.resultsPanel}>
      <h3 className={styles.resultTitle}>{title}</h3>
      {description && <p className={styles.resultDesc}>{description}</p>}

      {result.good.length > 0 && (
        <div className={styles.resultRow}>
          <span className={`${styles.resultLabel} ${styles.labelGood}`}>
            ✅ {t(language, 'ask_good_hours')}
          </span>
          <HourBadges letters={result.good} variant="good" />
        </div>
      )}

      {result.bad.length > 0 && (
        <div className={styles.resultRow}>
          <span className={`${styles.resultLabel} ${styles.labelBad}`}>
            ❌ {t(language, 'ask_bad_hours')}
          </span>
          <HourBadges letters={result.bad} variant="bad" />
        </div>
      )}

      {result.mixed.length > 0 && (
        <div className={styles.resultRow}>
          <span className={`${styles.resultLabel} ${styles.labelMixed}`}>
            ⚠️ {t(language, 'ask_mixed_hours')}
          </span>
          <HourBadges letters={result.mixed} variant="mixed" />
        </div>
      )}

      {result.neutral.length > 0 && (
        <div className={styles.resultRow}>
          <span className={`${styles.resultLabel} ${styles.labelNeutral}`}>
            ➖ {t(language, 'ask_neutral_hours')}
          </span>
          <HourBadges letters={result.neutral} variant="neutral" />
        </div>
      )}
    </div>
  );
}

interface Props {
  language: Language;
  onOpenSettings: () => void;
}

export function AskView({ language, onOpenSettings }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);
  const [askQuery, setAskQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<AskDisplayGroup | 'all'>('all');

  const result = useMemo(
    () => selectedCategory ? searchActivity(selectedCategory) : null,
    [selectedCategory]
  );

  const isFreetextMode = askQuery.trim().length > 0;

  const freeTextResult = useMemo(
    () => isFreetextMode ? searchByFreeText(askQuery, language) : null,
    [askQuery, isFreetextMode, language]
  );

  const hasFreeTextHits = freeTextResult !== null &&
    (freeTextResult.good.length + freeTextResult.bad.length + freeTextResult.mixed.length) > 0;

  const categoriesToShow = useMemo(
    () => activeGroup === 'all' ? ALL_CATEGORIES : CATEGORIES_BY_GROUP[activeGroup],
    [activeGroup]
  );

  function handleTileClick(cat: TaskCategory) {
    setSelectedCategory(prev => prev === cat ? null : cat);
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <span className={styles.screenTitle}>{t(language, 'ask_screen_title')}</span>
        <button className={styles.iconBtn} onClick={onOpenSettings} aria-label="Settings">
          ⚙️
        </button>
      </header>

      <div className={styles.controls}>
        <input
          type="text"
          className={styles.filterInput}
          placeholder={t(language, 'ask_search_placeholder')}
          value={askQuery}
          onChange={e => {
            setAskQuery(e.target.value);
            setSelectedCategory(null);
          }}
        />
        {!isFreetextMode && (
          <div className={styles.groupTabs}>
            {ASK_GROUPS.map(group => (
              <button
                key={group}
                className={`${styles.groupTab} ${activeGroup === group ? styles.groupTabActive : ''}`}
                onClick={() => setActiveGroup(group)}
              >
                {t(language, GROUP_LABEL_KEYS[group])}
              </button>
            ))}
          </div>
        )}
      </div>

      <main className={styles.main}>
        {isFreetextMode ? (
          hasFreeTextHits ? (
            <ResultsPanel
              title={t(language, 'ask_free_text_results_title')}
              result={freeTextResult!}
              language={language}
            />
          ) : (
            <p className={styles.hint}>{t(language, 'ask_no_content_hint')}</p>
          )
        ) : (
          <>
            {selectedCategory && result ? (
              <ResultsPanel
                title={t(language, `${selectedCategory}_task` as TKey)}
                description={t(language, `${selectedCategory}_desc` as TKey)}
                result={result}
                language={language}
              />
            ) : (
              <p className={styles.hint}>{t(language, 'ask_tap_hint')}</p>
            )}

            <div className={styles.categoryGrid}>
              {categoriesToShow.map(cat => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    className={`${styles.tile} ${isSelected ? styles.tileSelected : ''}`}
                    data-group={CATEGORY_DISPLAY_GROUP[cat]}
                    onClick={() => handleTileClick(cat)}
                  >
                    <span className={styles.tileName}>
                      {t(language, `${cat}_task` as TKey)}
                    </span>
                  </button>
                );
              })}
              {categoriesToShow.length === 0 && (
                <p className={styles.noResults}>—</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
