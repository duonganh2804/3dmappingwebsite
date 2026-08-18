import { useEffect, useState } from 'react';

export type Language = 'en' | 'vi' | 'zh';

const STORAGE_KEY = 'lp_lang';

const readLanguage = (fallback: Language): Language => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'en' || saved === 'vi' || saved === 'zh' ? saved : fallback;
};

export const useLanguage = (fallback: Language = 'en') => {
  const [currentLang, setCurrentLang] = useState<Language>(() => readLanguage(fallback));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentLang);
  }, [currentLang]);

  return { currentLang, setCurrentLang };
};
