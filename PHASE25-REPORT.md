# Phase 2.5–2.6 — отчёт (локализация оболочки, форк-ссылки, починка Windows CI, хотфиксы)

Ветка: `phase1-ru-content` → релиз `v0.9.0-rc.7-ru.3`.

## Что вошло

### 2.5 — локализация Electron-оболочки + FFmpeg
- `desktop/main.js`, `splash.html`, `preload.js` — пользовательские строки оболочки через i18n-таблицы (`desktop/i18n.js`), zh/en/ru.
- Язык оболочки: IPC из фронтенда (`set-locale`) → env `BANANA_SLIDES_LOCALE` → системная локаль → en. Меню перестраивается на лету.
- Заголовок окна: `document.title` по локали (zh — 蕉幻, en/ru — Banana Slides), обновляется при смене языка.
- Windows CI: FFmpeg-пин переведён на роллинговый BtbN `ffmpeg-n8.1-latest-win64-gpl-8.1.zip`; sha256 больше не статический пин — самопроверка через `checksums.sha256` того же релиза + sidecar-кэш `desktop/.cache/ffmpeg/<zip>.sha256`; ключ Actions-cache — `windows-ffmpeg-btbn-8.1-selfverify`.
- Тесты: `i18n.test.js`, `electron-api.test.js`.

### 2.6 — ссылки на GitHub → форк
- Новый модуль `frontend/src/config/links.ts` (`GITHUB_REPO = 'Nombah501/banana-slides'`).
- Переведены: Настройки, Лендинг, Справка (repo/issues), Футер, GitHub-бейдж и карточка.
- Апстрим-исключение: ссылка на витрину Use Cases (`issues/2`) — контент-референс.

### 2.5.1 — упаковка модулей в app.asar
- `i18n.js` и `electron-api.js` добавлены в `desktop/electron-builder.yml` (`files`).
- Контракт-тест `scripts/check-packaged-modules.test.js`: каждый локальный require упакованных модулей обязан присутствовать в `files`.

### 2.5.2 — sandbox-совместимый preload (критический фикс)
- Причина: preload исполняется в sandbox (по умолчанию в Electron), где локальные require запрещены; `preload.js` тянул `./electron-api` → preload не загружался → `window.electronAPI` отсутствовал → UI показывал «Cannot connect to backend service». Затрагивал бы все ОС.
- Решение: `preload.js` самодостаточный (единственный require — `electron`); содержимое `electron-api.js` встраивается генератором `scripts/sync-preload.js` между маркерами; режим `--check`; guard-тест «в sandbox-preload только встроенные require» + тест соответствия генератору.
- Sandbox/contextIsolation не ослаблялись.

## Как поймано (методика)
- Пробы CI на временных тегах (draft, без публикации): probe1 — выявил asar-пропажу модулей; probe2 — выявил preload-баг (маковский CDP-тест «Smoke test macOS DMG»); probe3 — 3/3 платформы зелёные (Windows впервые полностью: установка + smoke).
- Локальный репро-стенд на пакетированном AppImage (Xvfb + Playwright/CDP): воспроизведение бага (`Cannot connect to backend service`) и подтверждение фикса (`IMAGE RESPONSE OK`, `electronAPI: object`).

## Проверено
- `desktop npm test`: 94/94; `frontend npm test`: 221/221; `frontend npm run build` ✓.
- CI probe3: windows ✓ / linux ✓ / macos ✓ (включая все smoke-тесты).
- Локальный репро probe3: картинка проекта загружается, UI рендерится.
