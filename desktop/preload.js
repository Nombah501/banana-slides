const { contextBridge, ipcRenderer } = require('electron');
const { createElectronAPI } = require('./electron-api');

contextBridge.exposeInMainWorld('electronAPI', createElectronAPI({
  ipcRenderer,
  platform: process.platform,
  getLocationSearch: () => window.location.search,
}));
