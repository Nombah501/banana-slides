const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  DEFAULT_UPDATE_REPOSITORY,
  getUpdateSettingsPath,
  normalizeUpdateSettings,
  readUpdateSettings,
  writeUpdateSettings,
} = require('./update-settings');

async function createTempDirectory(t) {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'banana-update-settings-'));
  t.after(() => fs.promises.rm(directory, { recursive: true, force: true }));
  return directory;
}

test('enables automatic updates and uses upstream by default', async (t) => {
  const userDataPath = await createTempDirectory(t);

  assert.deepEqual(await readUpdateSettings(userDataPath), {
    automaticUpdatesEnabled: true,
    updateRepository: DEFAULT_UPDATE_REPOSITORY,
  });
});
test('persists the update repository with the automatic update preference', async (t) => {
  const userDataPath = await createTempDirectory(t);
  const updateRepository = { owner: 'example-owner', name: 'banana-slides-ru' };

  await writeUpdateSettings(userDataPath, {
    automaticUpdatesEnabled: false,
    updateRepository,
  });

  assert.deepEqual(await readUpdateSettings(userDataPath), {
    automaticUpdatesEnabled: false,
    updateRepository,
  });
  assert.deepEqual(
    JSON.parse(await fs.promises.readFile(getUpdateSettingsPath(userDataPath), 'utf8')),
    { automaticUpdatesEnabled: false, updateRepository },
  );
});

test('normalizes missing fields from older preference files', async (t) => {
  const userDataPath = await createTempDirectory(t);
  await fs.promises.writeFile(getUpdateSettingsPath(userDataPath), '{}\n', 'utf8');

  assert.deepEqual(await readUpdateSettings(userDataPath), {
    automaticUpdatesEnabled: true,
    updateRepository: DEFAULT_UPDATE_REPOSITORY,
  });
});

test('recovers from a malformed preference file without blocking app startup', async (t) => {
  const userDataPath = await createTempDirectory(t);
  await fs.promises.writeFile(getUpdateSettingsPath(userDataPath), '{broken json', 'utf8');

  assert.deepEqual(await readUpdateSettings(userDataPath), {
    automaticUpdatesEnabled: true,
    updateRepository: DEFAULT_UPDATE_REPOSITORY,
  });
});

test('rejects repository path components and falls back to upstream', () => {
  assert.deepEqual(
    normalizeUpdateSettings({
      updateRepository: { owner: 'attacker/example', name: '../releases' },
    }),
    {
      automaticUpdatesEnabled: true,
      updateRepository: DEFAULT_UPDATE_REPOSITORY,
    },
  );
});
