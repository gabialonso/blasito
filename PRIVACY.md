# Privacy policy

_Last updated: 2026-11-01_

Blasito is a text expander that runs entirely in your browser. It has no servers, no accounts and no analytics.

## What Blasito stores

- **Your snippets** (shortcut, text and optional name) and their creation dates, in the browser's local extension storage (`storage.local`), on your device. They are not synced and never leave the browser unless you export them. They are stored as plain text, without encryption, so anyone with access to your browser profile can read them. Don't save passwords or secrets as snippets.
- **Your preferences:** the interface language and the editor width, in the extension's own `localStorage`.

## What Blasito reads

To expand a shortcut, the content script looks at the text right before the cursor in the text field you are typing in (`input`, `textarea` or editable areas). This happens locally, only when the last typed character could finish one of your shortcuts. Password, number, date and other non-text fields are ignored before anything typed in them is looked at. Nothing you type is stored, logged or sent anywhere.

## What Blasito sends

Nothing. The extension makes no network requests and loads no remote code. Its fonts are bundled. The extension pages (popup and options) also carry a content security policy that blocks network connections.

## Clipboard and files

- The popup writes a snippet's text to the clipboard only when you click it or press Enter. The clipboard belongs to your system: clipboard history or cloud clipboard features of your operating system or keyboard may keep or sync that text outside Blasito's control.
- **Export** saves a JSON file with your snippets to your device. **Import** reads a JSON file you choose.

## Permissions

| Permission | Why |
| --- | --- |
| `storage` | Save your snippets on your device. |
| Content script on all sites | Detect shortcuts in any text field you type in. |

## Removing your data

Uninstalling Blasito deletes everything it stored. To keep your snippets, use **Export** first.

## Contact

Questions or concerns: open an issue at <https://github.com/gabialonso/blasito/issues>.
