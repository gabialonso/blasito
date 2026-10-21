import { filterSnippets, parseStoredSnippets } from "../snippets/model";
import type { Snippet } from "../snippets/types";
import { getSnippets, STORAGE_KEY } from "../snippets/storage";
import { requiredElement, snippetSummary } from "../ui";

const searchInput = requiredElement<HTMLInputElement>("#search");
const list = requiredElement<HTMLUListElement>("#snippet-list");
const emptyState = requiredElement<HTMLElement>("#empty-state");
const status = requiredElement<HTMLElement>("#popup-status");
let snippets: Snippet[] = [];

requiredElement<HTMLButtonElement>("#open-options").addEventListener("click", () => void chrome.runtime.openOptionsPage());
searchInput.addEventListener("input", renderSnippets);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") moveFocus(event, 0);
});
list.addEventListener("keydown", (event) => {
  const items = listButtons();
  const index = items.indexOf(event.target as HTMLButtonElement);
  if (event.key === "ArrowDown") moveFocus(event, index + 1);
  if (event.key === "ArrowUp") moveFocus(event, index - 1);
});
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[STORAGE_KEY]) {
    try {
      snippets = parseStoredSnippets(changes[STORAGE_KEY].newValue);
      renderSnippets();
    } catch (error: unknown) {
      showStatus(messageFrom(error), true);
    }
  }
});
void loadSnippets();

async function loadSnippets(): Promise<void> {
  try {
    snippets = await getSnippets();
    renderSnippets();
  } catch (error: unknown) {
    showStatus(messageFrom(error), true);
  }
}

function renderSnippets(): void {
  const visibleSnippets = filterSnippets(snippets, searchInput.value);
  list.replaceChildren(...visibleSnippets.map(renderSnippet));
  list.hidden = visibleSnippets.length === 0;
  emptyState.hidden = visibleSnippets.length > 0;
  emptyState.querySelector("strong")!.textContent = snippets.length ? "No encontramos ese atajo" : "Todavía no guardaste atajos";
  emptyState.querySelector("span")!.textContent = snippets.length ? "Probá con otra búsqueda." : "Creá uno para insertar tus textos más rápido.";
}

function renderSnippet(snippet: Snippet): HTMLLIElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "popup-item";
  const summary = document.createElement("span");
  summary.append(...snippetSummary(snippet));
  const copyLabel = document.createElement("span");
  copyLabel.className = "copy-label";
  copyLabel.textContent = "Copiar";
  button.append(summary, copyLabel);
  button.addEventListener("click", () => void copySnippet(snippet, button, copyLabel));
  const item = document.createElement("li");
  item.append(button);
  return item;
}

async function copySnippet(snippet: Snippet, button: HTMLElement, copyLabel: HTMLElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(snippet.content);
    button.classList.add("is-inverted");
    copyLabel.textContent = "Copiado";
    setTimeout(() => {
      button.classList.remove("is-inverted");
      copyLabel.textContent = "Copiar";
    }, 2000);
    showStatus(`Copiaste el texto de ${snippet.shortcut}.`);
  } catch {
    showStatus("No pudimos copiar el texto.", true);
  }
}

function moveFocus(event: KeyboardEvent, index: number): void {
  const items = listButtons();
  if (!items.length) return;
  event.preventDefault();
  if (index < 0) searchInput.focus();
  else items[Math.min(index, items.length - 1)].focus();
}

function listButtons(): HTMLButtonElement[] {
  return [...list.querySelectorAll<HTMLButtonElement>(".popup-item")];
}

function showStatus(message: string, isError = false): void {
  status.textContent = message;
  status.dataset.kind = isError ? "error" : "success";
  // Success is already shown on the item itself; keep the message for screen readers only.
  status.classList.toggle("sr-only", !isError);
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "No pudimos cargar tus atajos.";
}
