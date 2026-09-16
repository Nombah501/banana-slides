# Phase 2 UI Localization Decisions

## User outcome

A user can select `Русский` in the frontend language control, restart or revisit the app, and use the main screens in Russian. Existing Chinese and English behavior remains unchanged. Canonical `extra_fields` keys remain stored as-is while known labels are localized when displayed.

## Accepted scope

- Extend the existing i18next resources, helper, hook, and inline component dictionaries from `zh`/`en` to `zh`/`en`/`ru`.
- Persist the selected locale through the existing `banana-slides-language` localStorage key.
- Add Russian entries for every user-visible frontend dictionary value, including pages, components, dialogs, toasts, tooltips, menus, empty states, settings, generation flows, and error text.
- Localize known extra-field display labels: `演讲者备注`, `版式与重点`, and `配图与素材`; preserve raw unknown/custom keys.
- Keep output-language option values and labels, including `Русский`, unchanged from Phase 1.
- Add focused helper/coverage tests and the required test, build, coverage, and Phase 2 report artifacts.

## Explicit non-goals

- Electron main-process menus/dialogs.
- Backend logs or server-side translations.
- Documentation localization.
- Migrating persisted canonical extra-field keys.
- Replacing the inline per-component dictionary architecture.
- UI redesign, dependency additions, publish, push, deploy, or host changes.

## Acceptance boundary

The language helper returns `ru` for Russian language states, component dictionaries resolve Russian values, i18next falls back `ru -> en -> zh`, the language control exposes and persists Russian, all known extra-field label surfaces use localized display names, `npm test` and `npm run build` pass, and coverage evidence reports measured Russian-entry counts.

## Assumptions to validate

- Existing i18next language detection and localStorage cache can carry `ru` without migration.
- Inline dictionaries are the complete source for component-specific UI copy; code identifiers, model/provider names, formats, paths, and logs remain untouched.
- Existing callers tolerate a third locale once locale unions and fallback logic are widened.

## Success metric

A clean Russian-language frontend smoke path presents Russian labels on the landing/home, settings, outline/description editing, preview, material, and history surfaces without falling back to Chinese or English for translated dictionary keys.

## First validation slice

Load a Russian locale in the helper/hook, render representative component dictionaries, inspect a known extra-field label, then run the complete frontend unit suite and production build.

## Deferred opportunities

- Electron shell copy.
- Backend/API error localization beyond frontend normalization copy.
- Translation management extraction or a locale-file architecture rewrite.
