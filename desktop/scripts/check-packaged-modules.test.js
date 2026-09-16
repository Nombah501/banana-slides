const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');

const desktopDir = path.resolve(__dirname, '..');
const entryPoints = ['main.js', 'preload.js'];
const localRequirePattern = /require\(\s*['"](\.[^'"]*)['"]\s*\)/g;

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function resolveLocalModule(fromPath, request) {
  const requestedPath = normalizeRelativePath(path.normalize(path.join(path.dirname(fromPath), request)));
  const candidates = path.extname(requestedPath)
    ? [requestedPath]
    : [`${requestedPath}.js`, `${requestedPath}.json`, `${requestedPath}/index.js`];
  const resolvedPath = candidates.find((candidate) => {
    const fullPath = path.join(desktopDir, candidate);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
  });
  assert.ok(resolvedPath, `${fromPath} requires missing local module ${request}`);
  return resolvedPath;
}

test('packages every local module reachable from Electron entry points', () => {
  const builderConfig = yaml.load(fs.readFileSync(path.join(desktopDir, 'electron-builder.yml'), 'utf8'));
  const packagedFiles = new Set(builderConfig.files);
  const pending = [...entryPoints];
  const scanned = new Set();
  const dependencies = [];

  for (const entryPoint of entryPoints) {
    assert.ok(packagedFiles.has(entryPoint), `${entryPoint} must be included in the app.asar files list`);
  }

  while (pending.length > 0) {
    const modulePath = pending.shift();
    if (scanned.has(modulePath)) continue;
    scanned.add(modulePath);

    const source = fs.readFileSync(path.join(desktopDir, modulePath), 'utf8');
    for (const match of source.matchAll(localRequirePattern)) {
      const request = match[1];
      const resolvedPath = resolveLocalModule(modulePath, request);
      dependencies.push({ from: modulePath, request, resolvedPath });
      if (!scanned.has(resolvedPath)) pending.push(resolvedPath);
    }
  }

  for (const { from, request, resolvedPath } of dependencies) {
    assert.ok(
      packagedFiles.has(resolvedPath),
      `${from} requires ${request}; ${resolvedPath} must be included in the app.asar files list`,
    );
  }
});
