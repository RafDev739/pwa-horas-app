import styles from './HoraCellView.module.css';
import type { HoraLetter } from '../types';

const CELL_COLOR = '#0C499C';

interface Props {
  letter: HoraLetter;
  isCurrent: boolean;
  onClick: () => void;
}

export function HoraCellView({ letter, isCurrent, onClick }: Props) {
  const bg = isCurrent ? 'var(--accent-orange)' : CELL_COLOR;

  return (
    <button
      className={`${styles.cell} ${isCurrent ? styles.current : ''}`}
      style={{ background: bg }}
      onClick={onClick}
      aria-label={`Period ${letter}${isCurrent ? ' (current)' : ''}`}
    >
      <span className={styles.letter}>{letter}</span>
    </button>
  );
}
