const assert = require('node:assert/strict');
const test = require('node:test');

const { createElectronAPI } = require('./electron-api');

test('preload bridge sends locale changes through the locale IPC channel', async () => {
  const invocations = [];
  const ipcRenderer = {
    invoke: (channel, ...args) => {
      invocations.push({ channel, args });
      return Promise.resolve('ru');
    },
    send: () => {},
    on: () => {},
    removeListener: () => {},
  };
  const api = createElectronAPI({
    ipcRenderer,
    platform: 'linux',
    getLocationSearch: () => '?backendPort=15777',
  });

  assert.equal(await api.setLocale('ru'), 'ru');
  assert.deepEqual(invocations, [{ channel: 'set-locale', args: ['ru'] }]);
  assert.equal(api.getBackendPort(), '15777');
  assert.equal(api.getPlatform(), 'linux');
});
