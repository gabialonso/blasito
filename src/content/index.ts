import { parseStoredSnippets } from "../snippets/model";
import type { Snippet } from "../snippets/types";
import { getSnippets, STORAGE_KEY } from "../snippets/storage";
import { expandTextControl } from "./expand";
import { playExpansionSound } from "./sound";

let snippets: Snippet[] = [];

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
  if ((event instanceof InputEvent && event.inputType === "insertReplacementText") || !isTextControl(event.target)) {
    return;
  }

  const field = event.target;
  const content = expandTextControl(field, snippets);
  if (!content) return;

  playExpansionSound();
  field.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      data: content,
      inputType: "insertReplacementText",
    }),
  );
});

function isTextControl(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  return target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && target.type === "text");
}
