import i18n from '@/i18n';

export type NestedRecord = Record<string, unknown>;
export type SupportedLocale = 'zh' | 'en' | 'ru';
export type Translations = Record<SupportedLocale, NestedRecord>;

export function resolveLocale(language?: string): SupportedLocale {
  const normalized = language?.toLowerCase() || '';
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('ru')) return 'ru';
  return 'en';
}

export function nextLocale(language?: string): SupportedLocale {
  const locale = resolveLocale(language);
  return locale === 'zh' ? 'en' : locale === 'en' ? 'ru' : 'zh';
}

export function localeFallbackChain(language?: string): SupportedLocale[] {
  const locale = resolveLocale(language);
  return locale === 'ru' ? ['ru', 'en', 'zh'] : locale === 'en' ? ['en', 'zh'] : ['zh'];
}

function getNestedValue(obj: NestedRecord, path: string): string | undefined {
  let current: unknown = obj;
  for (const key of path.split('.')) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as NestedRecord)[key];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Non-React translation helper for stores/utils.
 * Same pattern as useT but without React hooks.
 */
export function getT<T extends Translations>(translations: T) {
  return (key: string, params?: Record<string, string | number>): string => {
    const localValue = localeFallbackChain(i18n.language)
      .map((locale) => getNestedValue(translations[locale], key))
      .find((value): value is string => value !== undefined);
    if (localValue !== undefined) {
      let text = localValue;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        });
      }
      return text;
    }
    return params ? i18n.t(key, params) : i18n.t(key);
  };
}
