import { parseStoredSnippets } from "../snippets/model";
import type { Snippet } from "../snippets/types";
import { getSnippets, STORAGE_KEY } from "../snippets/storage";
import { expandContentEditable, expandTextControl } from "./expand";
import { playExpansionSound } from "./sound";

let snippets: Snippet[] = [];
let replacing = false;

void getSnippets()
  .then((storedSnippets) => {
    snippets = storedSnippets;
  })
  .catch((error: unknown) => {
    console.error("Blasito no pudo cargar los snippets.", error);
  });

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[STORAGE_KEY]) {
    return;
  }

  try {
    snippets = parseStoredSnippets(changes[STORAGE_KEY].newValue);
  } catch (error: unknown) {
    console.error("Blasito recibió snippets inválidos.", error);
  }
});

document.addEventListener("input", (event) => {
  if (replacing) return;

  const field = isTextControl(event.target) ? event.target : contentEditableHost(event.target);
  if (!field) return;

  try {
    replacing = true;
    const content = isTextControl(field) ? expandTextControl(field, snippets) : expandContentEditable(field, snippets);
    if (!content) return;

    playExpansionSound();
    if (isTextControl(field)) {
      field.dispatchEvent(new InputEvent("input", { bubbles: true, data: content, inputType: "insertReplacementText" }));
    }
  } finally {
    replacing = false;
  }
});

function isTextControl(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  return target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && target.type === "text");
}

function contentEditableHost(target: EventTarget | null): HTMLElement | undefined {
  let element = target instanceof HTMLElement ? target : undefined;
  if (!element?.isContentEditable) return undefined;
  while (element.parentElement?.isContentEditable) element = element.parentElement;
  return element;
}
