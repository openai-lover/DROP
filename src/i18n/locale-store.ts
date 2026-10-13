import { DEFAULT_LOCALE, normalizeLocale, type Locale } from './catalog';

export const LANGUAGE_STORAGE_KEY = 'drop-language';
export type LocaleStorage = Pick<Storage, 'getItem' | 'setItem'>;

// A failed storage read/write must not prevent play or changing the current language.
export function createLocaleStore(getStorage: () => LocaleStorage | undefined) {
  let locale: Locale = DEFAULT_LOCALE;
  let initialized = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(listener => listener());
  const restore = () => {
    let restored: Locale = DEFAULT_LOCALE;
    try {
      const storage = getStorage();
      if (storage) restored = normalizeLocale(storage.getItem(LANGUAGE_STORAGE_KEY));
      else restored = locale;
    } catch {
      restored = locale;
    }
    initialized = true;
    if (restored !== locale) { locale = restored; emit(); }
  };
  const setLocale = (value: Locale) => {
    locale = normalizeLocale(value);
    initialized = true;
    try { getStorage()?.setItem(LANGUAGE_STORAGE_KEY, locale); } catch { /* Keep the in-memory selection. */ }
    emit();
  };
  return {
    getSnapshot: () => { if (!initialized) restore(); return locale; },
    getServerSnapshot: () => DEFAULT_LOCALE,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setLocale,
    restore,
    toggle: () => setLocale(locale === 'en' ? 'ko' : 'en'),
  };
}
