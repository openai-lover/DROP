import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { DEFAULT_LOCALE, LANGUAGE_OPTIONS, LOCALES, TRANSLATIONS, normalizeLocale, translate } from '../../src/i18n/catalog';
import { createLocaleStore, LANGUAGE_STORAGE_KEY, type LocaleStorage } from '../../src/i18n/locale-store';
import { LanguageProvider, LanguageSelector, useLanguage } from '../../src/i18n/provider';

function memoryStorage(initial: string | null = null): LocaleStorage {
  let value = initial;
  return { getItem: () => value, setItem: (_key, next) => { value = next; } };
}

describe('five-language service experience', () => {
  it('uses English by default and offers exactly the five supported languages', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(LOCALES).toEqual(['en', 'ko', 'ja', 'zh-CN', 'es']);
    expect(LANGUAGE_OPTIONS.map(option => option.label)).toEqual(['English', '한국어', '日本語', '简体中文', 'Español']);
    expect(normalizeLocale(null)).toBe('en');
    expect(normalizeLocale('fr')).toBe('en');
    expect(normalizeLocale('zh-CN')).toBe('zh-CN');
  });

  it('renders the initial page and accessible language options in English', () => {
    function Probe() {
      const { locale, t } = useLanguage();
      return createElement('p', { lang: locale }, t('내 보상', 'My rewards'));
    }
    const html = renderToString(createElement(LanguageProvider, null, createElement(Probe), createElement(LanguageSelector)));
    expect(html).toContain('<p lang="en">My rewards</p>');
    expect(html).toContain('aria-label="Language"');
    expect(html).toMatch(/<option[^>]*value="en"[^>]*selected=""/);
    expect(html.match(/<option /g)).toHaveLength(5);
  });

  it('restores a saved language, persists a new choice, and informs subscribers', () => {
    const storage = memoryStorage('ja');
    const store = createLocaleStore(() => storage);
    expect(store.getServerSnapshot()).toBe('en');
    expect(store.getSnapshot()).toBe('ja');
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.setLocale('es');
    expect(storage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es');
    expect(store.getSnapshot()).toBe('es');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(createLocaleStore(() => storage).getSnapshot()).toBe('es');
    unsubscribe();
    store.setLocale('ko');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('falls back to English for an invalid saved language and supports cross-tab restoration', () => {
    const storage = memoryStorage('unsupported');
    const store = createLocaleStore(() => storage);
    expect(store.getSnapshot()).toBe('en');
    const listener = vi.fn();
    store.subscribe(listener);
    storage.setItem(LANGUAGE_STORAGE_KEY, 'zh-CN');
    store.restore();
    expect(store.getSnapshot()).toBe('zh-CN');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('still switches languages when storage is blocked or full', () => {
    const inaccessible = createLocaleStore(() => { throw new Error('Blocked storage'); });
    expect(inaccessible.getSnapshot()).toBe('en');
    expect(() => inaccessible.setLocale('ja')).not.toThrow();
    expect(inaccessible.getSnapshot()).toBe('ja');
    inaccessible.restore();
    expect(inaccessible.getSnapshot()).toBe('ja');
    const full = createLocaleStore(() => ({ getItem: () => 'ko', setItem: () => { throw new Error('Quota exceeded'); } }));
    expect(full.getSnapshot()).toBe('ko');
    full.setLocale('es');
    expect(full.getSnapshot()).toBe('es');
  });

  it('keeps the legacy judge shortcut directed to English from every other language', () => {
    const store = createLocaleStore(() => memoryStorage());
    for (const locale of ['ko', 'ja', 'zh-CN', 'es'] as const) {
      store.setLocale(locale);
      store.toggle();
      expect(store.getSnapshot()).toBe('en');
    }
    store.toggle();
    expect(store.getSnapshot()).toBe('ko');
  });

  it('translates game instructions and reward disclosures while preserving unknown user content', () => {
    expect(translate('en', '내 보상', 'My rewards')).toBe('My rewards');
    expect(translate('ko', '내 보상', 'My rewards')).toBe('내 보상');
    expect(translate('ja', '내 보상', 'My rewards')).toBe('マイ報酬');
    expect(translate('zh-CN', '내 보상', 'My rewards')).toBe('我的奖励');
    expect(translate('es', '내 보상', 'My rewards')).toBe('Mis recompensas');
    for (const locale of ['ja', 'zh-CN', 'es'] as const) {
      expect(translate(locale, '연습 · 보상 없음', 'Practice · No payout')).not.toBe('Practice · No payout');
      expect(translate(locale, '계정 이름', 'Alice’s private community title')).toBe('Alice’s private community title');
    }
    expect(translate('zh-CN', '회', ' attempts')).toBe('次');
    expect(translate('es', '회', ' attempts')).toBe(' intentos');
  });

  it('formats changing counts without translating or modifying inserted values', () => {
    expect(translate('ja', '남은 수량: {count}', 'Remaining: {count}', { count: 12 })).toBe('残り：12');
    expect(translate('zh-CN', '{seconds}초 이내', 'Within {seconds} seconds', { seconds: 18 })).toBe('18秒内');
    expect(translate('es', '문제 {count}', 'Question {count}', { count: 3 })).toBe('Pregunta 3');
    expect(translate('en', '본문 {name}', 'Text {name}', { name: '$& Alice <script>' })).toBe('Text $& Alice <script>');
    expect(translate('en', '본문 {name}', 'Text {name}', {})).toBe('Text {name}');
  });

  it('provides translations for literal service copy throughout the screens', () => {
    const phrases = new Set<string>();
    const inspect = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) { inspect(file); continue; }
        if (!/\.tsx?$/.test(file)) continue;
        const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
        const visit = (node: ts.Node) => {
          if (ts.isCallExpression(node) && node.expression.getText(source) === 't') {
            const english = node.arguments[1];
            if (english && ts.isStringLiteralLike(english)) phrases.add(english.text);
            if (english && ts.isElementAccessExpression(english) && ts.isArrayLiteralExpression(english.expression)) {
              for (const item of english.expression.elements) if (ts.isStringLiteralLike(item)) phrases.add(item.text);
            }
          }
          if (ts.isArrayLiteralExpression(node) && node.elements.length === 2 && node.elements.every(ts.isStringLiteralLike) && /[가-힣]/.test(node.elements[0].text)) phrases.add(node.elements[1].text);
          ts.forEachChild(node, visit);
        };
        visit(source);
      }
    };
    inspect(path.resolve('src/components'));
    inspect(path.resolve('src/app'));
    expect([...phrases].filter(phrase => !Object.hasOwn(TRANSLATIONS, phrase))).toEqual([]);
    for (const phrase of phrases) expect(TRANSLATIONS[phrase].every(text => text.trim().length > 0)).toBe(true);
  });
});
