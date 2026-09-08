import { findExpansion, isTriggerKey } from "../snippets/expansion";
import { parseStoredSnippets } from "../snippets/model";
import type { Snippet } from "../snippets/types";
import { getSnippets, STORAGE_KEY } from "../snippets/storage";

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

document.addEventListener("keydown", (event) => {
  if (!isTriggerKey(event.key) || !isTextControl(event.target)) {
    return;
  }

  const field = event.target;
  if (field.readOnly || field.disabled || field.selectionStart === null || field.selectionStart !== field.selectionEnd) {
    return;
  }

  const expansion = findExpansion(field.value, field.selectionStart, snippets);
  if (!expansion) {
    return;
  }

  event.preventDefault();
  field.setRangeText(expansion.content, expansion.start, expansion.end, "end");
  field.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      data: expansion.content,
      inputType: "insertReplacementText",
    }),
  );
});

function isTextControl(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  return target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && target.type === "text");
}
