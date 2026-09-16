# Phase 2 Russian UI Localization Plan

## Outcome and boundaries

Add Russian as the third frontend locale while preserving the existing `zh`/`en` inline dictionary pattern. The selected locale is persisted in `banana-slides-language`; Russian falls back to English and then Chinese through i18next. Known canonical extra-field keys receive localized display names without changing stored data.

Acceptance criteria:

- `i18n.ts`, `useT`, and `getT` recognize locale prefixes `zh`, `en`, and `ru`.
- i18next resources include `ru`, with fallback chain `ru -> en -> zh`.
- Every inline dictionary and option label used by the frontend has a non-empty `ru` value; source-only identifiers, logs, provider/model names, paths, and formats remain unchanged.
- All language controls expose Russian and continue persisting the existing localStorage key.
- Extra-field labels use Russian/English/Chinese display names for the three known canonical keys and raw keys for unknown values.
- Focused tests, `npm test`, and `npm run build` pass; required artifacts record observed output and measured coverage.

## Current system

- `frontend/src/i18n.ts` registers `zh.json` and `en.json` with browser/localStorage detection.
- `frontend/src/hooks/useT.ts` and `frontend/src/utils/i18nHelper.ts` select only `zh` or `en`, then fall back to global i18next.
- Component/page/store dictionaries are colocated in `frontend/src/**/*.tsx`/`*.ts` and use `useT`; some option arrays and date/error helpers contain direct locale switches.
- `DescriptionCard.tsx`, `PagePropertiesDrawer.tsx`, and `DetailEditor.tsx` render canonical extra-field names or use them as persisted configuration.
- `OUTPUT_LANGUAGE_OPTIONS` in `frontend/src/api/endpoints.ts` already contains `{ value: 'ru', label: 'Русский' }`.

## Approach

1. Widen dictionary types to include `ru`; centralize locale normalization so region tags such as `ru-RU` resolve to `ru`, unsupported languages resolve through `en` then `zh`, and exact existing behavior remains for Chinese/English.
2. Register `ru.json` and set explicit fallback order `['en', 'zh']` for the `ru` locale while retaining Chinese as the global default.
3. Add `ru` counterparts beside each existing `zh`/`en` dictionary. Keep keys, placeholders, arrays, links, identifiers, and source `zh`/`en` values unchanged. Translate only displayed copy using formal, idiomatic Russian and infinitive button labels.
4. Add a small shared extra-field display-name module keyed by canonical strings. Use it only at label-rendering boundaries; do not transform persistence or prompt/config keys.
5. Replace direct binary language switches in UI, date/error helpers, narration options, and settings with three-locale-aware selection or translation calls.
6. Add focused tests for locale selection/fallback and representative dictionary coverage, then measure all `ru` entries for the report.

## Contracts

- Locale type: `'zh' | 'en' | 'ru'`; locale normalization uses the language prefix and defaults to `'en'` for component dictionaries when the active language is unsupported, while i18next's global fallback remains `zh`.
- Translation dictionaries retain object shape and interpolate existing `{{name}}` placeholders.
- `getExtraFieldDisplayName(name, language)` returns the known localized label or `name` unchanged for unknown/custom keys.
- Persisted `extra_fields`, `description_extra_fields`, and `image_prompt_extra_fields` contain canonical/raw keys exactly as before.

## Flow and states

- Initial load: language detector reads `banana-slides-language`, then navigator; i18next resolves resources and fallback chain.
- Language change: existing controls call `i18n.changeLanguage`; detector cache writes the same key. Controls display current locale and offer `Русский` where applicable.
- Missing Russian key: component helper resolves its dictionary value if present, otherwise global i18next resolves `ru -> en -> zh`; missing custom field label displays the raw key.
- Unsupported navigator locale: normalize to English component copy and i18next fallback behavior; no crash or empty label.

## Failure and security

No new network or secret boundary. Unknown locale/key behavior must remain non-throwing. User-provided custom extra-field names are rendered as text and never interpreted as translation paths. Existing API error payloads and logs remain untouched except frontend-facing normalized copy where a locale switch already exists.

## Implementation slices

1. Locale normalization/types, resources, and language-control updates.
2. Shared extra-field display-name mapping and all label callsites.
3. Russian dictionary entries and direct locale-switch updates across frontend source.
4. Focused tests and measured coverage artifact.
5. Full frontend tests/build, review, QA smoke, report, and local commit.

## Verification

- Focused Vitest helper tests: `ru-RU` resolves `ru`; missing `ru` key falls back to English then Chinese; representative dictionaries expose non-empty Russian values.
- `cd frontend && npm ci`; `npm test`; `npm run build`.
- Static coverage measurement counts dictionary `ru` entries and compares each dictionary's key paths against `zh`/`en`.
- Local UI smoke where runtime configuration permits: switch language, reload, inspect landing/home/settings and known extra-field labels.

## Rollout and rollback

Local-only change; no migration, feature flag, deploy, or host action. Rollback is a local revert of the Phase 2 commit. Persisted language key and canonical extra-field data remain backward-compatible.

## Open decisions

None. The work order supplies the accepted scope and non-goals.
