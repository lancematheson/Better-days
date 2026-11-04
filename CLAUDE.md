# Better Days

An iPhone home-screen app (installable web app) for rating each day across Physical, Emotional and Financial
pillars. Owner: Lance. Live at https://lancematheson.github.io/Better-days/ (GitHub Pages serves the repo root
of `main`; the capital B in the URL matters).

**Read `docs/spec.md` first.** It is the source of truth for every feature, formula and decision, including the
things Lance decided against. Don't reopen settled decisions unless he asks. When the app changes, update the spec
in the same commit.

## Working with Lance
- He's usually on his phone and isn't a programmer: keep replies short and in plain language.
- When he describes changes, keep a numbered change list and **don't push to `main` until he says "update the app."**
- He likes to try changes first: build a private **preview** as a claude.ai Artifact (the built `index.html` with
  `window.BD_DEMO = true` set before the app script, which loads sample data when the preview has none saved) and
  send him the link. Work in progress can be committed to a non-`main` branch (Pages only serves `main`).
- Ask when a request could mean more than one thing; don't guess on anything expensive to redo.
- Double-check math and run the tests before saying something is done.
- Pushing to `main` publishes to everyone using the app (including beta testers) within a minute or two.

## Layout
- `src/template.html` — all screens. Holes are `{{path}}` lookups only (no expressions); `<sc-if value>` and
  `<sc-for list as>` for branches and loops; `onClick="{{fn}}"` for events. `onChange` on text inputs fires per keystroke.
- `src/app.js` — all logic and state: `class Component extends DCLogic`, whose `renderVals()` returns everything the
  template reads. Data is saved to the phone (localStorage key `dayscore.v1`; keep that key so users don't lose data).
  `makeData()`/`makeTasks()` are sample fixtures for tests only.
- `src/runtime.js` — tiny template renderer and DOM patcher (no libraries; npm is unavailable in some environments).
- `src/styles.css`, `src/icon.svg` — styles and icon source.
- `vendor/ocr/` — bundled on-phone text reader for Scan (Tesseract.js 5.1.1 + core + English data, Apache-2.0/MIT,
  from the npm registry). Loaded only on the first scan; don't edit. The English data is gzip renamed to
  `eng-traineddata.wasm` so GitHub Pages and the preview host both serve it.
- `tools/build.py` — builds `index.html`, `sw.js` and `manifest.webmanifest` at the repo root from `src/`.
- `tools/make-icons.js` — regenerates `icon-*.png` from `src/icon.svg` (needs Playwright).
- Root files (`index.html`, `sw.js`, `manifest.webmanifest`, `icon-*.png`, `.nojekyll`) are what users download. Never
  edit `index.html` by hand; edit `src/` and rebuild.

## Making a change
1. Edit files in `src/`.
2. `python3 tools/build.py`
3. `node tests/logic.test.js` (math and logic; must be all passing)
4. `node tests/e2e.test.js` (full flow on an iPhone-sized screen; needs Playwright with Chromium; screenshots go to
   `tests/screenshots/`, which is git-ignored). Look at the screenshots for layout problems.
5. Update `docs/spec.md` if behavior changed, then commit and push to `main`.

## Gotchas
- Dates are local calendar days (`YYYY-MM-DD` keys). Weeks run Monday-Sunday.
- Letter grades and change arrows are computed from the displayed (rounded) numbers; expected vs. actual is shown to
  one decimal.
- iPhone: inputs need 16px+ text or Safari zooms; keep tap targets 44px+; the check-in factor pages must fit an
  iPhone 13 screen without scrolling (the tab bar is hidden there).
- The service worker (`sw.js`) caches the app for offline use; the build stamps a new cache version each time.
