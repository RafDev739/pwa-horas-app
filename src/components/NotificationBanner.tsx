import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './NotificationBanner.module.css';

export function NotificationBanner() {
  const location = useLocation();
  const navigate = useNavigate();
  const [banner, setBanner] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const title = params.get('_nt');
    const body = params.get('_nb');
    if (!title) return;

    setBanner({ title, body: body ?? '' });

    // Strip the params from the URL without triggering a navigation
    params.delete('_nt');
    params.delete('_nb');
    const clean = location.pathname + (params.size > 0 ? '?' + params.toString() : '');
    navigate(clean, { replace: true });

    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => setBanner(null), 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!banner) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.text}>
        <p className={styles.title}>{banner.title}</p>
        {banner.body && <p className={styles.body}>{banner.body}</p>}
      </div>
      <button className={styles.close} onClick={() => setBanner(null)} aria-label="Dismiss">✕</button>
    </div>
  );
}
