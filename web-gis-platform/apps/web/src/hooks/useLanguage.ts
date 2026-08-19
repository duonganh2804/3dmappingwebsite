import {
  useCallback,
  useEffect,
  useState,
} from 'react';

export type Language =
  | 'vi'
  | 'en'
  | 'zh';

const LANGUAGE_STORAGE_KEY =
  'saolatek_language';

const LANGUAGE_CHANGE_EVENT =
  'saolatek-language-change';

const isLanguage = (
  value: unknown
): value is Language =>
  value === 'vi' ||
  value === 'en' ||
  value === 'zh';

const readLanguage = (
  fallback: Language
): Language => {
  if (
    typeof window ===
    'undefined'
  ) {
    return fallback;
  }

  const saved =
    window.localStorage.getItem(
      LANGUAGE_STORAGE_KEY
    );

  return isLanguage(saved)
    ? saved
    : fallback;
};

export const useLanguage = (
  fallback: Language = 'vi'
) => {
  const [
    currentLang,
    setCurrentLangState,
  ] = useState<Language>(() =>
    readLanguage(fallback)
  );

  useEffect(() => {
    if (
      typeof document !==
      'undefined'
    ) {
      document.documentElement.lang =
        currentLang;
    }
  }, [currentLang]);

  useEffect(() => {
    const handleStorage = (
      event: StorageEvent
    ) => {
      if (
        event.key !==
        LANGUAGE_STORAGE_KEY
      ) {
        return;
      }

      if (
        isLanguage(
          event.newValue
        )
      ) {
        setCurrentLangState(
          event.newValue
        );
      }
    };

    const handleLanguageChange = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<Language>;

      if (
        isLanguage(
          customEvent.detail
        )
      ) {
        setCurrentLangState(
          customEvent.detail
        );
      }
    };

    window.addEventListener(
      'storage',
      handleStorage
    );

    window.addEventListener(
      LANGUAGE_CHANGE_EVENT,
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        'storage',
        handleStorage
      );

      window.removeEventListener(
        LANGUAGE_CHANGE_EVENT,
        handleLanguageChange
      );
    };
  }, []);

  const setCurrentLang =
    useCallback(
      (
        language: Language
      ) => {
        setCurrentLangState(
          language
        );

        if (
          typeof window ===
          'undefined'
        ) {
          return;
        }

        window.localStorage.setItem(
          LANGUAGE_STORAGE_KEY,
          language
        );

        window.dispatchEvent(
          new CustomEvent<Language>(
            LANGUAGE_CHANGE_EVENT,
            {
              detail: language,
            }
          )
        );
      },
      []
    );

  return {
    currentLang,
    setCurrentLang,
  };
};

export default useLanguage;