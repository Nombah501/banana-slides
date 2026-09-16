# Phase 1.5 Fork Infrastructure Plan

## Outcome and boundaries

Make the Linux desktop build boot from a read-only AppImage mount, keep the fork synchronized with upstream releases, and make in-app update checks usable for a configured fork repository. The work order is the approved scope.

In scope: writable backend instance/data resolution, Electron handoff, upstream remote and sync script, persisted update-repository configuration, GitHub API authentication and Atom fallback for 403/429, focused regression tests, release/update documentation, and local evidence. Non-goals: publishing or triggering GitHub workflows, changing the host installation, a full electron-builder build, a UI settings editor, and Phase 2 UI localization.

Acceptance boundary:

- A packaged-style backend never creates `backend/instance` or another path inside its read-only bundle; with the shell's writable database/data paths it creates its database and announces a port.
- `scripts/sync-upstream.sh --dry-run` fetches tags, identifies the newest upstream `v*` release, reports a no-op or planned merge without mutation, and real conflicts abort with a file report and guidance. Successful sync records the tag in `FORK.md`.
- The updater reads a validated repository from `update-settings.json`, defaults to `Anionex/banana-slides`, configures electron-updater at runtime, sends `GITHUB_TOKEN` when present, and uses `releases.atom` when the releases API returns HTTP 403/429. Atom tags participate in version comparison and manual release links.
- Focused backend/desktop tests and the read-only boot smoke command pass; no GitHub write occurs.

## Current system

- `backend/config.py` computes the default SQLite path under `backend/instance`.
- `backend/app.py:create_app` unconditionally creates `backend/instance` and repository-root `uploads` before applying `DATABASE_PATH`, `UPLOAD_FOLDER`, and `EXPORT_FOLDER`.
- `desktop/storage-config.js` selects Electron `userData` or an installer-configured data root; `desktop/python-manager.js:startBackend` passes `DATABASE_PATH`, `UPLOAD_FOLDER`, and `EXPORT_FOLDER` but not `INSTANCE_PATH`.
- `desktop/auto-updater.js` hardcodes `Anionex/banana-slides`, asks electron-updater first, and calls a GitHub releases API fallback for unsupported/same-version cases. `desktop/update-policy.js` compares normalized semver and requires a current-platform release asset.
- `desktop/update-settings.js` persists only the automatic-update toggle. `desktop/electron-builder.yml` publishes AppImage/deb with GitHub metadata for the upstream repository. `.github/workflows/release-desktop.yml` already builds and uploads the desktop artifacts.

## Approach and contracts

1. Add `resolve_instance_path()` in `backend/config.py`: `INSTANCE_PATH` (explicit) -> parent of `DATABASE_PATH` -> `${XDG_DATA_HOME:-~/.local/share}/banana-slides`. Use it for the default SQLite path and default upload location. `create_app` creates only that resolved writable path and explicit override parents. The desktop manager passes `INSTANCE_PATH` alongside existing data paths.
2. Extend update settings with a validated `{owner,name}` `updateRepository`, preserving the existing toggle and defaulting invalid/missing values to upstream. On initialization, call `updater.setFeedURL({provider: 'github', owner, repo: name})` when available. Pass repository and optional `GITHUB_TOKEN` to all API calls and build release URLs from that repository.
3. Add an HTTP-status-aware Atom client/parser in `desktop/github-release-client.js`. `fetchGitHubReleases` falls back only for API 403/429, maps Atom entries to release-like objects (`tag_name`, `html_url`, `published_at`, `assets: []`, source marker), and policy accepts the source marker because Atom cannot enumerate platform assets. The update remains manual (`canAutoUpdate: false`) and opens the release page.
4. Add a conflict-safe upstream script and document the Phase 1 file ownership, release cadence, conflict playbook, and release artifact contract. Keep builder targets unchanged; document the required fork owner/repo override before publishing because the final fork identity is not supplied by the work order.

## Verification and rollout

- Reproduce the original failure shape with a copied read-only bundle layout and writable XDG/data paths; observe `LISTENING_ON:<port>` and `/health` HTTP 200.
- Run desktop unit tests, backend app-factory/startup tests, and the Atom/version regression tests. Run the existing desktop contract checks.
- Run `scripts/sync-upstream.sh --dry-run`; capture stdout under `artifacts/`.
- Review the complete diff for scope, secret handling, path traversal, update fallback behavior, and release metadata. No migration is required. Rollback is a revert of the Phase 1.5 code/docs; leave fetched refs and the local upstream remote in place unless the operator explicitly removes them.

## Open decisions

None for implementation. The eventual public fork owner/name must be supplied when the fork repository is created; `update-settings.json` and the release checklist make that configuration explicit without a source edit.
