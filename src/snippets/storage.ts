import { t } from "../shared/i18n";
import { createSnippet, parseStoredSnippets, prepareImport, updateSnippet } from "./model";
import type { ImportResult, Snippet, SnippetDraft, StoredSnippets } from "./types";

// all snippets live as one array under this key in chrome.storage.local.
const STORAGE_KEY = "snippets";

export async function getSnippets(): Promise<Snippet[]> {
  return (await getStoredSnippets()).snippets;
}

export async function getStoredSnippets(): Promise<StoredSnippets> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return parseStoredSnippets(stored[STORAGE_KEY]);
}

export async function addSnippet(draft: SnippetDraft): Promise<Snippet> {
  const { snippets, unreadable } = await getStoredSnippets();
  const snippet = createSnippet(draft, snippets);
  await saveSnippets([...snippets, snippet], unreadable);
  return snippet;
}

export async function editSnippet(id: string, draft: SnippetDraft): Promise<Snippet> {
  const { snippets, unreadable } = await getStoredSnippets();
  const current = snippets.find((snippet) => snippet.id === id);
  if (!current) {
    throw new Error(t().snippetNotFound);
  }

  const updated = updateSnippet(current, draft, snippets);
  await saveSnippets(
    snippets.map((snippet) => (snippet.id === id ? updated : snippet)),
    unreadable,
  );
  return updated;
}

export async function deleteSnippets(ids: string[]): Promise<void> {
  const { snippets, unreadable } = await getStoredSnippets();
  const idSet = new Set(ids);
  await saveSnippets(
    snippets.filter((snippet) => !idSet.has(snippet.id)),
    unreadable,
  );
}

export async function importSnippets(value: unknown): Promise<ImportResult> {
  const { snippets, unreadable } = await getStoredSnippets();
  const result = prepareImport(value, snippets);
  if (result.imported) {
    await saveSnippets(result.snippets, unreadable);
  }
  return result;
}

/** calls `onChange` with the new list every time snippets change, from any tab or page. */
export function watchSnippets(onChange: (snippets: Snippet[]) => void, onError: (error: unknown) => void): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) return;

    try {
      onChange(parseStoredSnippets(changes[STORAGE_KEY].newValue).snippets);
    } catch (error: unknown) {
      onError(error);
    }
  });
}

// unreadable rows are written back as they were, so saving never deletes them.
function saveSnippets(snippets: Snippet[], unreadable: unknown[]): Promise<void> {
  return chrome.storage.local.set({ [STORAGE_KEY]: [...snippets, ...unreadable] });
}
