const { contextBridge, ipcRenderer } = require('electron');

// BEGIN ELECTRON API
// END ELECTRON API

contextBridge.exposeInMainWorld('electronAPI', createElectronAPI({
  ipcRenderer,
  platform: process.platform,
  getLocationSearch: () => window.location.search,
}));
