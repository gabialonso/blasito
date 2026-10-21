// Popup: search saved snippets and copy one to the clipboard.
import { filterSnippets } from "../snippets/model";
import type { Snippet } from "../snippets/types";
import { getSnippets, watchSnippets } from "../snippets/storage";
import { errorMessage, handleArrowKeys, replayAnimation, requiredElement, setEmptyState, snippetSummary } from "../ui";

const COPIED_FEEDBACK_MS = 2000;

const searchInput = requiredElement<HTMLInputElement>("#search");
const list = requiredElement<HTMLUListElement>("#snippet-list");
const emptyState = requiredElement<HTMLElement>("#empty-state");
const status = requiredElement<HTMLElement>("#popup-status");
const optionsButton = requiredElement<HTMLButtonElement>("#open-options");

let snippets: Snippet[] = [];
const copiedTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

optionsButton.addEventListener("click", () => void chrome.runtime.openOptionsPage());
searchInput.addEventListener("input", renderSnippets);
searchInput.addEventListener("keydown", moveWithArrows);
// Enter in the search copies the first result: type a few letters, press Enter, done.
searchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  list.querySelector<HTMLButtonElement>(".popup-item")?.click();
});
list.addEventListener("keydown", moveWithArrows);
watchSnippets(showSnippets, (error) => showStatus(errorMessage(error), true));

getSnippets()
  .then(showSnippets)
  .catch((error: unknown) => showStatus(errorMessage(error), true));

function showSnippets(newSnippets: Snippet[]): void {
  snippets = newSnippets;
  renderSnippets();
}

function renderSnippets(): void {
  const visibleSnippets = filterSnippets(snippets, searchInput.value);
  list.replaceChildren(...visibleSnippets.map(renderSnippet));
  list.hidden = visibleSnippets.length === 0;
  emptyState.hidden = visibleSnippets.length > 0;

  if (snippets.length === 0) {
    setEmptyState(emptyState, "Todavía no guardaste atajos", "Creá uno para insertar tus textos más rápido.");
  } else {
    setEmptyState(emptyState, "No encontramos ese atajo", "Probá con otra búsqueda.");
  }
}

function renderSnippet(snippet: Snippet): HTMLLIElement {
  const summary = document.createElement("span");
  summary.append(...snippetSummary(snippet));

  const copyLabel = document.createElement("span");
  copyLabel.className = "copy-label";
  copyLabel.textContent = "Copiar";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "popup-item";
  button.append(summary, copyLabel);
  button.addEventListener("click", () => void copySnippet(snippet, button, copyLabel));

  const item = document.createElement("li");
  item.append(button);
  return item;
}

async function copySnippet(snippet: Snippet, button: HTMLElement, copyLabel: HTMLElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(snippet.content);
  } catch {
    showStatus("No pudimos copiar el texto.", true);
    return;
  }

  replayAnimation(button, "is-inverted");
  copyLabel.textContent = "Copiado";
  showStatus(`Copiaste el texto de ${snippet.shortcut}.`);

  // Copying again restarts the countdown instead of letting the old one cut it short.
  clearTimeout(copiedTimers.get(button));
  const timer = setTimeout(() => {
    button.classList.remove("is-inverted");
    copyLabel.textContent = "Copiar";
  }, COPIED_FEEDBACK_MS);
  copiedTimers.set(button, timer);
}

function moveWithArrows(event: KeyboardEvent): void {
  handleArrowKeys(event, [...list.querySelectorAll<HTMLButtonElement>(".popup-item")], searchInput);
}

function showStatus(message: string, isError = false): void {
  status.textContent = message;
  status.dataset.kind = isError ? "error" : "success";
  // Success is already visible on the copied item, so screen readers are the only audience.
  status.classList.toggle("sr-only", !isError);
  replayAnimation(status, "is-announced");
}
