import { resolveLocale, type SupportedLocale } from './i18nHelper';

const EXTRA_FIELD_DISPLAY_NAMES: Record<string, Record<SupportedLocale, string>> = {
  '演讲者备注': {
    zh: '演讲者备注',
    en: 'Speaker notes',
    ru: 'Заметки спикера',
  },
  '版式与重点': {
    zh: '版式与重点',
    en: 'Layout and emphasis',
    ru: 'Вёрстка и акценты',
  },
  '配图与素材': {
    zh: '配图与素材',
    en: 'Visuals and materials',
    ru: 'Иллюстрации и материалы',
  },
};

export function getExtraFieldDisplayName(name: string, language?: string): string {
  return EXTRA_FIELD_DISPLAY_NAMES[name]?.[resolveLocale(language)] ?? name;
}

export { EXTRA_FIELD_DISPLAY_NAMES };
