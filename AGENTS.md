# AGENTS.md

## Project overview

Blasito is a local-first text expander: the user saves snippets with a shortcut (like `/hi`), and typing the shortcut in any text field replaces it with the saved text. It is a Manifest V3 browser extension for Chromium and Firefox, written in TypeScript and bundled with Vite, with no UI framework and no runtime dependencies.

[README.md](README.md) has the folder layout, how a shortcut flows through the code, the i18n setup and the design variables. Read it before larger changes.

## Setup commands

Node.js 22.12 or newer.

```bash
npm ci
```

## Build and test

```bash
npm run typecheck      # tsc --noEmit
npm test               # vitest, runs in node with no DOM
npm run build          # dist/ (Chrome) and dist-firefox/ (Firefox)
npm run package        # blasito-chrome.zip, blasito-firefox.zip, blasito-source.zip
npm run lint:firefox   # Mozilla's validator on dist-firefox/; must report 0 errors
```

Run `npm run typecheck && npm test && npm run build` before calling a change done. There are no browser tests: when a change needs a manual check, say so and name it (load `dist/` unpacked in Chrome, or `dist-firefox/manifest.json` from `about:debugging` in Firefox).

## Browser targets

- One source tree and one build for both browsers. `scripts/build-firefox.mjs` copies `dist/` to `dist-firefox/` and only rewrites the manifest: gecko ID, minimum Firefox version, data collection declaration and `options_ui`.
- Edit `public/manifest.json` only; never commit a separate Firefox manifest.
- The Firefox add-on ID `blasito@usuallygabo` must never change.
- Use `chrome.*` APIs with promises; Firefox supports them in Manifest V3. Don't add a polyfill.
- Publishing checklists: [docs/chrome-web-store.md](docs/chrome-web-store.md) and [docs/firefox-addons.md](docs/firefox-addons.md).

## Code style

- Logic with no browser APIs lives in `src/snippets/`; keep DOM and `chrome.*` calls out of it.
- Prefer what the browser already does over new code. Don't add runtime dependencies.
- Only add a comment when it explains a non-obvious why. Comments are lowercase. No section banners.
- Every interface text lives in `src/shared/i18n.ts`, in Spanish and English; TypeScript fails if a key is missing. The Spanish is Rioplatense (`escribí`, `te movés`).
- Design values are variables at the top of `src/shared/styles.css`. Keep text contrast at 7:1 or more and respect reduced motion.

## Testing instructions

- `tests/` mirrors `src/`. Test names (`it(...)`) are in Spanish.
- Add or update a test for any change in `src/snippets/` or `src/content/`.
- `src/content/index.ts` registers listeners on import and can't be loaded in the test environment; keep its logic thin and test the modules it calls.

## Security considerations

Blasito promises to be 100% local. A change that breaks one of these rules is a bug, even if the tests pass. If a task seems to need breaking one, stop and ask.

- **No network.** No `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, remote scripts, fonts or analytics. After a build, `grep "fetch(" dist/` finds nothing. Don't loosen the extension pages CSP (`connect-src 'none'`).
- **Minimal permissions.** Only `storage`. No new permissions, `host_permissions` or background script unless the maintainer asks.
- **Only real typing expands.** `handleInput` in `src/content/index.ts` drops events with `isTrusted === false`, so pages can't fake input and read snippets back.
- **Sensitive fields are never read.** Password, number, date and other non-text inputs are dropped before anything typed in them is looked at (`supportsInputType` in `src/content/target.ts`).
- **Nothing typed is logged or stored.** Console messages carry generic errors only.
- **Text goes into the DOM as text.** Use `textContent` and DOM functions; never `innerHTML`, `insertAdjacentHTML`, `eval` or `new Function`.
- **Data stays in `chrome.storage.local`**, never `storage.sync`. Interface preferences live in the extension's `localStorage`.

## Commits and pull requests

- `main` holds released versions only. Work happens on `develop`.
- Branch off `develop` as `type/kebab-name` (`feat/`, `fix/`, `docs/`, `build/`, `chore/`) and open the pull request against `develop`.
- Commits follow Conventional Commits: one lowercase line in English, with an optional body that explains why. No `Co-Authored-By` lines.
- Pull request bodies have **What this fixes** (plain language), **What**, **Why** and **How to test**.
- Never force-push or delete `main` or `develop`.
- Show the maintainer commit messages and pull request texts before creating them.

## Releases

1. On `release/X.Y.Z`, bump the version in `package.json`, `package-lock.json` and `public/manifest.json`; open a PR into `develop`.
2. Open `Release X.Y.Z` from `develop` into `main` and merge it with a merge commit.
3. From `main`, run `npm run package` and publish with `gh release create vX.Y.Z blasito-chrome.zip blasito-firefox.zip blasito-source.zip --target main`.
4. Fast-forward `develop` to `main` and push.
5. Submit to the stores with the checklists in `docs/`.
