// Small DOM helpers shared by the popup and the options page.
import type { Snippet } from "./snippets/types";

/** Finds an element that must exist in the page; fails loudly if the HTML changed. */
export function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`No se encontró ${selector}.`);
  return element;
}

/** Turns anything thrown into a message that can be shown to the user. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

/** Fills the "nothing to show" box: a title and one line explaining what to do. */
export function setEmptyState(emptyState: HTMLElement, title: string, detail: string): void {
  const titleElement = emptyState.querySelector("strong");
  const detailElement = emptyState.querySelector("span");
  if (titleElement) titleElement.textContent = title;
  if (detailElement) detailElement.textContent = detail;
}

/** Builds the shortcut key, the optional name and a short preview of the text. */
export function snippetSummary(snippet: Snippet): HTMLElement[] {
  const heading = document.createElement("span");
  heading.className = "snippet-heading";

  const shortcut = document.createElement("code");
  shortcut.className = "shortcut";
  shortcut.textContent = snippet.shortcut;
  heading.append(shortcut);

  if (snippet.name) {
    const name = document.createElement("span");
    name.className = "snippet-name";
    name.textContent = snippet.name;
    heading.append(name);
  }

  const preview = document.createElement("span");
  preview.className = "snippet-preview";
  preview.textContent = snippet.content;

  return [heading, preview];
}
