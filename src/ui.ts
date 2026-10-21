import type { Snippet } from "./snippets/types";

export function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`No se encontró ${selector}.`);
  return element;
}

// Shortcut, name and a clamped preview, shared by the popup and the options list.
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
