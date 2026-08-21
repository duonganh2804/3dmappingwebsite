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

/**
 * Legacy key currently used by DashboardPage.
 * Keep it synchronized during the migration so
 * Dashboard / Public site / Viewer always agree.
 */
const LEGACY_LANGUAGE_STORAGE_KEY =
  'lp_lang';

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

  const legacySaved =
    window.localStorage.getItem(
      LEGACY_LANGUAGE_STORAGE_KEY
    );

  const saved =
    window.localStorage.getItem(
      LANGUAGE_STORAGE_KEY
    );

  /*
   * Dashboard historically writes lp_lang.
   * Prefer it during migration when available.
   * From now on setCurrentLang writes BOTH keys,
   * so they will stay synchronized.
   */
  if (isLanguage(legacySaved)) {
    return legacySaved;
  }

  return isLanguage(saved)
    ? saved
    : fallback;
};

const persistLanguage = (
  language: Language
) => {
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

  window.localStorage.setItem(
    LEGACY_LANGUAGE_STORAGE_KEY,
    language
  );
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

    /*
     * Heal a possible old-key/new-key mismatch
     * as soon as any component using this hook
     * mounts (Viewer, modal, Landing, etc.).
     */
    persistLanguage(currentLang);
  }, [currentLang]);

  useEffect(() => {
    const handleStorage = (
      event: StorageEvent
    ) => {
      if (
        event.key !==
          LANGUAGE_STORAGE_KEY &&
        event.key !==
          LEGACY_LANGUAGE_STORAGE_KEY
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

        persistLanguage(language);

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