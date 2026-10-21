// Small DOM helpers shared by the popup and the options page.
import { previewLines } from "./snippets/model";
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

/**
 * ↑ and ↓ move focus through `items`. ↑ on the first item (or from `start` itself)
 * goes back to `start`, usually the search field above the list.
 */
export function handleArrowKeys(event: KeyboardEvent, items: HTMLElement[], start: HTMLElement): void {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  if (items.length === 0) return;
  event.preventDefault();

  // `start` counts as position -1, above the first item.
  const current = items.indexOf(event.target as HTMLElement);
  const next = event.key === "ArrowDown" ? Math.min(current + 1, items.length - 1) : current - 1;
  if (next < 0) start.focus();
  else items[next].focus();
}

/** Restarts a CSS animation, even if the element already has the class. */
export function replayAnimation(element: HTMLElement, className: string): void {
  element.classList.remove(className);
  // Reading the layout makes the browser apply the removal before the class comes back.
  void element.offsetWidth;
  element.classList.add(className);
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

  // The preview runs as one paragraph so line breaks don't use up the visible lines;
  // a "↵" marks where each break was. Screen readers skip the mark and just hear the text.
  const preview = document.createElement("span");
  preview.className = "snippet-preview";
  previewLines(snippet.content).forEach((line, index) => {
    if (index > 0) {
      const lineBreak = document.createElement("span");
      lineBreak.className = "line-break";
      lineBreak.setAttribute("aria-hidden", "true");
      lineBreak.textContent = "↵";
      preview.append(" ", lineBreak, " ");
    }
    preview.append(line);
  });

  return [heading, preview];
}
