const assert = require('node:assert/strict');
const test = require('node:test');

const {
  parseChecksumForAsset,
  windowsFfmpegArchive,
} = require('./prepare-artifacts');

const archiveName = 'ffmpeg-n8.1-latest-win64-gpl-8.1.zip';
const archiveSha256 = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

test('parseChecksumForAsset returns the hash for an exact asset name', () => {
  const checksums = [
    `${'a'.repeat(64)}  ffmpeg-n8.1-latest-win32-gpl-8.1.zip`,
    `${archiveSha256.toUpperCase()} *${archiveName}`,
    `${'b'.repeat(64)}  ffmpeg-n8.1-latest-win64-gpl-shared-8.1.zip`,
  ].join('\n');

  assert.equal(parseChecksumForAsset(checksums, archiveName), archiveSha256);
  assert.equal(parseChecksumForAsset(checksums, 'ffmpeg-n8.1-latest-win64-gpl-8.1.zip.backup'), null);
});

test('rolling Windows FFmpeg uses the latest 8.1 asset and checksum manifest', () => {
  assert.equal(
    windowsFfmpegArchive.url,
    'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n8.1-latest-win64-gpl-8.1.zip',
  );
  assert.equal(
    windowsFfmpegArchive.checksumsUrl,
    'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/checksums.sha256',
  );
  assert.equal('sha256' in windowsFfmpegArchive, false);
});
