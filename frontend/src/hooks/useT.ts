import { useTranslation } from 'react-i18next';
import { localeFallbackChain, type SupportedLocale } from '@/utils/i18nHelper';

type NestedRecord = Record<string, unknown>;

type Translations = Record<SupportedLocale, NestedRecord>;

/**
 * 获取嵌套对象的值，支持点号路径
 * 例如：getNestedValue(obj, 'home.title') 获取 obj.home.title
 */
function getNestedValue(obj: NestedRecord, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as NestedRecord)[key];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : undefined;
}

/**
 * 组件级 i18n hook - 智能 fallback（方案 B）
 * 
 * 优先从组件内翻译查找，找不到自动 fallback 到全局翻译。
 * 这样只需要一个 t()，调用方式完全不变！
 * 
 * 使用方式：
 * ```tsx
 * const homeI18n = {
 *   zh: {
 *     home: {
 *       title: '蕉幻',
 *       messages: { success: '成功' }
 *     }
 *   },
 *   en: {
 *     home: {
 *       title: 'Banana Slides',
 *       messages: { success: 'Success' }
 *     }
 *   }
 * };
 * 
 * const t = useT(homeI18n);
 * 
 * t('home.title')     // 从组件内翻译获取: "蕉幻"
 * t('common.save')    // 组件内没有，自动 fallback 到全局: "保存"
 * ```
 * 
 * 这样翻译和组件放在一起，AI 一眼就能看到所有上下文！
 */
export type TranslationFunction = (
  key: string,
  defaultOrParams?: string | Record<string, string | number>
) => string;

export function useT<T extends Translations>(translations: T) {
  const { t: globalT, i18n } = useTranslation();
  const locales = localeFallbackChain(i18n.language);
  // 兼容 react-i18next 的多种调用方式：
  // t('key') / t('key', '默认值') / t('key', { param: value })
  return (key: string, defaultOrParams?: string | Record<string, string | number>): string => {
    const params = typeof defaultOrParams === 'object' ? defaultOrParams : undefined;
    const localValue = locales
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
    
    if (typeof defaultOrParams === 'string') {
      return globalT(key, { defaultValue: defaultOrParams });
    }
    return defaultOrParams ? globalT(key, defaultOrParams) : globalT(key);
  };
}
