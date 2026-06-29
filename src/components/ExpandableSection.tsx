import { useState } from 'react';
import styles from './ExpandableSection.module.css';

interface Props {
  title: string;
  accentColor: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function ExpandableSection({ title, accentColor, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={styles.section} style={{ borderColor: accentColor }}>
      <button className={styles.header} onClick={() => setOpen((v) => !v)}>
        <span className={styles.title} style={{ color: accentColor }}>{title}</span>
        <span className={styles.chevron} style={{ color: accentColor, transform: open ? 'rotate(180deg)' : 'none' }}>
          ▼
        </span>
      </button>
      {open && <div className={styles.content}>{children}</div>}
    </div>
  );
}
