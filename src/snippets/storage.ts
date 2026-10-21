import { t } from "../shared/i18n";
import { createSnippet, parseStoredSnippets, prepareImport, updateSnippet } from "./model";
import type { ImportResult, Snippet, SnippetDraft } from "./types";

// All snippets live as one array under this key in chrome.storage.local.
const STORAGE_KEY = "snippets";

export async function getSnippets(): Promise<Snippet[]> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return parseStoredSnippets(stored[STORAGE_KEY]);
}

export async function addSnippet(draft: SnippetDraft): Promise<Snippet> {
  const snippets = await getSnippets();
  const snippet = createSnippet(draft, snippets);
  await saveSnippets([...snippets, snippet]);
  return snippet;
}

export async function editSnippet(id: string, draft: SnippetDraft): Promise<Snippet> {
  const snippets = await getSnippets();
  const current = snippets.find((snippet) => snippet.id === id);
  if (!current) {
    throw new Error(t().snippetNotFound);
  }

  const updated = updateSnippet(current, draft, snippets);
  await saveSnippets(snippets.map((snippet) => (snippet.id === id ? updated : snippet)));
  return updated;
}

export async function deleteSnippets(ids: string[]): Promise<void> {
  const snippets = await getSnippets();
  const idSet = new Set(ids);
  await saveSnippets(snippets.filter((snippet) => !idSet.has(snippet.id)));
}

export async function importSnippets(value: unknown): Promise<ImportResult> {
  const result = prepareImport(value, await getSnippets());
  if (result.imported) {
    await saveSnippets(result.snippets);
  }
  return result;
}

/** Calls `onChange` with the new list every time snippets change, from any tab or page. */
export function watchSnippets(onChange: (snippets: Snippet[]) => void, onError: (error: unknown) => void): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) return;

    try {
      onChange(parseStoredSnippets(changes[STORAGE_KEY].newValue));
    } catch (error: unknown) {
      onError(error);
    }
  });
}

function saveSnippets(snippets: Snippet[]): Promise<void> {
  return chrome.storage.local.set({ [STORAGE_KEY]: snippets });
}
