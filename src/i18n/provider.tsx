'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { DEFAULT_LOCALE, LANGUAGE_OPTIONS, normalizeLocale, translate, type Locale, type TranslationValues } from './catalog';
import { createLocaleStore, LANGUAGE_STORAGE_KEY } from './locale-store';
import { localizeServiceError } from './errors';

type LanguageContext = {
  locale: Locale;
  en: boolean;
  t: (korean: string, english: string, values?: TranslationValues) => string;
  errorText: (message: string) => string;
  setLocale: (locale: Locale) => void;
  toggle: () => void;
};

const Language = createContext<LanguageContext>({
  locale: DEFAULT_LOCALE, en: true, t: (korean, english, values) => translate(DEFAULT_LOCALE, korean, english, values),
  errorText: message => localizeServiceError(DEFAULT_LOCALE, message),
  setLocale: () => {}, toggle: () => {},
});

export const useLanguage = () => useContext(Language);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => createLocaleStore(() => typeof window === 'undefined' ? undefined : window.localStorage), []);
  const locale = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const t = useCallback((korean: string, english: string, values?: TranslationValues) => translate(locale, korean, english, values), [locale]);
  const errorText = useCallback((message: string) => localizeServiceError(locale, message), [locale]);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => { if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) store.restore(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [store]);
  const value = useMemo(() => ({ locale, en: locale === 'en', t, errorText, setLocale: store.setLocale, toggle: store.toggle }), [locale, t, errorText, store]);
  return <Language.Provider value={value}>{children}</Language.Provider>;
}

export function LanguageSelector({ className = 'language-select', ariaLabel }: { className?: string; ariaLabel?: string }) {
  const { locale, setLocale, t } = useLanguage();
  return <select className={className} aria-label={ariaLabel ?? t('언어', 'Language')} value={locale} onChange={event => setLocale(normalizeLocale(event.target.value))}>
    {LANGUAGE_OPTIONS.map(option => <option key={option.value} value={option.value} lang={option.value}>{option.label}</option>)}
  </select>;
}
