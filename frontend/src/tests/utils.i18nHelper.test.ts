import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n, { getDocumentTitle } from '@/i18n';
import { getT, resolveLocale, type Translations } from '@/utils/i18nHelper';
import { getExtraFieldDisplayName } from '@/utils/extraFieldLabels';
import { landingI18n } from '@/pages/Landing';
import { homeI18n } from '@/pages/Home';
import { settingsI18n } from '@/pages/Settings';

const countNonEmptyStrings = (value: unknown): number => {
  if (typeof value === 'string') return value.trim() ? 1 : 0;
  if (Array.isArray(value)) return value.reduce((count, item) => count + countNonEmptyStrings(item), 0);
  if (value && typeof value === 'object') {
    return Object.values(value).reduce((count, item) => count + countNonEmptyStrings(item), 0);
  }
  return 0;
};

describe('locale helpers', () => {
  beforeEach(async () => {
    window.localStorage.setItem('banana-slides-language', 'ru');
    await i18n.changeLanguage('ru');
  });

  afterEach(async () => {
    await i18n.changeLanguage('zh');
    window.localStorage.clear();
  });

  it('resolves Russian language states and selects local Russian copy', () => {
    expect(resolveLocale('ru-RU')).toBe('ru');
    const translations: Translations = {
      zh: { greeting: '你好' },
      en: { greeting: 'Hello' },
      ru: { greeting: 'Здравствуйте' },
    };
    expect(getT(translations)('greeting')).toBe('Здравствуйте');
  });

  it('persists a Russian language change through the existing detector key', async () => {
    window.localStorage.removeItem('banana-slides-language');
    await i18n.changeLanguage('ru');
    expect(window.localStorage.getItem('banana-slides-language')).toBe('ru');
  });
  it('updates the document title for Chinese and non-Chinese locales', async () => {
    await i18n.changeLanguage('zh');
    expect(getDocumentTitle(i18n.language)).toBe('蕉幻 | AI 原生 PPT 生成器');
    expect(document.title).toBe('蕉幻 | AI 原生 PPT 生成器');

    await i18n.changeLanguage('ru');
    expect(getDocumentTitle(i18n.language)).toBe('Banana Slides');
    expect(document.title).toBe('Banana Slides');
  });
  it('uses the configured fallback chain from Russian to English to Chinese', async () => {
    const enBundle = i18n.getResourceBundle('en', 'translation') as Record<string, unknown>;
    const zhBundle = i18n.getResourceBundle('zh', 'translation') as Record<string, unknown>;
    const previousEn = enBundle.__phase2Fallback;
    const previousZh = zhBundle.__phase2Fallback;
    enBundle.__phase2Fallback = 'English fallback';
    zhBundle.__phase2Fallback = 'Китайский fallback';

    expect(i18n.t('__phase2Fallback')).toBe('English fallback');
    delete enBundle.__phase2Fallback;
    expect(i18n.t('__phase2Fallback')).toBe('Китайский fallback');

    if (previousEn !== undefined) enBundle.__phase2Fallback = previousEn;
    if (previousZh !== undefined) zhBundle.__phase2Fallback = previousZh;
  });

  it('keeps representative screen dictionaries populated in Russian', () => {
    expect(countNonEmptyStrings(landingI18n.ru)).toBeGreaterThan(0);
    expect(countNonEmptyStrings(homeI18n.ru)).toBeGreaterThan(0);
    expect(countNonEmptyStrings(settingsI18n.ru)).toBeGreaterThan(0);
  });

  it('localizes known extra fields and preserves unknown custom keys', () => {
    expect(getExtraFieldDisplayName('演讲者备注', 'ru')).toBe('Заметки спикера');
    expect(getExtraFieldDisplayName('版式与重点', 'en')).toBe('Layout and emphasis');
    expect(getExtraFieldDisplayName('配图与素材', 'zh')).toBe('配图与素材');
    expect(getExtraFieldDisplayName('Моё поле', 'ru')).toBe('Моё поле');
  });
});
