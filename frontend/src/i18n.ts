import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zh from './locales/zh.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

export type SupportedLocale = 'zh' | 'en' | 'ru';

const documentTitles: Record<SupportedLocale, string> = {
  zh: '蕉幻 | AI 原生 PPT 生成器',
  en: 'Banana Slides',
  ru: 'Banana Slides',
};

function resolveSupportedLocale(language?: string): SupportedLocale {
  const normalized = language?.toLowerCase() || '';
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('ru')) return 'ru';
  return 'en';
}

export function getDocumentTitle(language?: string): string {
  return documentTitles[resolveSupportedLocale(language)];
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
      ru: { translation: ru },
    },
    fallbackLng: {
      default: ['zh'],
      zh: ['zh'],
      en: ['zh'],
      ru: ['en', 'zh'],
    },
    supportedLngs: ['zh', 'en', 'ru'],
    load: 'languageOnly',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'banana-slides-language',
    },
  });

function syncDocumentTitleAndDesktopLocale(language?: string) {
  const locale = resolveSupportedLocale(language);
  if (typeof document !== 'undefined') {
    document.title = getDocumentTitle(locale);
  }

  if (typeof window === 'undefined') return;
  const setLocale = (window as typeof window & {
    electronAPI?: { setLocale?: (nextLocale: SupportedLocale) => Promise<unknown> };
  }).electronAPI?.setLocale;
  if (!setLocale) return;

  void Promise.resolve()
    .then(() => setLocale(locale))
    .catch(() => undefined);
}

i18n.on('initialized', () => syncDocumentTitleAndDesktopLocale(i18n.language));
i18n.on('languageChanged', (language) => syncDocumentTitleAndDesktopLocale(language));
if (i18n.isInitialized) {
  syncDocumentTitleAndDesktopLocale(i18n.language);
}

export default i18n;
