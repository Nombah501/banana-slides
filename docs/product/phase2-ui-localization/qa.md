# Phase 2 QA Report

## Environment

Local frontend Vite server and local Flask backend only. No host, production account, or published endpoint was touched.

## Scenario matrix

| Scenario | Result | Evidence |
|---|---|---|
| Select Russian through the language control | PASS | Browser control sequence observed `EN → Русский → 中`; after selecting Russian, the detector key contained `ru`. |
| Reload with persisted Russian locale | PASS | Browser reload kept Russian landing copy and no page errors. |
| Russian landing primary path | PASS | Hero, CTA, showcase title, feature sections, footer, GitHub/docs labels rendered in Russian. |
| Russian home primary path | PASS | Navigation, project creation tabs, hints, template controls, and footer rendered in Russian with no page errors. |
| Russian settings primary path | PASS | Settings headings, provider guidance, fields, actions, and errors rendered in Russian with no page errors. Provider/model names remained identifiers. |
| Russian locale helper and fallback chain | PASS | Focused Vitest suite: 5 tests passed. |
| Known extra-field display names | PASS | Focused Vitest assertions cover zh/en/ru known labels and raw unknown-key fallback. |
| Full frontend regression suite | PASS | 29 test files, 220 tests passed. |
| Production frontend build | PASS | Vite transformed 1,864 modules and built successfully. |
| Populated detail editor visual path | BLOCKED | Local smoke database had no historical acceptance project; API returned 404. Mapping callsites and unit contract remain covered. |

## Observed warnings

The test run emitted existing React `act(...)` warnings and router future-flag warnings. The build emitted existing Browserslist, bundle-size, and static/dynamic import warnings. None caused a failed scenario.

## Recovery

The landing page initially exposed a missing array translation path during the first browser smoke. The root cause was a missing local dictionary for the existing `returnObjects` call. The final implementation adds explicit localized landing records and the rerun passed with no page errors.

## Remaining risk

Future component-specific strings must continue to add a non-empty `ru` entry beside `zh` and `en`. Electron shell and backend copy are intentionally outside this phase.
