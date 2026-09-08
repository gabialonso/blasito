import { filterSnippets, parseStoredSnippets } from "../snippets/model";
import type { Snippet } from "../snippets/types";
import { getSnippets, STORAGE_KEY } from "../snippets/storage";

const searchInput = requiredElement<HTMLInputElement>("#search");
const list = requiredElement<HTMLUListElement>("#snippet-list");
const emptyState = requiredElement<HTMLElement>("#empty-state");
const status = requiredElement<HTMLElement>("#popup-status");
let snippets: Snippet[] = [];

requiredElement<HTMLButtonElement>("#open-options").addEventListener("click", () => void chrome.runtime.openOptionsPage());
searchInput.addEventListener("input", renderSnippets);
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[STORAGE_KEY]) {
    try {
      snippets = parseStoredSnippets(changes[STORAGE_KEY].newValue);
      renderSnippets();
    } catch (error: unknown) {
      showError(error);
    }
  }
});
void loadSnippets();

async function loadSnippets(): Promise<void> {
  try {
    snippets = await getSnippets();
    renderSnippets();
  } catch (error: unknown) {
    showError(error);
  }
}

function renderSnippets(): void {
  const visibleSnippets = filterSnippets(snippets, searchInput.value);
  list.replaceChildren(...visibleSnippets.map(renderSnippet));
  status.textContent = "";
  emptyState.hidden = visibleSnippets.length > 0;
  emptyState.querySelector("strong")!.textContent = snippets.length ? "No encontramos ese atajo" : "Todavía no guardaste atajos";
  emptyState.querySelector("span")!.textContent = snippets.length ? "Probá con otra búsqueda." : "Creá uno para insertar tus textos más rápido.";
}

function renderSnippet(snippet: Snippet): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "snippet-card popup-card";
  const heading = document.createElement("div");
  heading.className = "snippet-heading";
  const shortcut = document.createElement("code");
  shortcut.className = "shortcut";
  shortcut.textContent = snippet.shortcut;
  const name = document.createElement("strong");
  name.textContent = snippet.name || "Sin nombre";
  const preview = document.createElement("p");
  preview.textContent = snippet.content;
  heading.append(shortcut, name);
  item.append(heading, preview);
  return item;
}

function showError(error: unknown): void {
  status.textContent = error instanceof Error ? error.message : "No pudimos cargar tus atajos.";
  status.dataset.kind = "error";
}

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`No se encontró ${selector}.`);
  return element;
}
