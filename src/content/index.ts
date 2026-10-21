// Runs inside every page. Watches what the user types and replaces a shortcut
// with its saved text as soon as the last character of the shortcut is typed.
import type { Snippet } from "../snippets/types";
import { getSnippets, watchSnippets } from "../snippets/storage";
import { expandContentEditable, expandTextControl } from "./expand";
import { playExpansionSound } from "./sound";
import { mightCompleteShortcut, supportsInputType } from "./target";

let snippets: Snippet[] = [];
// Last character of every shortcut, used to skip most keystrokes cheaply.
let lastCharacters = new Set<string>();
// Replacing text fires a new "input" event; this flag stops us from handling our own change.
let isReplacing = false;

getSnippets()
  .then(setSnippets)
  .catch((error: unknown) => console.error("Blasito no pudo cargar los atajos.", error));

watchSnippets(setSnippets, (error) => console.error("Blasito recibió atajos inválidos.", error));

document.addEventListener("input", handleInput);

function setSnippets(newSnippets: Snippet[]): void {
  snippets = newSnippets;
  lastCharacters = new Set(newSnippets.map((snippet) => snippet.shortcut.at(-1)!));
}

function handleInput(event: Event): void {
  if (isReplacing || snippets.length === 0) return;
  // Unsupported fields (passwords, numbers, dates...) are dropped before looking at what was typed.
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

/** Expands a shortcut in the field that received the input. Returns the inserted text, if any. */
function expandTarget(target: EventTarget | null): string | undefined {
  if (isTextControl(target)) {
    const inserted = expandTextControl(target, snippets);
    // setRangeText does not fire "input", and frameworks like React need it to see the new value.
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

/** Returns the outermost editable element, which is the whole editor (not just the paragraph typed in). */
function contentEditableHost(target: EventTarget | null): HTMLElement | undefined {
  if (!isContentEditable(target)) return undefined;

  let editor = target;
  while (editor.parentElement?.isContentEditable) editor = editor.parentElement;
  return editor;
}
