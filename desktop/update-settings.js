const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const packageConfig = require('./package.json');

const UPDATE_SETTINGS_FILENAME = 'update-settings.json';
const packageRepository = packageConfig.updateRepository || {};
const DEFAULT_UPDATE_REPOSITORY = Object.freeze({
  owner: typeof packageRepository.owner === 'string' && packageRepository.owner.trim()
    ? packageRepository.owner.trim()
    : 'Anionex',
  name: typeof packageRepository.name === 'string' && packageRepository.name.trim()
    ? packageRepository.name.trim()
    : 'banana-slides',
});
const REPOSITORY_COMPONENT_PATTERN = /^[A-Za-z0-9_.-]+$/;
const DEFAULT_UPDATE_SETTINGS = Object.freeze({
  automaticUpdatesEnabled: true,
  updateRepository: DEFAULT_UPDATE_REPOSITORY,
});

function getUpdateSettingsPath(userDataPath) {
  return path.join(userDataPath, UPDATE_SETTINGS_FILENAME);
}

function normalizeUpdateRepository(value) {
  const owner = typeof value?.owner === 'string' ? value.owner.trim() : '';
  const name = typeof value?.name === 'string'
    ? value.name.trim()
    : typeof value?.repo === 'string' ? value.repo.trim() : '';
  if (
    !owner
    || !name
    || !REPOSITORY_COMPONENT_PATTERN.test(owner)
    || !REPOSITORY_COMPONENT_PATTERN.test(name)
  ) {
    return { ...DEFAULT_UPDATE_REPOSITORY };
  }
  return { owner, name };
}

function normalizeUpdateSettings(value) {
  return {
    automaticUpdatesEnabled: value?.automaticUpdatesEnabled !== false,
    updateRepository: normalizeUpdateRepository(value?.updateRepository),
  };
}

async function readUpdateSettings(userDataPath) {
  const settingsPath = getUpdateSettingsPath(userDataPath);
  try {
    const raw = await fs.promises.readFile(settingsPath, 'utf8');
    return normalizeUpdateSettings(JSON.parse(raw));
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      return normalizeUpdateSettings(DEFAULT_UPDATE_SETTINGS);
    }
    throw error;
  }
}

async function writeUpdateSettings(userDataPath, settings) {
  const normalized = normalizeUpdateSettings(settings);
  const settingsPath = getUpdateSettingsPath(userDataPath);
  const temporaryPath = `${settingsPath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fs.promises.mkdir(userDataPath, { recursive: true });
  try {
    await fs.promises.writeFile(temporaryPath, `${JSON.stringify(normalized, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await fs.promises.rename(temporaryPath, settingsPath);
  } catch (error) {
    await fs.promises.rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
  return normalized;
}

module.exports = {
  DEFAULT_UPDATE_REPOSITORY,
  DEFAULT_UPDATE_SETTINGS,
  UPDATE_SETTINGS_FILENAME,
  getUpdateSettingsPath,
  normalizeUpdateRepository,
  normalizeUpdateSettings,
  readUpdateSettings,
  writeUpdateSettings,
};
