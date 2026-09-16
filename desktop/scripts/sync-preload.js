#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const desktopDir = path.resolve(__dirname, '..');
const templatePath = path.join(desktopDir, 'preload.template.js');
const apiPath = path.join(desktopDir, 'electron-api.js');
const outputPath = path.join(desktopDir, 'preload.js');
const beginMarker = '// BEGIN ELECTRON API';
const endMarker = '// END ELECTRON API';

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function generatePreload() {
  const template = readUtf8(templatePath);
  const apiSource = readUtf8(apiPath).trim();
  const beginIndex = template.indexOf(beginMarker);
  const endIndex = template.indexOf(endMarker);

  if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
    throw new Error(`Template must contain ordered ${beginMarker} and ${endMarker} markers`);
  }
  if (template.indexOf(beginMarker, beginIndex + beginMarker.length) !== -1) {
    throw new Error(`Template must contain exactly one ${beginMarker} marker`);
  }
  if (template.indexOf(endMarker, endIndex + endMarker.length) !== -1) {
    throw new Error(`Template must contain exactly one ${endMarker} marker`);
  }

  const beforeMarker = template.slice(0, beginIndex + beginMarker.length);
  const afterMarker = template.slice(endIndex);
  return `${beforeMarker}\n${apiSource}\n${afterMarker}`;
}

function main() {
  const generated = generatePreload();
  if (process.argv.includes('--check')) {
    const current = readUtf8(outputPath);
    if (current !== generated) {
      process.stderr.write(`Generated preload is out of date: ${outputPath}\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`Preload is up to date: ${outputPath}\n`);
    return;
  }

  fs.writeFileSync(outputPath, generated, 'utf8');
  process.stdout.write(`Wrote ${outputPath}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { generatePreload };
