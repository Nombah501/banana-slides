const { app, BrowserWindow, Tray, Menu, ipcMain, shell, dialog, nativeImage, nativeTheme } = require('electron');
const { autoUpdater: electronAutoUpdater, CancellationToken } = require('electron-updater');
const path = require('path');
const log = require('electron-log');
const fs = require('fs');
const pythonManager = require('./python-manager');
const { DesktopAutoUpdateManager, detectAutoUpdateSupport } = require('./auto-updater');
const {
  copyLocalExportToPath,
  createUniqueDownloadUrl,
  downloadToPath,
  resolveLocalExportPath,
} = require('./download-manager');
const {
  getApplicationIconPath,
  getTrayIconPath,
  shouldSetDockIcon,
} = require('./icon-policy');
const {
  initializeDataRoot,
  inspectDataRoot,
  prepareDataRoot,
  writeStorageConfig,
} = require('./storage-config');
const { resolveLocale, createTranslator } = require('./i18n');

let mainWindow = null;
let splashWindow = null;
let tray = null;
let isQuitting = false;
let backendStopped = false;
let backendStopRequested = false;
let activeDataRoot = null;
let activeDataRootIsDefault = true;
let desktopAutoUpdater = null;
let currentLocale = 'en';
let detectedAppLocale = 'en';
let translate = createTranslator(currentLocale);

function initializeLocale() {
  detectedAppLocale = app.getLocale();
  currentLocale = resolveLocale({
    envLocale: process.env.BANANA_SLIDES_LOCALE,
    appLocale: detectedAppLocale,
  });
  translate = createTranslator(currentLocale);
}

function applyLocale(locale) {
  const nextLocale = resolveLocale({
    frontendLocale: locale,
    envLocale: process.env.BANANA_SLIDES_LOCALE,
    appLocale: detectedAppLocale,
  });
  if (nextLocale === currentLocale) return currentLocale;
  currentLocale = nextLocale;
  translate = createTranslator(currentLocale);
  createAppMenu();
  updateTrayContextMenu();
  return currentLocale;
}

const runtimeIconState = {
  dockOverrideApplied: false,
  trayTemplateImage: false,
};


function isDev() {
  return process.env.NODE_ENV === 'development';
}

function isSmokeMode() {
  return process.env.BANANA_DESKTOP_SMOKE === '1';
}

function getSmokeQuitDelayMs() {
  const delay = Number(process.env.BANANA_DESKTOP_SMOKE_QUIT_DELAY_MS || 10000);
  return Number.isFinite(delay) && delay >= 0 ? delay : 10000;
}

function configureSmokeUserDataPath() {
  const smokeUserDataPath = process.env.BANANA_DESKTOP_SMOKE_USER_DATA_DIR;
  if (!isSmokeMode() || !smokeUserDataPath) return;
  const resolvedPath = path.resolve(smokeUserDataPath);
  fs.mkdirSync(resolvedPath, { recursive: true });
  app.setPath('userData', resolvedPath);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSmokeCaptureReady(webContents) {
  if (!webContents || webContents.isDestroyed()) return;
  if (webContents.isLoadingMainFrame()) {
    await Promise.race([
      new Promise((resolve) => webContents.once('did-stop-loading', resolve)),
      sleep(10000),
    ]);
  }
  await sleep(Number(process.env.BANANA_DESKTOP_SMOKE_CAPTURE_DELAY_MS || 1500));
}

async function writeSmokeResult(extra = {}) {
  if (!isSmokeMode()) return;

  const resultPath = process.env.BANANA_DESKTOP_SMOKE_RESULT || '';
  const screenshotPath = process.env.BANANA_DESKTOP_SMOKE_SCREENSHOT || '';
  const result = {
    ok: true,
    version: app.getVersion(),
    platform: process.platform,
    backendPort: pythonManager.getPort(),
    windowBounds: mainWindow?.getBounds() || null,
    windowVisible: mainWindow?.isVisible() || false,
    windowTitle: mainWindow?.getTitle() || '',
    url: mainWindow?.webContents?.getURL() || '',
    dataRoot: activeDataRoot,
    iconPolicy: runtimeIconState,
    timestamp: new Date().toISOString(),
    ...extra,
  };

  try {
    if (screenshotPath && mainWindow && !mainWindow.isDestroyed()) {
      await waitForSmokeCaptureReady(mainWindow.webContents);
      const image = await mainWindow.webContents.capturePage();
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      fs.writeFileSync(screenshotPath, image.toPNG());
      result.screenshotPath = screenshotPath;
    }
    if (resultPath) {
      fs.mkdirSync(path.dirname(resultPath), { recursive: true });
      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    }
  } catch (error) {
    log.error('[main] Failed to write smoke result:', error);
    if (resultPath) {
      fs.mkdirSync(path.dirname(resultPath), { recursive: true });
      fs.writeFileSync(resultPath, JSON.stringify({
        ok: false,
        error: error.message,
        ...result,
      }, null, 2));
    }
  } finally {
    setTimeout(() => {
      isQuitting = true;
      app.quit();
    }, getSmokeQuitDelayMs());
  }
}

function getIconPath() {
  return getApplicationIconPath({
    platform: process.platform,
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    desktopDir: __dirname,
  });
}

function getTrayPath() {
  return getTrayIconPath({
    platform: process.platform,
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    desktopDir: __dirname,
  });
}

function shouldOpenInExternalBrowser(targetUrl) {
  try {
    const parsedUrl = new URL(targetUrl);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (error) {
    return false;
  }
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 360,
    frame: false,
    resizable: false,
    transparent: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#111111' : '#ffffff',
    center: true,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'), {
    query: { locale: currentLocale },
  });
  splashWindow.on('closed', () => { splashWindow = null; });
}

function createMainWindow() {
  const isMac = process.platform === 'darwin';
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 680,
    minHeight: 480,
    show: false,
    ...(isMac
      ? {
          titleBarStyle: 'hidden',
          trafficLightPosition: { x: 16, y: 16 },
          backgroundColor: '#ffffff',
        }
      : {
          frame: false,
          icon: getIconPath(),
        }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.dock && shouldSetDockIcon({ platform: process.platform, isPackaged: app.isPackaged })) {
    app.dock.setIcon(getIconPath());
    runtimeIconState.dockOverrideApplied = true;
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.webContents.setZoomFactor(0.8);
    mainWindow.show();
    mainWindow.focus();
    setTimeout(() => writeSmokeResult(), 1000);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (shouldOpenInExternalBrowser(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (shouldOpenInExternalBrowser(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function createTray() {
  const trayPath = getTrayPath();
  let icon = nativeImage.createFromPath(trayPath);
  let usesTemplateImage = process.platform === 'darwin';
  let usesFallbackImage = false;
  if (icon.isEmpty()) {
    const fallbackPath = path.join(__dirname, 'resources', 'icon.png');
    log.error('[main] Failed to load tray icon, using app icon fallback:', { trayPath, fallbackPath });
    icon = nativeImage.createFromPath(fallbackPath);
    usesTemplateImage = false;
    usesFallbackImage = true;
  }
  if (icon.isEmpty()) {
    log.error('[main] Failed to load both the Tray icon and its fallback:', trayPath);
    return;
  }

  if (usesTemplateImage) {
    icon.setTemplateImage(true);
    runtimeIconState.trayTemplateImage = true;
  } else if (process.platform === 'linux' || usesFallbackImage) {
    icon = icon.resize({ width: 16, height: 16 });
  }
  tray = new Tray(icon);
  tray.setToolTip('Banana Slides');
  updateTrayContextMenu();
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

function updateTrayContextMenu() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: translate('tray.showMainWindow'), click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { type: 'separator' },
    { label: translate('tray.quit'), click: () => { isQuitting = true; app.quit(); } },
  ]));
}

function sendUpdateState(state) {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) return;
  mainWindow.webContents.send('update-status-changed', state);
}

async function installDownloadedUpdate() {
  if (!desktopAutoUpdater?.isUpdateDownloaded()) {
    return { success: false, error: 'UPDATE_NOT_DOWNLOADED' };
  }

  isQuitting = true;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
  backendStopRequested = true;
  try {
    await pythonManager.stopBackend();
  } catch (error) {
    log.error('[main] Failed to stop backend before installing update:', error);
  }
  backendStopped = true;
  const started = desktopAutoUpdater.quitAndInstall();
  return { success: started };
}

async function showDownloadedUpdateDialog(checkResult) {
  const version = checkResult.update.version;
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: translate('update.downloaded.title'),
    message: translate('update.downloaded.message', { version }),
    detail: translate('update.downloaded.detail'),
    buttons: [
      translate('update.downloaded.restart'),
      translate('update.downloaded.later'),
    ],
    defaultId: 0,
    cancelId: 1,
  });
  if (result.response === 0) {
    await installDownloadedUpdate();
  }
}

async function showManualUpdateDialog() {
  try {
    const checkResult = await desktopAutoUpdater.checkForUpdates();
    if (checkResult.status === 'update_downloaded') {
      await showDownloadedUpdateDialog(checkResult);
      return;
    }

    if (checkResult.update) {
      const primaryAction = checkResult.canAutoUpdate
        ? translate('update.available.download')
        : translate('update.available.openDownload');
      const releaseNotes = checkResult.update.notes.trim();
      const result = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: translate('update.available.title'),
        message: translate('update.available.message', { version: checkResult.update.version }),
        ...(releaseNotes ? { detail: releaseNotes.substring(0, 300) } : {}),
        buttons: [
          primaryAction,
          translate('update.available.changelog'),
          translate('update.available.later'),
        ],
        defaultId: 0,
        cancelId: 2,
      });
      if (result.response === 0) {
        if (checkResult.canAutoUpdate) {
          const downloadedState = await desktopAutoUpdater.downloadUpdate();
          if (downloadedState.status === 'update_downloaded') {
            await showDownloadedUpdateDialog(downloadedState);
          }
        } else {
          await shell.openExternal(checkResult.update.url);
        }
      } else if (result.response === 1) {
        await shell.openExternal(checkResult.update.url);
      }
      return;
    }

    await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: translate('update.upToDate.title'),
      message: translate('update.upToDate.message'),
    });
  } catch (error) {
    log.error('[main] Failed to check for updates:', error);
    await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: translate('update.error.title'),
      message: translate('update.error.message'),
    });
  }
}

function createAppMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { label: translate('menu.mac.about'), role: 'about' },
        { type: 'separator' },
        { label: translate('menu.mac.hide'), role: 'hide' },
        { label: translate('menu.mac.hideOthers'), role: 'hideOthers' },
        { label: translate('menu.mac.showAll'), role: 'unhide' },
        { type: 'separator' },
        { label: translate('menu.mac.quit'), role: 'quit' },
      ],
    }] : []),
    {
      label: translate('menu.file.label'),
      submenu: [
        ...(!isMac ? [
          { type: 'separator' },
          { label: translate('menu.file.quit'), role: 'quit' },
        ] : [
          { label: translate('menu.file.closeWindow'), role: 'close' },
        ]),
      ],
    },
    {
      label: translate('menu.edit.label'),
      submenu: [
        { label: translate('menu.edit.undo'), role: 'undo' },
        { label: translate('menu.edit.redo'), role: 'redo' },
        { type: 'separator' },
        { label: translate('menu.edit.cut'), role: 'cut' },
        { label: translate('menu.edit.copy'), role: 'copy' },
        { label: translate('menu.edit.paste'), role: 'paste' },
        { label: translate('menu.edit.selectAll'), role: 'selectAll' },
      ],
    },
    {
      label: translate('menu.view.label'),
      submenu: [
        { label: translate('menu.view.zoomIn'), role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
        { label: translate('menu.view.zoomOut'), role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { label: translate('menu.view.resetZoom'), role: 'resetZoom', accelerator: 'CmdOrCtrl+0' },
        { type: 'separator' },
        { label: translate('menu.view.fullscreen'), role: 'togglefullscreen' },
        { type: 'separator' },
        { label: translate('menu.view.reload'), role: 'reload' },
        { label: translate('menu.view.forceReload'), role: 'forceReload' },
        { label: translate('menu.view.devTools'), role: 'toggleDevTools' },
      ],
    },
    {
      label: translate('menu.window.label'),
      submenu: [
        { label: translate('menu.window.minimize'), role: 'minimize' },
        ...(isMac ? [
          { type: 'separator' },
          { label: translate('menu.window.front'), role: 'front' },
        ] : [
          { label: translate('menu.window.close'), role: 'close' },
        ]),
      ],
    },
    {
      label: translate('menu.help.label'),
      submenu: [
        {
          label: translate('menu.help.checkForUpdates'),
          click: showManualUpdateDialog,
        },
        { type: 'separator' },
        {
          label: translate('menu.help.about'),
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: translate('about.title'),
              message: translate('about.message', { version: app.getVersion() }),
              detail: translate('about.detail'),
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function setupIPC() {
  ipcMain.handle('get-app-version', () => app.getVersion());
  ipcMain.handle('get-backend-port', () => pythonManager.getPort());
  ipcMain.handle('check-for-updates', () => desktopAutoUpdater.checkForUpdates());
  ipcMain.handle('get-update-state', () => desktopAutoUpdater.getState());
  ipcMain.handle('get-auto-update-settings', () => desktopAutoUpdater.getSettings());
  ipcMain.handle('set-automatic-updates-enabled', (_, enabled) => (
    desktopAutoUpdater.setAutomaticUpdatesEnabled(enabled)
  ));
  ipcMain.handle('download-update', () => desktopAutoUpdater.downloadUpdate());
  ipcMain.handle('install-update', () => installDownloadedUpdate());
  ipcMain.handle('set-locale', (_, locale) => applyLocale(locale));
  ipcMain.handle('open-external', (_, url) => {
    try {
      const parsedUrl = new URL(url);
      if (['http:', 'https:'].includes(parsedUrl.protocol)) {
        return shell.openExternal(url);
      }
    } catch (e) {
      log.error('[main] Invalid URL for open-external:', url);
    }
  });

  ipcMain.on('window-minimize', () => { mainWindow?.minimize(); });
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window-close', () => { mainWindow?.close(); });

  ipcMain.on('zoom-in', () => {
    const wc = mainWindow?.webContents;
    if (wc) wc.setZoomLevel(wc.getZoomLevel() + 0.5);
  });
  ipcMain.on('zoom-out', () => {
    const wc = mainWindow?.webContents;
    if (wc) wc.setZoomLevel(wc.getZoomLevel() - 0.5);
  });
  ipcMain.on('zoom-reset', () => {
    mainWindow?.webContents?.setZoomLevel(0);
  });
  ipcMain.handle('get-zoom-level', () => {
    return mainWindow?.webContents?.getZoomLevel() ?? 0;
  });

  ipcMain.handle('get-data-storage-info', async () => {
    const inspection = await inspectDataRoot(activeDataRoot);
    return {
      dataRoot: inspection.dataRoot,
      isDefault: activeDataRootIsDefault,
      hasDatabase: inspection.hasDatabase,
      configurable: !isDev(),
    };
  });
  ipcMain.handle('choose-data-storage-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: translate('storage.chooseTitle'),
      defaultPath: activeDataRoot,
      properties: ['openDirectory', 'createDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('inspect-data-storage-directory', (_, dataRoot) => inspectDataRoot(dataRoot));
  ipcMain.handle('open-data-storage-directory', async () => {
    const error = await shell.openPath(activeDataRoot);
    return error ? { success: false, error } : { success: true };
  });
  ipcMain.handle('apply-data-storage-directory', async (_, dataRoot, allowInitialize = false) => {
    if (isDev()) {
      const error = new Error('DATA_STORAGE_UNAVAILABLE_IN_DEV: Data storage location is managed by the external development backend.');
      error.code = 'DATA_STORAGE_UNAVAILABLE_IN_DEV';
      throw error;
    }
    const inspection = await prepareDataRoot(dataRoot, allowInitialize);
    await writeStorageConfig(app.getPath('userData'), inspection.dataRoot);
    setTimeout(async () => {
      isQuitting = true;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
      }
      backendStopRequested = true;
      try {
        await pythonManager.stopBackend();
      } catch (error) {
        log.error('[main] Failed to stop backend during data storage restart:', error);
      }
      backendStopped = true;
      app.relaunch();
      app.exit(0);
    }, 100);
    return { success: true, restarting: true };
  });

  ipcMain.handle('download-file', async (_, { url, filename }) => {
    const currentWindow = mainWindow;
    if (!currentWindow || currentWindow.isDestroyed()) return { success: false };
    const ext = (filename || 'file').split('.').pop() || '*';
    const downloadUrl = createUniqueDownloadUrl(url);
    const { filePath: savePath, canceled } = await dialog.showSaveDialog(currentWindow, {
      defaultPath: filename || 'download',
      filters: [{ name: translate('download.allFiles'), extensions: [ext, '*'] }],
    });
    if (canceled || !savePath) return { success: false, canceled: true };
    if (currentWindow.isDestroyed()) return { success: false };
    const localExportPath = await resolveLocalExportPath(downloadUrl, activeDataRoot);
    if (currentWindow.isDestroyed()) return { success: false };
    const result = localExportPath
      ? await copyLocalExportToPath(localExportPath, savePath)
      : await downloadToPath({
          downloadSession: currentWindow.webContents.session,
          downloadUrl,
          savePath,
          currentWindow,
        });
    if (!result.success) {
      log.error('[main] Download failed:', { url: downloadUrl, savePath, ...result });
      if (!currentWindow.isDestroyed()) {
        const localizedError = {
          interrupted: translate('download.error.interrupted'),
          timeout: translate('download.error.timeout'),
          missing: translate('download.error.missing'),
          empty: translate('download.error.empty'),
          failed: translate('download.error.failed'),
          cancelled: translate('download.error.cancelled'),
        }[result.state] || result.error || translate('download.error.fallback');
        await dialog.showMessageBox(currentWindow, {
          type: 'error',
          title: translate('download.dialog.title'),
          message: translate('download.dialog.message'),
          detail: translate('download.dialog.detail', {
            error: localizedError,
            destination: savePath,
          }),
        });
      }
    } else {
      log.info('[main] Download completed:', result.filePath);
    }
    return result;
  });
}

async function selectRecoveryDataRoot(startupError) {
  let error = startupError;
  let skipErrorDialog = false;
  while (true) {
    const parentWindow = splashWindow && !splashWindow.isDestroyed() ? splashWindow : null;
    if (!skipErrorDialog) {
      const choice = await dialog.showMessageBox(parentWindow, {
        type: 'error',
        title: translate('storage.recovery.title'),
        message: translate('storage.recovery.message'),
        detail: error.message,
        buttons: [
          translate('storage.recovery.chooseOther'),
          translate('storage.recovery.quit'),
        ],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
      });
      if (choice.response !== 0) return null;
    }
    skipErrorDialog = false;

    const selection = await dialog.showOpenDialog(parentWindow, {
      title: translate('storage.chooseTitle'),
      properties: ['openDirectory', 'createDirectory'],
    });
    if (selection.canceled || !selection.filePaths[0]) {
      error = new Error(translate('storage.recovery.noSelection'));
      continue;
    }
    try {
      const inspection = await inspectDataRoot(selection.filePaths[0]);
      if (!inspection.hasDatabase) {
        const confirmation = await dialog.showMessageBox(parentWindow, {
          type: 'warning',
          title: translate('storage.confirm.title'),
          message: translate('storage.confirm.message'),
          detail: translate('storage.confirm.detail'),
          buttons: [
            translate('storage.confirm.use'),
            translate('storage.confirm.chooseOther'),
          ],
          defaultId: 1,
          cancelId: 1,
          noLink: true,
        });
        if (confirmation.response !== 0) {
          skipErrorDialog = true;
          continue;
        }
      }
      const prepared = await prepareDataRoot(inspection.dataRoot, !inspection.hasDatabase);
      await writeStorageConfig(app.getPath('userData'), prepared.dataRoot);
      return { ...prepared, isDefault: false };
    } catch (nextError) {
      error = nextError;
    }
  }
}

async function bootstrap() {
  initializeLocale();
  createSplashWindow();
  createMainWindow();
  createTray();

  try {
    desktopAutoUpdater = new DesktopAutoUpdateManager({
      app,
      updater: electronAutoUpdater,
      CancellationToken,
      logger: log,
      canAutoUpdate: detectAutoUpdateSupport({ app }),
    });
    await desktopAutoUpdater.initialize();
    desktopAutoUpdater.subscribe(sendUpdateState);
    createAppMenu();
    setupIPC();

    let storageInfo;
    try {
      storageInfo = await initializeDataRoot(app.getPath('userData'));
    } catch (error) {
      log.error('[main] Configured data storage location is unavailable:', error);
      storageInfo = await selectRecoveryDataRoot(error);
      if (!storageInfo) {
        isQuitting = true;
        app.quit();
        return;
      }
    }
    activeDataRoot = storageInfo.dataRoot;
    activeDataRootIsDefault = storageInfo.isDefault;

    const port = await pythonManager.startBackend(activeDataRoot);
    await pythonManager.waitForBackend(port);

    if (isDev()) {
      mainWindow.loadURL(`http://localhost:${process.env.FRONTEND_PORT || 3000}?backendPort=${port}`);
    } else {
      mainWindow.loadFile(path.join(process.resourcesPath, 'frontend', 'index.html'), {
        query: { backendPort: String(port) },
      });
    }
    if (!isSmokeMode()) {
      desktopAutoUpdater.startAutomaticChecks();
    }
  } catch (err) {
    log.error('[main] Startup failed:', err);
    if (splashWindow) splashWindow.close();
    dialog.showErrorBox(
      translate('startup.errorTitle'),
      translate('startup.backendError', { detail: err.message }),
    );
    app.quit();
  }
}

configureSmokeUserDataPath();
app.whenReady().then(bootstrap);
if (process.platform === 'win32') {
  app.setAppUserModelId('com.banana.slides');
}

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('before-quit', (event) => {
  isQuitting = true;
  if (backendStopped) return;

  event.preventDefault();
  if (backendStopRequested) return;
  backendStopRequested = true;

  pythonManager.stopBackend().finally(() => {
    backendStopped = true;
    if (desktopAutoUpdater?.shouldInstallOnQuit()) {
      desktopAutoUpdater.quitAndInstall();
    } else {
      app.quit();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // On Windows/Linux, closing all windows doesn't quit (tray keeps running)
  }
});
