# Phase 1.5 Fork Infrastructure Report

## Result

Phase 1.5 is implemented on branch `phase1-ru-content`, based on `v0.9.0-rc.7`. Goals A, B, and C are complete locally. No GitHub write, release publication, workflow trigger, host installation mutation, or `git push` was performed.

## Diff summary

Excluding the pre-existing user modification to `uv.lock`, this work changes **18 tracked files: 572 insertions and 102 deletions**, plus these new deliverables:

- `scripts/sync-upstream.sh` — 99 lines.
- `FORK.md` — 49 lines.
- `RELEASE.md` — 90 lines.
- `docs/product/phase15-fork-infra/plan.md` — 40 lines.
- Six local evidence logs under `artifacts/`.
- This report.

The tracked source/test changes are:

- `.env.example`, `.gitignore`
- `backend/app.py`, `backend/config.py`, `backend/README.md`, `backend/tests/unit/test_app_factory.py`
- `desktop/auto-updater.js`, `auto-updater.test.js`
- `desktop/github-release-client.js`, `github-release-client.test.js`
- `desktop/package.json`, `desktop/python-manager.js`
- `desktop/scripts/check-auto-update-contract.test.js`
- `desktop/storage-config.test.js`, `desktop/update-policy.js`
- `desktop/update-settings.js`, `desktop/update-settings.test.js`

`uv.lock` remains user-owned and was not edited by this work.

## Goal A — Linux read-only AppImage install fix

### Root cause

`backend/config.py` originally hard-coded the default SQLite database to `<backend>/instance/database.db`. `backend/app.py:create_app()` then unconditionally executed `os.makedirs(<backend>/instance)` before applying the shell's `DATABASE_PATH`, `UPLOAD_FOLDER`, and `EXPORT_FOLDER` overrides. In an AppImage, `<backend>` is under the read-only mounted bundle, so startup failed with `OSError: [Errno 30] Read-only file system` before Flask could announce a port.
In the frozen PyInstaller layout, the same resolution becomes `<bundle>/resources/backend/_internal/instance`, which is the reported live failure.

`desktop/storage-config.js` already chooses Electron `userData` or the selected installer data root. `desktop/python-manager.js:startBackend()` already derived writable `data`, `uploads`, and `exports` paths and passed `DATABASE_PATH`, `UPLOAD_FOLDER`, and `EXPORT_FOLDER`; it did not pass an instance path.

### Fix

- `backend/config.py:resolve_instance_path()` now resolves, in order:
  1. explicit `INSTANCE_PATH`;
  2. the parent directory of `DATABASE_PATH` supplied by the desktop shell;
  3. `${XDG_DATA_HOME:-~/.local/share}/banana-slides`.
- The default SQLite and upload paths use that resolved writable directory.
- `backend/app.py:create_app()` creates only the resolved instance path, database parent, and explicit upload/export paths. It no longer creates `<bundle>/backend/instance` or the repository-root upload directory.
- `desktop/python-manager.js` passes `INSTANCE_PATH` alongside the existing writable paths.
- `backend/README.md` documents the new path contract.

### Regression coverage

`backend/tests/unit/test_app_factory.py` covers explicit-path precedence and a read-only bundle layout with XDG fallback. `backend/tests/unit/test_desktop_backend_startup.py` continues to boot the packaged-style backend from a non-backend cwd with a writable database path. `desktop/storage-config.test.js` asserts that the desktop handoff includes `INSTANCE_PATH`.

### Read-only boot evidence

The smoke run copied the backend into a temporary bundle-style directory, removed write permission from the bundle, passed writable data paths, started with `BACKEND_PORT=0`, observed the announced port, and queried `/health`:

```text
$ cp -a /workspace/banana-slides-ru/backend /tmp/banana-readonly-bundle-z_usx07q/bundle/resources/backend
$ chmod -R a-w /tmp/banana-readonly-bundle-z_usx07q/bundle
$ PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=/tmp/banana-readonly-bundle-z_usx07q/bundle/resources/backend INSTANCE_PATH=/tmp/banana-readonly-bundle-z_usx07q/data/data DATABASE_PATH=/tmp/banana-readonly-bundle-z_usx07q/data/data/database.db UPLOAD_FOLDER=/tmp/banana-readonly-bundle-z_usx07q/data/uploads EXPORT_FOLDER=/tmp/banana-readonly-bundle-z_usx07q/data/exports BACKEND_PORT=0 FLASK_ENV=production USE_MOCK_AI=true python3 /tmp/banana-readonly-bundle-z_usx07q/bundle/resources/backend/app.py
LISTENING_ON:41467
health: HTTP 200 {"message":"Banana Slides API is running","status":"ok"}
bundle instance exists: False
writable database exists: True
```

Full output, including the non-fatal pydub/ffmpeg warning, is in `artifacts/read-only-bundle-boot.log`.

## Goal B — upstream tracking

Configured local remote:

```text
https://github.com/Anionex/banana-slides.git
```

`git fetch upstream --tags` completed successfully. `scripts/sync-upstream.sh`:

- requires a checked-out branch and a clean tree for real merges;
- fetches upstream tags and selects the newest semantic `v*` release tag with `sort -V`;
- supports `--dry-run` without merging or editing `FORK.md`;
- merges with `--no-edit` on a real run;
- captures unmerged paths, aborts the merge, and prints conflict guidance on failure;
- records `Synced upstream base: <tag>` in `FORK.md` only after a successful merge or no-op.

Dry-run evidence against the fetched upstream tags:

```text
Fetching tags from upstream (https://github.com/Anionex/banana-slides.git)
Current branch: phase1-ru-content
Newest upstream release tag: v0.9.0-rc.7
Upstream tag v0.9.0-rc.7 is already contained in HEAD; merge is a no-op.
[dry-run] No merge and no FORK.md change required.
```

Full output is in `artifacts/sync-upstream-dry-run.log`. Policy, Phase 1 ownership files, cadence, conflict playbook, and post-sync release flow are in `FORK.md`.

## Goal C — working fork-directed in-app updates

### Existing update flow before this change

- `desktop/auto-updater.js` had `REPO_OWNER = 'Anionex'` and `REPO_NAME = 'banana-slides'` hard-coded.
- The manager initialized electron-updater, disabled automatic download/install-on-quit, and scheduled an initial check after **5 seconds** plus a **6-hour** interval.
- Packaged AppImage/Windows/stably signed macOS builds asked electron-updater for updates. Debian packages used release notifications because in-place replacement is disabled.
- `desktop/update-policy.js` strips a leading `v`, compares semver, keeps prerelease updates on a prerelease channel, and selects releases containing a current-platform asset. Same-version rebuilds can be offered when release/build timestamps show a newer build.
- `desktop/github-release-client.js` paginated `GET /repos/<owner>/<repo>/releases`, with a `User-Agent`, and the fallback selected a release page URL. A 403 escaped as an update-check error.
- A supported AppImage download was installed on quit through electron-updater's `quitAndInstall`; `main.js` stops the backend before calling it. The generated feed metadata must be shipped with the release.

### Changes

- `desktop/update-settings.js` now persists and validates `updateRepository: { owner, name }`, preserving backward compatibility for old toggle-only settings. Missing/invalid values default to the package's `updateRepository`, which remains `Anionex/banana-slides` in source.
- `desktop/package.json` carries that build-time repository field. The adapted release workflow derives `${{ github.repository }}` and patches the package metadata plus builder `publish.owner/repo` in the CI checkout, so a fork build points at its own feed without a source edit.
- `DesktopAutoUpdateManager` calls `setFeedURL({ provider: 'github', owner, repo })` at initialization and keeps the configured repository when toggling automatic updates. Release URLs use the selected repository.
- GitHub API requests continue to use the existing User-Agent and now pass `GITHUB_TOKEN` when present. No token is logged or persisted.
- `desktop/github-release-client.js` attaches HTTP status codes to errors, recognizes 403/429 rate-limit forms, and falls back only for those statuses to `https://github.com/<owner>/<repo>/releases.atom`.
- The minimal Atom parser maps title, release link/tag, published/updated date, summary, and a source marker. Atom has no asset list, so Atom-discovered updates are manual (`canAutoUpdate: false`) and open the release page. The policy still compares the mapped tag correctly.
- The manager also invokes the release fallback when packaged electron-updater itself fails with a 403/429, rather than surfacing the rate-limit error as the terminal state.
- `RELEASE.md` specifies versioning, feed configuration, AppImage/latest-linux.yml asset pairing, build commands, and release checklist. The existing release workflow was adapted; no new pipeline was invented.

### Update evidence

Unit coverage includes API-403-to-Atom fallback, Atom tag/version selection, 403/429 error recognition, configured feed URL, configured fork release URL, persisted repository normalization, and rate-limited packaged updater recovery. All desktop tests pass. A live read-only GET smoke against the upstream Atom endpoint parsed 9 releases and mapped the first tag/link/date:

```text
{"count":9,"first":{"tag_name":"v0.9.0-rc.7","hasLink":true,"published_at":"2026-09-08T09:57:43Z"}}
```

Evidence is in `artifacts/atom-live-smoke.log`.

## Verification

Passed:

```text
cd desktop && npm test
# tests 83
# pass 83
# fail 0

uv run --index-url https://pypi.org/simple pytest backend/tests/unit/test_app_factory.py backend/tests/unit/test_desktop_backend_startup.py -q
# 17 passed, 2 warnings

uv run --index-url https://pypi.org/simple pytest backend/tests/unit -q
# 705 passed, 5 skipped, 326 warnings

node --check auto-updater.js && node --check github-release-client.js && node --check update-settings.js
bash -n scripts/sync-upstream.sh
python3 -m py_compile backend/config.py backend/app.py backend/tests/unit/test_app_factory.py
git diff --check
```

Logs:

- `artifacts/desktop-npm-test.log`
- `artifacts/backend-phase15-tests.log`
- `artifacts/backend-phase15-unit-tests.log`
- `artifacts/read-only-bundle-boot.log`
- `artifacts/sync-upstream-dry-run.log`
- `artifacts/atom-live-smoke.log`

The first backend dependency attempt used the configured mirror and hit HTTP 403 while fetching a wheel; the successful reruns explicitly used `https://pypi.org/simple`. Desktop dependencies were installed locally with `npm ci --ignore-scripts`; no application build or publish was run.

## Review, risks, and deviations

Review found no unresolved correctness, security, or release blocker in the changed path. The token path is optional and secret-free in logs; repository components reject slash/path traversal characters. The existing `uv.lock` modification was observed as user work and left untouched.

Remaining risks:

- No public fork owner/name was supplied. Source defaults intentionally remain upstream. The CI workflow derives the actual fork slug, while local builds must set the package/builder repository as documented in `RELEASE.md`.
- Atom fallback cannot enumerate platform assets or download metadata; it deliberately provides a manual release-page update, not an automatic self-replacement. A fork release must attach the matching AppImage and `latest-linux.yml` for electron-updater to self-update.
- Full electron-builder/AppImage packaging was not run because it is stretch scope and may download large/rate-limited Electron dependencies. The read-only backend boot was exercised directly from a bundle-style layout.
- The live Atom smoke used the upstream public feed because the fork has not yet been published; configured-fork behavior is covered with deterministic mocks.
- Backend tests retain their existing warnings, including the non-fatal ffmpeg warning in the boot smoke.

## Phase 2 remaining work

- Publish/create the public fork repository and set its permanent owner/name.
- Run and review the complete desktop release pipeline, produce and attach signed platform artifacts, and publish the first fork release only with authorization.
- Perform host acceptance on a real AppImage mount, including electron-updater self-replacement from a fork release.
- Complete UI localization and locale migration; Phase 1.5 intentionally changes no UI strings.

## State

`READY_FOR_RELEASE` — implementation, review, focused/full local tests, read-only backend boot, Atom fallback smoke, and upstream dry-run evidence are complete. No release was published or triggered.
