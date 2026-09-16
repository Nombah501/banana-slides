const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  fetchGitHubReleases,
  isRateLimitedError,
  parseAtomReleases,
} = require('./github-release-client');
const { selectLatestDesktopRelease } = require('./update-policy');

test('packages the GitHub release client with the desktop application', () => {
  const builderConfig = fs.readFileSync(path.join(__dirname, 'electron-builder.yml'), 'utf8');
  assert.match(builderConfig, /- "github-release-client\.js"/);
});

test('paginates until GitHub returns a partial release page', async () => {
  const calls = [];
  const fullPage = Array.from({ length: 3 }, (_, index) => ({ id: index + 1 }));
  const finalPage = [{ id: 4 }];
  const releases = await fetchGitHubReleases('Anionex', 'banana-slides', {
    perPage: 3,
    fetchPage: async (requestPath, options) => {
      calls.push({ requestPath, options });
      return calls.length === 1 ? fullPage : finalPage;
    },
    userAgent: 'pagination-test',
  });

  assert.deepEqual(releases, [...fullPage, ...finalPage]);
  assert.deepEqual(calls, [
    {
      requestPath: '/repos/Anionex/banana-slides/releases?per_page=3&page=1',
      options: { userAgent: 'pagination-test' },
    },
    {
      requestPath: '/repos/Anionex/banana-slides/releases?per_page=3&page=2',
      options: { userAgent: 'pagination-test' },
    },
  ]);
});

test('rejects malformed release pages instead of reporting the app current', async () => {
  await assert.rejects(
    fetchGitHubReleases('Anionex', 'banana-slides', {
      fetchPage: async () => ({ message: 'rate limited' }),
    }),
    /invalid releases response/,
  );
});

test('uses the Atom feed when the GitHub releases API is rate limited', async () => {
  const calls = [];
  const atom = `<?xml version="1.0"?>
    <feed>
      <entry>
        <title>Banana Slides v0.9.0-rc.7-ru.1</title>
        <link rel="alternate" href="https://github.com/ForkOwner/banana-slides-ru/releases/tag/v0.9.0-rc.7-ru.1"/>
        <updated>2026-09-15T12:00:00Z</updated>
      </entry>
    </feed>`;
  const releases = await fetchGitHubReleases('ForkOwner', 'banana-slides-ru', {
    fetchPage: async () => {
      const error = new Error('GitHub API returned HTTP 403');
      error.statusCode = 403;
      throw error;
    },
    fetchAtom: async (owner, repository, options) => {
      calls.push({ owner, repository, options });
      return parseAtomReleases(atom);
    },
    userAgent: 'atom-fallback-test',
  });

  assert.deepEqual(calls, [{
    owner: 'ForkOwner',
    repository: 'banana-slides-ru',
    options: { userAgent: 'atom-fallback-test' },
  }]);
  assert.equal(releases[0].tag_name, 'v0.9.0-rc.7-ru.1');
  assert.equal(releases[0].source, 'atom');
  assert.equal(
    selectLatestDesktopRelease(releases, '0.9.0-rc.7', 'linux', 'x64').tag_name,
    'v0.9.0-rc.7-ru.1',
  );
});

test('recognizes both GitHub rate-limit status forms', () => {
  assert.equal(isRateLimitedError(new Error('HttpError: 403')), true);
  assert.equal(isRateLimitedError({ statusCode: 429 }), true);
  assert.equal(isRateLimitedError(new Error('HttpError: 404')), false);
});
