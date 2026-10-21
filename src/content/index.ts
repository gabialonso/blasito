// runs inside every page: replaces a shortcut with its saved text as soon as its last character is typed.
import type { Snippet } from "../snippets/types";
import { getSnippets, watchSnippets } from "../snippets/storage";
import { expandContentEditable, expandTextControl } from "./expand";
import { playExpansionSound } from "./sound";
import { mightCompleteShortcut, supportsInputType } from "./target";

let snippets: Snippet[] = [];
// last character of every shortcut, used to skip most keystrokes cheaply.
let lastCharacters = new Set<string>();
// replacing text fires a new "input" event; this flag stops us from handling our own change.
let isReplacing = false;

getSnippets()
  .then(setSnippets)
  .catch((error: unknown) => console.error("Blasito could not load the snippets.", error));

watchSnippets(setSnippets, (error) => console.error("Blasito received invalid snippets.", error));

document.addEventListener("input", handleInput);

function setSnippets(newSnippets: Snippet[]): void {
  snippets = newSnippets;
  lastCharacters = new Set(newSnippets.map((snippet) => snippet.shortcut.at(-1)!));
}

function handleInput(event: Event): void {
  if (isReplacing || snippets.length === 0) return;
  // unsupported fields (passwords, numbers, dates...) are dropped before looking at what was typed.
  if (!isTextControl(event.target) && !isContentEditable(event.target)) return;

  const { inputType, data } = event as Partial<InputEvent>;
  if (!mightCompleteShortcut(inputType, data, lastCharacters)) return;

  isReplacing = true;
  try {
    const inserted = expandTarget(event.target);
    if (inserted) playExpansionSound();
  } finally {
    isReplacing = false;
  }
}

function expandTarget(target: EventTarget | null): string | undefined {
  if (isTextControl(target)) {
    const inserted = expandTextControl(target, snippets);
    // `setRangeText` does not fire "input", and frameworks like react need it to see the new value.
    if (inserted) {
      target.dispatchEvent(new InputEvent("input", { bubbles: true, data: inserted, inputType: "insertReplacementText" }));
    }
    return inserted;
  }

  const editor = contentEditableHost(target);
  return editor ? expandContentEditable(editor, snippets) : undefined;
}

function isTextControl(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  return target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && supportsInputType(target.type));
}

function isContentEditable(target: EventTarget | null): target is HTMLElement {
  return target instanceof HTMLElement && target.isContentEditable;
}

/** returns the outermost editable element, which is the whole editor (not just the paragraph typed in). */
function contentEditableHost(target: EventTarget | null): HTMLElement | undefined {
  if (!isContentEditable(target)) return undefined;

  let editor = target;
  while (editor.parentElement?.isContentEditable) editor = editor.parentElement;
  return editor;
}
