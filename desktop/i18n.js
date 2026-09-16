const SUPPORTED_LOCALES = ['zh', 'en', 'ru'];

const translations = {
  zh: {
    tray: {
      showMainWindow: '显示主窗口',
      quit: '退出',
    },
    update: {
      downloaded: {
        title: '更新已就绪',
        message: '新版本 v{version} 已下载完成',
        detail: '重启 Banana Slides 即可完成更新。',
        restart: '重启并更新',
        later: '稍后重启',
      },
      available: {
        title: '发现新版本',
        message: '新版本 v{version} 可用',
        download: '下载更新',
        openDownload: '前往下载',
        changelog: '查看完整更新日志',
        later: '稍后更新',
      },
      upToDate: {
        title: '检查更新',
        message: '当前已是最新版本',
      },
      error: {
        title: '检查更新失败',
        message: '无法连接更新服务，请检查网络后重试',
      },
    },
    menu: {
      mac: {
        about: '关于 Banana Slides',
        hide: '隐藏',
        hideOthers: '隐藏其他',
        showAll: '全部显示',
        quit: '退出',
      },
      file: {
        label: '文件',
        quit: '退出',
        closeWindow: '关闭窗口',
      },
      edit: {
        label: '编辑',
        undo: '撤销',
        redo: '重做',
        cut: '剪切',
        copy: '复制',
        paste: '粘贴',
        selectAll: '全选',
      },
      view: {
        label: '视图',
        zoomIn: '放大',
        zoomOut: '缩小',
        resetZoom: '重置缩放',
        fullscreen: '全屏',
        reload: '重新加载',
        forceReload: '强制重新加载',
        devTools: '开发者工具',
      },
      window: {
        label: '窗口',
        minimize: '最小化',
        front: '前置全部窗口',
        close: '关闭',
      },
      help: {
        label: '帮助',
        checkForUpdates: '检查更新...',
        about: '关于',
      },
    },
    about: {
      title: '关于 Banana Slides',
      message: 'Banana Slides v{version}',
      detail: 'AI-Native Presentation Generator',
    },
    storage: {
      chooseTitle: '选择数据存储位置',
      recovery: {
        title: '无法访问数据存储位置',
        message: 'Banana Slides 无法访问已配置的数据存储位置。',
        chooseOther: '选择其他位置',
        quit: '退出',
        noSelection: '尚未选择可用的数据存储位置。',
      },
      confirm: {
        title: '确认使用新的数据位置',
        message: '所选目录中没有 Banana Slides 数据库。',
        detail: '继续后将把此位置作为新的空数据目录使用。应用不会移动或删除原目录中的任何数据。',
        use: '使用此位置',
        chooseOther: '重新选择',
      },
    },
    download: {
      allFiles: '所有文件',
      error: {
        interrupted: '下载被中断，请重试。',
        timeout: '下载超时，请重试。',
        missing: '目标文件没有写入。',
        empty: '目标文件为空。',
        failed: '文件复制或下载失败。',
        cancelled: '下载已取消。',
        fallback: '下载失败',
      },
      dialog: {
        title: '保存失败',
        message: '文件没有保存成功',
        detail: '{error}\n\n目标位置：{destination}',
      },
    },
    startup: {
      errorTitle: '启动失败',
      backendError: '后端服务启动失败：{detail}',
    },
  },
  en: {
    tray: {
      showMainWindow: 'Show Main Window',
      quit: 'Quit',
    },
    update: {
      downloaded: {
        title: 'Update Ready',
        message: 'Version v{version} has finished downloading',
        detail: 'Restart Banana Slides to complete the update.',
        restart: 'Restart and Update',
        later: 'Later',
      },
      available: {
        title: 'Update Available',
        message: 'Version v{version} is available',
        download: 'Download Update',
        openDownload: 'Go to Download',
        changelog: 'View Full Changelog',
        later: 'Later',
      },
      upToDate: {
        title: 'Check for Updates',
        message: 'You are up to date',
      },
      error: {
        title: 'Update Check Failed',
        message: 'Could not connect to the update service. Check your network and try again.',
      },
    },
    menu: {
      mac: {
        about: 'About Banana Slides',
        hide: 'Hide',
        hideOthers: 'Hide Others',
        showAll: 'Show All',
        quit: 'Quit',
      },
      file: {
        label: 'File',
        quit: 'Quit',
        closeWindow: 'Close Window',
      },
      edit: {
        label: 'Edit',
        undo: 'Undo',
        redo: 'Redo',
        cut: 'Cut',
        copy: 'Copy',
        paste: 'Paste',
        selectAll: 'Select All',
      },
      view: {
        label: 'View',
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        resetZoom: 'Reset Zoom',
        fullscreen: 'Full Screen',
        reload: 'Reload',
        forceReload: 'Force Reload',
        devTools: 'Developer Tools',
      },
      window: {
        label: 'Window',
        minimize: 'Minimize',
        front: 'Bring All to Front',
        close: 'Close',
      },
      help: {
        label: 'Help',
        checkForUpdates: 'Check for Updates...',
        about: 'About',
      },
    },
    about: {
      title: 'About Banana Slides',
      message: 'Banana Slides v{version}',
      detail: 'AI-Native Presentation Generator',
    },
    storage: {
      chooseTitle: 'Choose Data Storage Location',
      recovery: {
        title: 'Data Storage Location Unavailable',
        message: 'Banana Slides cannot access the configured data storage location.',
        chooseOther: 'Choose Another Location',
        quit: 'Quit',
        noSelection: 'No usable data storage location has been selected.',
      },
      confirm: {
        title: 'Confirm New Data Location',
        message: 'The selected directory does not contain a Banana Slides database.',
        detail: 'Continuing will use this location as a new empty data directory. The app will not move or delete data in the original directory.',
        use: 'Use This Location',
        chooseOther: 'Choose Again',
      },
    },
    download: {
      allFiles: 'All Files',
      error: {
        interrupted: 'The download was interrupted. Try again.',
        timeout: 'The download timed out. Try again.',
        missing: 'The destination file was not written.',
        empty: 'The destination file is empty.',
        failed: 'The file could not be copied or downloaded.',
        cancelled: 'The download was cancelled.',
        fallback: 'The download failed.',
      },
      dialog: {
        title: 'Save Failed',
        message: 'The file was not saved',
        detail: '{error}\n\nDestination: {destination}',
      },
    },
    startup: {
      errorTitle: 'Startup Failed',
      backendError: 'The backend service failed to start: {detail}',
    },
  },
  ru: {
    tray: {
      showMainWindow: 'Показать главное окно',
      quit: 'Выйти',
    },
    update: {
      downloaded: {
        title: 'Обновление готово',
        message: 'Новая версия v{version} загружена',
        detail: 'Перезапустите Banana Slides, чтобы завершить обновление.',
        restart: 'Перезапустить и обновить',
        later: 'Позже',
      },
      available: {
        title: 'Доступна новая версия',
        message: 'Доступна новая версия v{version}',
        download: 'Загрузить обновление',
        openDownload: 'Перейти к загрузке',
        changelog: 'Посмотреть полный журнал изменений',
        later: 'Позже',
      },
      upToDate: {
        title: 'Проверка обновлений',
        message: 'Установлена последняя версия',
      },
      error: {
        title: 'Не удалось проверить обновления',
        message: 'Не удалось подключиться к сервису обновлений. Проверьте подключение к интернету и повторите попытку.',
      },
    },
    menu: {
      mac: {
        about: 'О Banana Slides',
        hide: 'Скрыть',
        hideOthers: 'Скрыть другие',
        showAll: 'Показать все',
        quit: 'Выйти',
      },
      file: {
        label: 'Файл',
        quit: 'Выйти',
        closeWindow: 'Закрыть окно',
      },
      edit: {
        label: 'Правка',
        undo: 'Отменить',
        redo: 'Повторить',
        cut: 'Вырезать',
        copy: 'Копировать',
        paste: 'Вставить',
        selectAll: 'Выбрать всё',
      },
      view: {
        label: 'Вид',
        zoomIn: 'Увеличить',
        zoomOut: 'Уменьшить',
        resetZoom: 'Сбросить масштаб',
        fullscreen: 'Полный экран',
        reload: 'Перезагрузить',
        forceReload: 'Принудительно перезагрузить',
        devTools: 'Инструменты разработчика',
      },
      window: {
        label: 'Окно',
        minimize: 'Свернуть',
        front: 'Переместить все окна на передний план',
        close: 'Закрыть',
      },
      help: {
        label: 'Справка',
        checkForUpdates: 'Проверить обновления…',
        about: 'О программе',
      },
    },
    about: {
      title: 'О Banana Slides',
      message: 'Banana Slides v{version}',
      detail: 'Генератор презентаций на основе ИИ',
    },
    storage: {
      chooseTitle: 'Выберите расположение для хранения данных',
      recovery: {
        title: 'Не удалось получить доступ к хранилищу данных',
        message: 'Banana Slides не может получить доступ к настроенному хранилищу данных.',
        chooseOther: 'Выбрать другое расположение',
        quit: 'Выйти',
        noSelection: 'Не выбрано доступное расположение для хранения данных.',
      },
      confirm: {
        title: 'Подтвердить новое расположение данных',
        message: 'В выбранной папке нет базы данных Banana Slides.',
        detail: 'После продолжения это расположение будет использоваться как новое пустое хранилище данных. Данные в исходной папке не будут перемещены или удалены.',
        use: 'Использовать это расположение',
        chooseOther: 'Выбрать другое',
      },
    },
    download: {
      allFiles: 'Все файлы',
      error: {
        interrupted: 'Загрузка прервана. Повторите попытку.',
        timeout: 'Время загрузки истекло. Повторите попытку.',
        missing: 'Не удалось записать файл.',
        empty: 'Файл пуст.',
        failed: 'Не удалось скопировать или загрузить файл.',
        cancelled: 'Загрузка отменена.',
        fallback: 'Не удалось загрузить файл.',
      },
      dialog: {
        title: 'Не удалось сохранить файл',
        message: 'Файл не сохранён',
        detail: '{error}\n\nПапка назначения: {destination}',
      },
    },
    startup: {
      errorTitle: 'Не удалось запустить приложение',
      backendError: 'Не удалось запустить серверную часть: {detail}',
    },
  },
};

function normalizeLocale(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('ru')) return 'ru';
  return null;
}

function resolveLocale({ frontendLocale, envLocale, appLocale } = {}) {
  for (const candidate of [frontendLocale, envLocale, appLocale]) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return 'en';
}

function getNestedValue(object, key) {
  return key.split('.').reduce((current, part) => (
    current && typeof current === 'object' ? current[part] : undefined
  ), object);
}

function interpolate(value, params = {}) {
  return value.replace(/\{([A-Za-z0-9_]+)\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match
  ));
}

function createTranslator(locale) {
  const resolvedLocale = normalizeLocale(locale) || 'en';
  return (key, params) => {
    const localValue = getNestedValue(translations[resolvedLocale], key);
    const fallbackValue = getNestedValue(translations.en, key);
    const value = typeof localValue === 'string' ? localValue : fallbackValue;
    return typeof value === 'string' ? interpolate(value, params) : key;
  };
}

module.exports = {
  SUPPORTED_LOCALES,
  translations,
  normalizeLocale,
  resolveLocale,
  createTranslator,
};
