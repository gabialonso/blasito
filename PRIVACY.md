# Privacy policy

_Last updated: 2026-10-21_

Blasito is a text expander that runs entirely in your browser. It has no servers, no accounts and no analytics.

## What Blasito stores

- **Your snippets** (shortcut, text and optional name) and their creation dates, in `chrome.storage.local`, on your device. They are not synced and never leave the browser unless you export them.
- **The editor width** you choose on the options page, in that page's `localStorage`.

## What Blasito reads

To expand a shortcut, the content script looks at the text right before the cursor in the text field you are typing in (`input`, `textarea` or editable areas). This happens locally, only when the last typed character could finish one of your shortcuts. Password, number, date and other non-text fields are ignored before anything typed in them is looked at. Nothing you type is stored, logged or sent anywhere.

## What Blasito sends

Nothing. The extension makes no network requests and loads no remote code. Its fonts are bundled.

## Clipboard and files

- The popup writes a snippet's text to the clipboard only when you click it or press Enter.
- **Exportar** saves a JSON file with your snippets to your device. **Importar** reads a JSON file you choose.

## Permissions

| Permission | Why |
| --- | --- |
| `storage` | Save your snippets on your device. |
| Content script on all sites | Detect shortcuts in any text field you type in. |

## Removing your data

Uninstalling Blasito deletes everything it stored. To keep your snippets, use **Exportar** first.

## Contact

Questions or concerns: open an issue at <https://github.com/gabialonso/blasito/issues>.
