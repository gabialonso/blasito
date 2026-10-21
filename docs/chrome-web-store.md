# Publishing to the Chrome Web Store

Everything needed to submit Blasito, ready to paste into the
[Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole).
Store rules change; check each field against the dashboard when submitting.

## 1. Build the package

```bash
npm ci
npm run typecheck && npm test
npm run package     # creates blasito.zip (dist/ + font licenses)
```

Before each release, bump the version in **both** `public/manifest.json` and `package.json`.
The store rejects an upload whose version is not higher than the published one.

## 2. Store listing

**Name:** Blasito

**Summary** (manifest description, max 132 characters):

> Text expander: type a shortcut like /hi and Blasito replaces it with your saved text. Local-only, no accounts, no tracking.

**Category:** Productivity → Tools (pick the closest one the dashboard offers).

**Language:** the interface is in Spanish. If the listing is in English, say so in the description.

**Description:**

```text
Blasito is a free and open-source text expander. Save the texts you write again and again,
give each one a short shortcut, and type it anywhere.

HOW IT WORKS
• Create a snippet: a shortcut such as /hola and the text it should become.
• Type /hola in any text field or rich editor; Blasito replaces it as soon as you finish.
• Or open the toolbar popup, search, and copy a snippet with a click or Enter.

FEATURES
• Works in inputs, text areas and contenteditable editors. Never in password fields.
• List and editor side by side, search, multi-select, import and export as JSON.
• Asks before deleting or discarding changes; warns about shortcuts that are plain words.
• Keyboard friendly and accessible: high contrast, visible focus, reduced-motion support.

PRIVATE BY DESIGN
• Your snippets stay on your device (chrome.storage.local).
• No accounts, no servers, no analytics, no network requests.
• Only the "storage" permission.

The interface is in Spanish.
Source code (MIT): https://github.com/gabialonso/blasito
```

**Images** (in `store/`):

| File | Use |
| --- | --- |
| `icon-128.png` | Store icon (128×128) |
| `screenshot-1-expand.png` | Screenshot (1280×800) |
| `screenshot-2-popup.png` | Screenshot (1280×800) |
| `screenshot-3-options.png` | Screenshot (1280×800) |
| `promo-small-440x280.png` | Small promo tile (440×280) |

**Links:**

- Homepage / support: https://github.com/gabialonso/blasito
- Privacy policy: https://github.com/gabialonso/blasito/blob/main/PRIVACY.md
  (this URL works once `PRIVACY.md` is on `main`).

## 3. Privacy practices tab

**Single purpose:**

> Expand short text shortcuts typed in web page text fields into longer texts that the user saved.

**Permission justifications:**

| Permission | Justification |
| --- | --- |
| `storage` | Saves the user's snippets locally so they are available in every page and after restarting the browser. |
| Host access (content script on `<all_urls>`, all frames) | The user can type a shortcut in any text field on any site, including editors inside iframes. The script only looks at the text before the cursor when the typed character could finish a saved shortcut, and replaces it locally. |

**Remote code:** No. All code is bundled in the package.

**Data usage:** Blasito does not transmit any data off the device, has no server and no
analytics. Shortcut detection reads the text before the cursor locally and keeps nothing.
When the dashboard asks which user data types are collected, answer according to Google's
current definitions; with the current code, no data leaves the device. Then certify:

- Data is not sold to third parties.
- Data is not used or transferred for purposes unrelated to the single purpose.
- Data is not used or transferred to determine creditworthiness or for lending.

## 4. Before submitting

- [ ] Developer account registered in the dashboard (Google charges a one-time registration fee; check the current amount there).
- [ ] `PRIVACY.md` merged into `main`, so the privacy policy URL works.
- [ ] Version bumped in `public/manifest.json` and `package.json`.
- [ ] `npm run typecheck && npm test && npm run package` pass.
- [ ] `dist/` loaded unpacked in Chrome and tried by hand: create a snippet, expand it in a
      textarea and in a rich editor, copy from the popup, import and export.
- [ ] Upload `blasito.zip`, fill in the listing and privacy tabs, and submit for review.

Broad host access usually means a longer review. The justification above explains why it is needed.
