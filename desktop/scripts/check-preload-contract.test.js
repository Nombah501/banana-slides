const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');

const desktopDir = path.resolve(__dirname, '..');
const preloadPath = path.join(desktopDir, 'preload.js');
const builderConfigPath = path.join(desktopDir, 'electron-builder.yml');
const requirePattern = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function readPreload() {
  return fs.readFileSync(preloadPath, 'utf8');
}

test('sandbox preload only requires Electron built-ins', () => {
  const requests = [...readPreload().matchAll(requirePattern)].map((match) => match[1]);
  assert.deepEqual(requests, ['electron']);
});

test('committed preload matches the generator output', () => {
  const result = spawnSync(process.execPath, ['scripts/sync-preload.js', '--check'], {
    cwd: desktopDir,
    encoding: 'utf8',
  });

  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('packaging includes both preload entry points', () => {
  const builderConfig = yaml.load(fs.readFileSync(builderConfigPath, 'utf8'));
  for (const entryPoint of ['preload.js', 'electron-api.js']) {
    assert.ok(builderConfig.files.includes(entryPoint), `${entryPoint} must be included in app.asar`);
  }
});
