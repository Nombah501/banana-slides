import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Project, Page } from '@/types';
import { resolveLocale } from './i18nHelper';
/**
 * 合并 className (支持 Tailwind CSS)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 标准化后端返回的项目数据
 */
export function normalizeProject(data: any): Project {
  return {
    ...data,
    id: data.project_id || data.id,
    template_image_path: data.template_image_url || data.template_image_path,
    pages: (data.pages || []).map(normalizePage),
  };
}

/**
 * 标准化后端返回的页面数据
 */
export function normalizePage(data: any): Page {
  return {
    ...data,
    id: data.page_id || data.id,
    generated_image_path: data.generated_image_url || data.generated_image_path,
  };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 下载文件
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function downloadFromUrl(url: string, filename?: string) {
  const link = document.createElement('a');
  link.href = url;
  if (filename) {
    link.download = filename;
  }
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const language = localStorage.getItem('banana-slides-language')
    || localStorage.getItem('i18nextLng')
    || navigator.language
    || 'zh-CN';
  const locale = resolveLocale(language);
  const intlLocale = locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US';
  return date.toLocaleString(intlLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
export function normalizeErrorMessage(
  errorMessage: string | null | undefined,
  language?: string,
): string {
  const selectedLanguage = language
    || localStorage.getItem('banana-slides-language')
    || localStorage.getItem('i18nextLng')
    || navigator.language
    || 'zh';
  const locale = resolveLocale(selectedLanguage);
  const isZh = locale === 'zh';
  const isRu = locale === 'ru';

  if (!errorMessage) return isZh ? '操作失败' : isRu ? 'Операция не выполнена' : 'Operation failed';

  const rawMessage = typeof errorMessage === 'string'
    ? errorMessage
    : (() => {
        try {
          return JSON.stringify(errorMessage);
        } catch {
          return String(errorMessage);
        }
      })();

  if (!rawMessage) return isZh ? '操作失败' : isRu ? 'Операция не выполнена' : 'Operation failed';

  const message = rawMessage.toLowerCase();
  const isCodexContext = (
    message.includes('codex')
    || message.includes('chatgpt.com')
    || message.includes('/backend-api/codex/')
    || message.includes('openai oauth')
  );

  // Handle specific error messages
  if (message.includes('no template image found')) {
    return isZh
      ? '当前项目还没有模板，请先点击页面工具栏的"更换模板"按钮，选择或上传一张模板图片后再生成。'
      : isRu
        ? 'В текущем проекте нет шаблона. Сначала нажмите «Изменить шаблон» на панели инструментов страницы, выберите или загрузите изображение шаблона, затем повторите генерацию.'
        : 'No template found. Please select or upload a template image first.';
  } else if (message.includes('page must have description content')) {
    return isZh
      ? '该页面还没有描述内容，请先在"编辑页面描述"步骤为此页生成或填写描述。'
      : isRu
        ? 'Для этой страницы нет описания. Сначала создайте или заполните его на шаге «Редактировать описание страницы».'
        : 'This page has no description. Please generate or write a description first.';
  } else if (message.includes('image already exists')) {
    return isZh
      ? '该页面已经有图片，如需重新生成，请在生成时选择"重新生成"或稍后重试。'
      : isRu
        ? 'На этой странице уже есть изображение. Чтобы создать его заново, выберите «Сгенерировать заново» или повторите попытку позже.'
        : 'Image already exists. Choose "Regenerate" to create a new one.';
  }

  // Handle HTTP error codes
  if (message.includes('503') || message.includes('service unavailable')) {
    return isZh
      ? 'AI 服务暂时不可用，请稍后重试。如果问题持续，请检查设置页的 API 配置。'
      : isRu
        ? 'Сервис ИИ временно недоступен. Повторите попытку позже. Если проблема не исчезнет, проверьте настройки API на странице настроек.'
        : 'AI service temporarily unavailable. Please try again later.';
  } else if (message.includes('500') || message.includes('internal server error')) {
    return isZh ? '服务器内部错误，请稍后重试。' : isRu ? 'Внутренняя ошибка сервера. Повторите попытку позже.' : 'Internal server error. Please try again later.';
  } else if (message.includes('502') || message.includes('bad gateway')) {
    return isZh ? '网关错误，请稍后重试。' : isRu ? 'Ошибка шлюза. Повторите попытку позже.' : 'Bad gateway. Please try again later.';
  } else if (message.includes('504') || message.includes('gateway timeout')) {
    return isZh ? '请求超时，请稍后重试。' : isRu ? 'Время ожидания запроса истекло. Повторите попытку позже.' : 'Gateway timeout. Please try again later.';
  } else if (message.includes('429') || message.includes('too many requests')) {
    return isZh ? '请求过于频繁，请稍后重试。' : isRu ? 'Слишком много запросов. Повторите попытку позже.' : 'Too many requests. Please try again later.';
  } else if (message.includes('401') || message.includes('unauthorized')) {
    if (isCodexContext || (message.includes('oauth') && message.includes('not connected'))) {
      return isZh
        ? 'Codex 登录已过期或未连接，请前往设置重新登录 OpenAI 账号后再试。'
        : isRu
          ? 'Срок действия входа в Codex истёк или подключение отсутствует. Перейдите в настройки, снова войдите в аккаунт OpenAI и повторите попытку.'
          : 'Your Codex login has expired or is disconnected. Please reconnect your OpenAI account in Settings and try again.';
    }
    return isZh
      ? '认证失败，请检查 API 密钥配置。'
      : isRu
        ? 'Не удалось пройти аутентификацию. Проверьте настройки API Key.'
        : 'Authentication failed. Please check API key settings.';
  } else if (message.includes('403') || message.includes('forbidden')) {
    return isZh ? '访问被拒绝，请检查 API 权限配置。' : isRu ? 'Доступ запрещён. Проверьте права API.' : 'Access denied. Please check API permissions.';
  } else if (message.includes('aspect_ratio') || message.includes('aspect ratio')) {
    return isZh
      ? '当前画面比例不被该模型支持，请在项目设置中尝试其他画面比例后重试。'
      : isRu
        ? 'Выбранное соотношение сторон не поддерживается этой моделью. Измените его в настройках проекта и повторите попытку.'
        : 'The selected aspect ratio is not supported by this model. Please try a different ratio in project settings.';
  } else if (message.includes('network error') || message.includes('econnrefused')) {
    return isZh
      ? '网络连接失败，请检查网络或后端服务是否正常运行。'
      : isRu
        ? 'Не удалось подключиться к сети. Проверьте подключение и работу сервиса backend.'
        : 'Network error. Please check your connection.';
  } else if (message.includes('timeout')) {
    return isZh ? '请求超时，请稍后重试。' : isRu ? 'Время ожидания запроса истекло. Повторите попытку позже.' : 'Request timed out. Please try again later.';
  } else if (
    message.includes('sslerror')
    || message.includes('ssleoferror')
    || message.includes('unexpected_eof_while_reading')
    || message.includes('eof occurred in violation of protocol')
    || message.includes('max retries exceeded')
    || message.includes('httpsconnectionpool')
  ) {
    if (isCodexContext) {
      return isZh
        ? '连接 Codex 服务时中断，导致导出失败。请稍后重试；如果反复出现，可前往设置重新登录 OpenAI 账号后再试。'
        : isRu
          ? 'Подключение к сервису Codex прервано, поэтому экспорт не выполнен. Повторите попытку позже; если ошибка повторяется, снова войдите в аккаунт OpenAI в настройках.'
          : 'The connection to Codex was interrupted and the export failed. Please try again later, or reconnect your OpenAI account in Settings if it keeps happening.';
    }
    return isZh
      ? '网络连接中断，导致操作失败。请稍后重试。'
      : isRu
        ? 'Сетевое подключение прервано, поэтому операция не выполнена. Повторите попытку позже.'
        : 'The connection was interrupted and the operation failed. Please try again later.';
  } else if (message.includes('样式提取失败') || message.includes('style extraction failed')) {
    if (message.includes('不支持图片输入') || message.includes('support image input')) {
      return isZh
        ? '可编辑 PPTX 导出失败：当前图片样式提取模型不支持图片输入。请在设置中改用支持视觉输入的 image caption 模型，或切换 provider 后重试。'
        : isRu
          ? 'Не удалось экспортировать редактируемый PPTX: текущая модель извлечения стилей изображений не поддерживает ввод изображений. Выберите в настройках модель image caption с поддержкой изображений или смените provider и повторите попытку.'
          : 'Editable PPTX export failed: the current style extraction model does not support image input. Switch to a vision-capable image caption model and try again.';
    }
    return isZh
      ? '可编辑 PPTX 导出失败：文本样式提取没有成功完成。请检查 image caption 模型/API 配置，或在项目设置中开启“允许返回半成品”后重试。'
      : isRu
        ? 'Не удалось экспортировать редактируемый PPTX: извлечение стилей текста не завершилось. Проверьте настройки модели image caption и API или включите в настройках проекта параметр «Разрешить частичный результат», затем повторите попытку.'
        : 'Editable PPTX export failed because text style extraction did not complete. Check the image caption model/API settings, or enable partial results and try again.';
  }

  return rawMessage;
}

/**
 * PPT 翻新依赖 MinerU 解析 PDF。只在该工作流中将凭据类失败转成明确的修复动作，
 * 避免把其他 provider 的认证错误错误归因为 MinerU。
 */
export function normalizeRenovationErrorMessage(errorMessage: string | null | undefined): string {
  const rawMessage = typeof errorMessage === 'string' ? errorMessage : String(errorMessage || '');
  const message = rawMessage.toLowerCase();
  const language = localStorage.getItem('banana-slides-language')
    || localStorage.getItem('i18nextLng')
    || navigator.language
    || 'zh';
  const locale = resolveLocale(language);
  const normalized = normalizeErrorMessage(errorMessage, language);
  const looksLikeMineruCredentialStage = message.includes('get upload url')
    || message.includes('requesting upload url')
    || message.includes('file-urls/batch')
    || message.includes('task status')
    || message.includes('extract-results')
    || message.includes('file parsing failed');
  const looksLikeCredentialFailure = message.includes('401')
    || message.includes('403')
    || message.includes('unauthorized')
    || message.includes('forbidden')
    || message.includes('token expired')
    || message.includes('invalid token')
    || message.includes('token invalid')
    || message.includes('token has expired')
    || message.includes('authenticate failed')
    || message.includes('authentication failed');

  if (message.includes('mineru') && looksLikeMineruCredentialStage && looksLikeCredentialFailure) {
    return locale === 'zh'
      ? 'PPT 翻新无法解析 PDF：MinerU Token 已失效、无效或没有权限。请到「设置 → MinerU 配置」更新 Token，先运行“MinerU 解析 PDF”服务测试，再重新创建翻新项目。'
      : locale === 'ru'
        ? 'Не удалось разобрать PDF в режиме обновления PPT: срок действия MinerU Token истёк, Token недействителен или у него нет нужных прав. Обновите Token в разделе «Настройки → Конфигурация MinerU», запустите тест сервиса «Разбор PDF в MinerU», затем создайте проект обновления заново.'
        : 'PPT Renovation could not parse the PDF because the MinerU token is expired, invalid, or unauthorized. Update it in Settings → MinerU Configuration, run the “MinerU PDF Parsing” service test, then create the renovation project again.';
  }

  return normalized;
}

export const isDesktop = typeof window !== 'undefined' && 'electronAPI' in window;
export const DESKTOP_TITLEBAR_HEIGHT = 50;
