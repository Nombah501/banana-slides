# Phase 1: Russian content pipeline

## Result

Russian content support is implemented on branch `phase1-ru-content` from tag `v0.9.0-rc.7`.
For non-Chinese input, the outline, page-description, and image-generation prompt builders now assemble without CJK characters for `ru`, `en`, and `auto`. Russian generation receives explicit Russian-language instructions; `auto` follows the user's input language and does not switch to Chinese unless Chinese is present or explicitly requested.

## Scope and deviations

**Kept:**

- Backend `ru` output-language support.
- Non-empty, explicit `auto` semantics.
- English-neutral prompt templates and hard language guards.
- Existing stored extra-field names preserved through English prompt-label aliases.
- Minimal frontend `Русский` output-language option.
- Offline prompt tests and assembled prompt evidence.
- Backend/CLI language enumeration updates needed to carry `ru` end to end.

**Out of scope:**

- UI localization and locale-file migration.
- Generation logic, provider implementations, database migrations, and unrelated refactors.
- Real-provider/end-to-end LLM verification; the host-side acceptance test owns that check.
- Frontend dependency installation or bundle build, per the disk/API-key constraints.

**Phase 1.5 stretch:** assessed, not separately changed. `export_service.py` and `services/image_editability/` do not own direct Chinese prompt templates; they consume the shared prompt builders now translated in `prompts.py`. Remaining Chinese strings there are logs, error/help text, comments, or metadata—not model prompt templates.

## Diff summary

Before adding this report and evidence files, the working code diff was **29 tracked files, 677 insertions, 725 deletions**. The main prompt rewrite is `backend/services/prompts.py` (564 additions, 632 deletions); the reduction removes duplicated language-specific Chinese templates while preserving output schemas and structural markers. A new focused test file adds 108 lines. Evidence consists of 9 prompt dumps plus baseline and pytest logs under `artifacts/`.

Changed areas:

- `backend/services/prompts.py`
  - Added `ru` language constants.
  - Added hard guards for Russian, English, and auto content/slide text.
  - Replaced static Chinese prompt templates with neutral English across outline, descriptions, image generation/editing, cleanup, extraction, style, narration, and template prompts.
  - Replaced model-facing extra-field labels with `Visuals and materials`, `Layout and emphasis`, and `Speaker notes`.
  - Kept canonical Chinese field names only as storage/parser identifiers; aliases normalize model output back to those names.
- `backend/services/ai_service.py`
  - Accepts English extra-field headers in both single-response and streaming parsers.
  - Normalizes English headers to existing canonical storage keys.
- `backend/controllers/material_controller.py`, `backend/services/file_parser_service.py`, `backend/services/task_manager.py`, and `backend/controllers/page_controller.py`
  - Removed remaining direct Chinese model-prompt fragments in the content/image-caption/region-edit paths.
- `backend/controllers/settings_controller.py`, `config.py`, `models/settings.py`, `app.py`, `project_controller.py`, and `services/tts_video_service.py`
  - Added `ru` to validation/documentation and Russian TTS voice defaults (`ru-RU-DmitryNeural`).
- `cli/banana_cli/**`, `.env.example`, and CLI docs
  - Added `ru` to typed language values, choices, interactive menus, and examples.
- `frontend/src/api/endpoints.ts` and `frontend/src/types/index.ts`
  - Added `ru` to `OutputLanguage` and `OUTPUT_LANGUAGE_OPTIONS` with label `Русский`.
- Existing prompt-contract tests were updated from old Chinese template wording to the new English prompt contract. No UI localization files were changed.

## Language flow

1. Settings persist `output_language`; `settings_controller.py` now accepts `zh`, `en`, `ja`, `ru`, and `auto`. `Config.OUTPUT_LANGUAGE` remains defaulted to `zh`.
2. Frontend generation helpers read the selected `OutputLanguage` and send it as the existing `language` request field. The new option is available through the existing settings buttons; no UI translation system was changed.
3. Project/page controllers and background tasks read the request or configured default and pass `language` unchanged into `AIService` methods.
4. `AIService` delegates prompt assembly to `services/prompts.py`. Content builders use `get_language_instruction`; image builders use `get_ppt_language_instruction`.
5. The shared parser accepts English model-facing field labels and stores the existing canonical field keys, so image prompt field filtering and persisted page data remain compatible.

## Verification

All checks were offline with no real LLM API calls.

- Clean-base command recorded first: `uv run pytest backend/tests/ -v` could not set up the environment because the configured mirror returned HTTP 403 for `tzdata==2025.2`. The offline retry also lacked cached `anthropic==0.91.0`. Evidence: `artifacts/baseline-pytest.log` and `artifacts/baseline-offline.log`.
- Focused changed-path tests: `uv run --index-url https://pypi.org/simple pytest ...` — **120 passed, 91 warnings**.
- Full offline suite with service-only tests disabled: `SKIP_SERVICE_TESTS=true uv run --index-url https://pypi.org/simple pytest backend/tests/ -v` — **719 passed, 22 skipped, 330 warnings**. Full log: `artifacts/pytest.log`.
- Service-enabled comparison: **719 passed, 20 skipped, 2 failed, 337 warnings**. Both failures are the pre-existing `test_api_full_flow.py` tests requiring a running real backend at `localhost:5011`; both observed `ConnectionRefusedError`. No application API or LLM call was made. Log: `artifacts/pytest-service-enabled.log`.
- Direct prompt-builder smoke check covered 24 builders with Russian input: `cjk_hits {}`. The 9 assembled samples in `artifacts/prompts/` also have no CJK matches for `ru`, `en`, or `auto`.
- Source changes passed `git diff --check`; generated pytest logs retain harmless whitespace-only lines from pytest output.
- Frontend bundle was not installed or built.

## Phase 2 remaining work

Phase 2 remains UI localization: approximately 989 UI strings, locale coverage, and the planned `i18nHelper` refactor. This phase intentionally leaves existing Chinese/English UI copy and locale files unchanged; only the output-language option/type surface was extended.

## Risks and uncertainties

- Model compliance is guard-based; real providers may still require host-side acceptance testing for stubborn mixed-language output.
- User-provided reference files, existing page content, and template metadata are preserved as input. If those inputs contain Chinese, assembled prompts can contain that user data by design; the no-CJK evidence uses Russian/non-CJK inputs.
- `auto` language selection relies on the model following the explicit input-language rule; it does not add a separate language detector.
- English prompt-facing field labels are normalized back to canonical stored keys. Legacy Chinese field names remain accepted for existing data, while new instructions use English labels.
- Russian TTS depends on the configured/provider-supported `ru-RU-DmitryNeural` voice and can be overridden by `TTS_DEFAULT_VOICE_RU`.
- Real LLM output and rendered-slide pixels remain unverified in this API-key-free lab; Hermes' host acceptance test is required.

## Rollout and rollback

No migration or feature flag is required. Defaults remain unchanged. Roll back by reverting the Phase 1 commits if provider output or field parsing regresses; no data migration is involved.
