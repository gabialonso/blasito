# Publishing Blasito to the Chrome Web Store

This file is the maintainer checklist for submitting a new version to the
[Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole).
It holds the texts to paste into the dashboard and the answers for the privacy tab.
It is not user documentation (see [README.md](../README.md)). Store rules change;
check each field against the dashboard when you submit.

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

**Summary** (max 132 characters). The store reads it from the `extensionDescription` key in
`public/_locales/<language>/messages.json`, so each language gets its own:

> Text expander: type a shortcut like /hi and Blasito replaces it with your saved text. Local-only, no accounts, no tracking.

> Expansor de texto: escribí un atajo como /hola y Blasito lo reemplaza por tu texto guardado. Local, sin cuentas ni rastreo.

**Category:** Productivity → Tools.

**Languages:** English (default) and Spanish. Fill in the English listing first, then add
Spanish as a localized listing.

**Description (English):**

```text
Blasito is a free and open-source text expander. Save the texts you write again and again,
give each one a short shortcut, and type it anywhere.

HOW IT WORKS
• Create a snippet: a shortcut such as /hi and the text it should become.
• Type /hi in any text field or rich editor; Blasito replaces it as soon as you finish.
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

Available in English and Spanish. The English translation is new and may contain mistakes;
corrections are welcome on GitHub.
Source code (MIT): https://github.com/gabialonso/blasito
```

**Description (Spanish):**

```text
Blasito es un expansor de texto libre y gratuito. Guardá los textos que escribís una y otra vez,
dale a cada uno un atajo corto y escribilo en cualquier lugar.

CÓMO FUNCIONA
• Creá un atajo: por ejemplo /hola y el texto que debe aparecer.
• Escribí /hola en cualquier campo de texto o editor; Blasito lo reemplaza apenas terminás.
• O abrí el popup desde la barra, buscá y copiá un texto con un clic o Enter.

FUNCIONES
• Funciona en campos de texto, áreas de texto y editores contenteditable. Nunca en contraseñas.
• Lista y editor lado a lado, búsqueda, selección múltiple, importación y exportación en JSON.
• Pregunta antes de eliminar o descartar cambios; avisa si un atajo es una palabra común.
• Cómodo con teclado y accesible: alto contraste, foco visible, respeta el movimiento reducido.

PRIVADO POR DISEÑO
• Tus atajos quedan en tu dispositivo (chrome.storage.local).
• Sin cuentas, sin servidores, sin analíticas, sin conexiones de red.
• Solo el permiso "storage".

Disponible en español e inglés.
Código fuente (MIT): https://github.com/gabialonso/blasito
```

**Images** are in `store/`. The icon is shared; the rest are in `en/` and `es/`:

| File | Use |
| --- | --- |
| `icon-128.png` | Store icon (128×128) |
| `<language>/screenshot-1-expand.png` | Screenshot (1280×800) |
| `<language>/screenshot-2-popup.png` | Screenshot (1280×800) |
| `<language>/screenshot-3-options.png` | Screenshot (1280×800) |
| `<language>/promo-small-440x280.png` | Small promo tile (440×280) |

**Links:**

- Homepage / support: https://github.com/gabialonso/blasito
- Privacy policy: https://github.com/gabialonso/blasito/blob/main/PRIVACY.md

## 3. Privacy practices tab

**Single purpose:**

> Expand short text shortcuts typed in web page text fields into longer texts that the user saved.

**Permission justifications:**

| Permission | Justification |
| --- | --- |
| `storage` | Saves the user's snippets locally so they are available in every page and after restarting the browser. |
| Host access (content script on `<all_urls>`, all frames) | The user can type a shortcut in any text field on any site, including editors inside iframes. The script only looks at the text before the cursor when the typed character could finish a saved shortcut, and replaces it locally. |

**Remote code:** No. All code is bundled in the package.

**Data usage:** answer according to Google's current definitions. Blasito has no server and no
analytics, and nothing leaves the device, so no user data is collected. Then certify:

- Data is not sold to third parties.
- Data is not used or transferred for purposes unrelated to the single purpose.
- Data is not used or transferred to determine creditworthiness or for lending.

## 4. Before submitting

- [ ] Developer account registered in the dashboard (one-time fee; check the current amount there).
- [ ] `PRIVACY.md` is on `main`, so the privacy policy URL works.
- [ ] Version bumped in `public/manifest.json` and `package.json`.
- [ ] `npm run typecheck && npm test && npm run package` pass.
- [ ] `dist/` loaded unpacked in Chrome and tried by hand: create a snippet, expand it in a
      textarea and in a rich editor, copy from the popup, import and export,
      and switch between ES and EN.
- [ ] Upload `blasito.zip`, fill in the listing and privacy tabs, and submit for review.

Broad host access (`<all_urls>`) usually means a longer review; the justification above covers it.
