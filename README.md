# Blasito

**A local-first text expander for Chromium.** Type a shortcut like `/hola` in any text field and Blasito replaces it with the text you saved. No accounts, no servers, no tracking.

![Type a shortcut, get the text](store/screenshot-1-expand.png)

> The interface is in Spanish. Contributions to translate it are welcome.

## Features

- **Expands as you type** in `input`, `textarea` and rich editors (`contenteditable`). It never touches password or other non-text fields.
- **Popup search:** find a snippet from the toolbar and copy it with a click, or type and press Enter to copy the first result.
- **Manage snippets** in a list with an editor next to it: create, edit, search, select several and delete.
- **Import and export** your snippets as JSON.
- **Safe by default:** asks before deleting or discarding unsaved changes, and warns when a shortcut is a plain word (like `ok`) that would also expand inside normal sentences.
- **Keyboard friendly:** skip link to the editor, ↑/↓ through the list, Esc to leave the editor, and a resizable editor.
- **Accessible:** text contrast of at least 7:1, visible focus, screen-reader labels, and no motion when the system asks for reduced motion.

## Install

**Chrome Web Store:** coming soon.

**From source** (Node.js 22.12 or newer):

```bash
git clone https://github.com/gabialonso/blasito.git
cd blasito
npm install
npm run build
```

Then open `chrome://extensions`, turn on **Developer mode**, choose **Load unpacked** and select the `dist/` folder.

## Usage

1. Click the Blasito icon and choose **Administrar atajos**.
2. Press **Nuevo atajo**, write a shortcut (for example `/hola`) and the text it should become, then **Guardar atajo**.
3. Type `/hola` in any text field. As soon as you finish the shortcut, Blasito replaces it and leaves the cursor at the end.

Start shortcuts with a symbol such as `/` or `;`, so they never match normal words.

### Keyboard (options page)

| Key | Action |
| --- | --- |
| Tab (first) | Shows «Ir al editor» |
| ↑ / ↓ from the search | Move through the snippets; Enter opens one |
| Esc in the editor | Stop editing (asks first if there are unsaved changes) |
| ← / → on the divider | Make the editor wider or narrower |

### Import format

A JSON array, or the same array inside a `snippets` property. `shortcut` and `content` are required; `name` is optional. Files made with **Exportar** can be imported back. Duplicates and invalid entries are skipped and reported; if the file is not valid, nothing changes.

```json
[
  { "name": "Saludo", "shortcut": "/hola", "content": "Hola, ¿cómo estás?" },
  { "shortcut": ";firma", "content": "Saludos." }
]
```

## Privacy

Everything stays on your device in `chrome.storage.local`. Blasito makes no network requests and only asks for the `storage` permission. See [PRIVACY.md](PRIVACY.md) for the details.

## Development

```bash
npm run typecheck   # TypeScript checks
npm test            # unit tests (Vitest)
npm run build       # build into dist/
npm run package     # build and create blasito.zip for the Chrome Web Store
```

The stack is TypeScript and Vite, with no UI framework: each screen is an HTML page plus a script that builds the list with DOM functions.

```text
public/                manifest.json and icons
src/
  snippets/            logic with no Chrome or DOM: validate, search, import, expand
  content/             content script that runs in web pages
  options/             «Administrar atajos» page and its resizable divider
  popup/               search and quick copy
  shared/              DOM helpers, styles and fonts used by popup and options
tests/                 same folders as src/
store/                 Chrome Web Store images
docs/                  publishing notes
```

### How a shortcut flows

1. On the options page, `options/index.ts` calls `snippets/storage.ts`, which validates with `snippets/model.ts` and saves the list to `chrome.storage.local`.
2. `content/index.ts` loads the list when a page opens and gets every change through `watchSnippets`.
3. On each keystroke it drops unsupported fields, then `mightCompleteShortcut` skips any character that cannot end a shortcut. Only then does `content/expand.ts` look for the shortcut before the cursor and replace it.

Anything in `src/snippets/` runs without Chrome, so start there (and in `tests/snippets/`) when changing behavior.

### Style

The design is brutalist and light-only for now. Colors, fonts, borders, shadows, spacing and animation speeds are variables at the top of `src/shared/styles.css`. Rows are inverted by swapping the `--bg` and `--ink` roles.

## Contributing

Issues and pull requests are welcome. Before opening a pull request, run `npm run typecheck && npm test && npm run build`, and add a test when you change something in `src/snippets/` or `src/content/`. Keep it simple: prefer what the browser already does over new code or dependencies.

## Credits

- [Asap](https://github.com/Omnibus-Type/Asap) by Omnibus-Type, SIL Open Font License 1.1.
- [Hack](https://github.com/source-foundry/Hack) by Source Foundry, MIT License and Bitstream Vera License.

The fonts and their licenses are in `src/shared/fonts/` and are included in the packaged extension.

## License

[MIT](LICENSE) © 2026 Gabriel Alonso
