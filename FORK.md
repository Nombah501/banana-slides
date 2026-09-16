# Banana Slides RU Fork Policy

This checkout is the Phase 1 Russian-content fork. The working branch for this delivery is `phase1-ru-content`, based on upstream tag `v0.9.0-rc.7`. The local `upstream` remote must point to `https://github.com/Anionex/banana-slides.git`; the existing `origin` is left untouched and no push occurs in this work order.

Synced upstream base: `v0.9.0-rc.7`

## Phase 1 ownership

Phase 1 changes are the Russian output-language path and non-CJK prompt contract. Preserve these files during upstream merges unless the conflict is intentionally reconciled:

- `.env.example`
- `backend/app.py`, `backend/config.py`
- `backend/controllers/material_controller.py`, `backend/controllers/page_controller.py`, `backend/controllers/project_controller.py`, `backend/controllers/settings_controller.py`
- `backend/models/settings.py`
- `backend/services/ai_service.py`, `backend/services/file_parser_service.py`, `backend/services/prompts.py`, `backend/services/task_manager.py`, `backend/services/tts_video_service.py`
- `backend/tests/unit/test_api_project.py`, `test_content_language_prompts.py`, `test_description_field_contract.py`, `test_file_parser_service.py`, `test_image_prompt_ratio.py`, `test_style_from_content.py`
- `cli/banana_cli/commands/pages.py`, `commands/renovation.py`, `commands/workflows.py`, `jobs/interactive_builder.py`, `models.py`
- `frontend/src/api/endpoints.ts`, `frontend/src/types/index.ts`
- `docs/cli.mdx`, `docs/specs/cli-spec.md`, `docs/zh/cli.mdx`
- `scripts/job_templates/README.txt`

Phase 1.5 infrastructure additionally owns the desktop/backend paths and release/update documents introduced by this delivery; those files are likely to conflict with upstream desktop changes.

## Sync cadence and command

Run a dry run before each upstream release and at least once per release cycle:

```sh
scripts/sync-upstream.sh --dry-run
scripts/sync-upstream.sh
```

The script fetches upstream tags, selects the newest semantic `v*` release tag, merges it into the checked-out branch, and records the merged tag above. Dry runs do not merge or edit `FORK.md`; fetching refs is local repository maintenance. Do not run it with uncommitted changes. Review the merge and rerun the focused backend/desktop checks before starting the next fork release.

## Conflict playbook

1. Create a temporary recovery branch before resolving a conflict. Never force-reset or discard Phase 1 work.
2. Use `git status` and the script's conflicted-file report. The script aborts a failed merge automatically.
3. Resolve likely content conflicts by preserving the newer upstream bug/security fixes, then reapply the fork contract: `ru` remains a supported output language, `auto` remains explicit, model-facing prompts remain English-neutral/non-CJK for non-Chinese input, and canonical stored field names stay compatible.
4. Highest-risk files are `backend/services/prompts.py`, `backend/services/ai_service.py`, `backend/app.py`, language/settings controllers, CLI language choices, and frontend language types/options. Phase 1.5 conflicts are most likely in `desktop/auto-updater.js`, `desktop/update-settings.js`, `desktop/github-release-client.js`, `desktop/storage-config.js`, `desktop/python-manager.js`, and `desktop/electron-builder.yml`.
5. Run the focused prompt/language tests, backend app/startup tests, and all desktop tests. Inspect the diff and update the synced-base line only after the merge is known good.

## Release flow after a sync

1. Confirm the synced tag and branch diff; do not publish the merge automatically.
2. Choose a fork version such as `0.9.0-rc.7-ru.1`, update `desktop/package.json`, and configure the eventual fork owner/name in the packaged update settings or builder publish configuration as described in `RELEASE.md`.
3. Build and smoke-test the desktop artifacts locally or in the existing `.github/workflows/release-desktop.yml` workflow. The workflow is drafted for the fork but this work order does not trigger it.
4. Attach the AppImage, `latest-linux.yml`, and platform artifacts to a draft release in the fork. Check the release page manually, then publish only with explicit release authorization.
5. Record the release tag and verification evidence in the phase report. Roll back a bad sync/release by reverting the merge or restoring the prior release; do not rewrite shared history.
