import { previewLines } from "../snippets/model";
import type { Snippet } from "../snippets/types";
import { getLanguage, isLanguage, setLanguage, t, type Language, type Messages } from "./i18n";

const LANGUAGE_KEY = "blasito.language";

export function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : t().unexpectedError;
}

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

/** restarts a css animation, even if the element already has the class. */
export function replayAnimation(element: HTMLElement, className: string): void {
  element.classList.remove(className);
  // reading the layout makes the browser apply the removal before the class comes back.
  void element.offsetWidth;
  element.classList.add(className);
}

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

  // the preview runs as one paragraph so line breaks don't use up the visible lines;
  // a "↵" marks where each break was. screen readers skip the mark and just hear the text.
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

/**
 * wires the es/en switch and applies the saved language (or the browser's, the first time).
 * `onChange` re-renders the texts that the page script builds itself.
 */
export function setupLanguageSwitch(onChange: () => void): void {
  const inputs = [...document.querySelectorAll<HTMLInputElement>('input[name="language"]')];

  const apply = (language: Language): void => {
    setLanguage(language);
    for (const input of inputs) input.checked = input.value === language;
    translatePage();
    onChange();
  };

  for (const input of inputs) {
    input.addEventListener("change", () => {
      if (!isLanguage(input.value)) return;
      saveLanguage(input.value);
      apply(input.value);
    });
  }
  // the popup and the options page share localStorage, so a change in one reaches the other.
  window.addEventListener("storage", (event) => {
    if (event.key === LANGUAGE_KEY && isLanguage(event.newValue)) apply(event.newValue);
  });

  apply(savedLanguage());
}

/** fills the elements marked in the html: data-i18n (text), data-i18n-placeholder, -label and -title. */
function translatePage(): void {
  document.documentElement.lang = getLanguage();
  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    element.textContent = staticText(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n-placeholder]")) {
    element.setAttribute("placeholder", staticText(element.dataset.i18nPlaceholder));
  }
  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n-label]")) {
    element.setAttribute("aria-label", staticText(element.dataset.i18nLabel));
  }
  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n-title]")) {
    element.setAttribute("title", staticText(element.dataset.i18nTitle));
  }
}

function staticText(key: string | undefined): string {
  const text = t()[key as keyof Messages];
  if (typeof text !== "string") throw new Error(`Missing text: ${key}`);
  return text;
}

function savedLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    // storage blocked: fall back to the browser's language.
  }
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

function saveLanguage(language: Language): void {
  // only a preference: if storage is blocked, the language just isn't remembered.
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    /* ignore */
  }
}
