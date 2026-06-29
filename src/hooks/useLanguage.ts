import { useState, useEffect } from 'react';
import type { Language } from '../types';

const STORAGE_KEY = 'horas_language';

function detectDefault(): Language {
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (stored === 'en' || stored === 'es') return stored;
  return navigator.language.startsWith('es') ? 'es' : 'en';
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(detectDefault);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  return { language, setLanguage: setLanguageState };
}
