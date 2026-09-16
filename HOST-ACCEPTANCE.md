# Host acceptance — 0.9.0-rc.7-ru.1 (2026-09-16)

Performed by Hermes on the maintainer's machine (Arch/Omarchy, Hyprland/Wayland) against the
published release of this fork.

## Install fix (Phase 1.5 Goal A)
- Downloaded `BananaSlides-0.9.0-rc.7-ru.1-linux-x86_64.AppImage` (441,291,619 bytes); sha512
  verified against `latest-linux.yml` — MATCH.
- Launched the AppImage DIRECTLY (no extraction, read-only squashfs mount): backend announced a
  port, `/health` 200, database in the writable userData path. The previous
  `OSError: [Errno 30] Read-only file system` crash is GONE.

## In-app update check (Phase 1.5 Goal C)
- On startup the built app checked the fork feed and logged:
  `Update for version 0.9.0-rc.7-ru.1 is not available (latest version: 0.9.0-rc.7-ru.1, downgrade
  is disallowed)` — it correctly discovered this release via GitHub; no 403, atom fallback not needed.

## Russian content pipeline (Phase 1) — end-to-end
- Project created via API with a Russian prompt (3 slides, coffee theme) + Russian style text;
  outline → descriptions → 3 page images generated through the configured Codex OAuth provider.
- Outline: NO CJK. Description `text` blocks: `--- Page text --- ... --- End page text ---`, NO CJK.
  Extra-field VALUES: Russian, NO CJK. Extra-field KEYS remain canonical Chinese storage identifiers
  (by design, unchanged).
- Rendered slides (1672x941): all text Russian; stress letters Ж Д Щ Ё Ц Ы correct; zero Chinese
  characters on any slide. Design quality assessed 8–9/10.
- Project id: 5da94dff-b9dd-45db-832e-ffd71dc4fac2 (visible in the app history).

## Known items (unchanged)
- Windows CI build fails on the upstream FFmpeg pin (BtbN autobuild URL 404s on a cold cache) —
  the release ships Linux + macOS arm64 only.
- Internal extra-field keys stay Chinese until the Phase 2 UI localization (display names/migration).
