import { useState, useEffect } from 'react';
import { getCurrentPeriod } from '../services/horaCalculator';
import type { CurrentPeriod } from '../types';

export function useCurrentPeriod(): CurrentPeriod {
  const [period, setPeriod] = useState<CurrentPeriod>(getCurrentPeriod);

  useEffect(() => {
    const id = setInterval(() => {
      setPeriod(getCurrentPeriod());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return period;
}
