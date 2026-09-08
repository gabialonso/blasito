import { createSnippet, parseStoredSnippets, updateSnippet } from "./model";
import type { Snippet, SnippetDraft } from "./types";

export const STORAGE_KEY = "snippets";

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
    throw new Error("No se encontró el snippet.");
  }

  const updated = updateSnippet(current, draft, snippets);
  await saveSnippets(snippets.map((snippet) => (snippet.id === id ? updated : snippet)));
  return updated;
}

export async function deleteSnippet(id: string): Promise<void> {
  const snippets = await getSnippets();
  await saveSnippets(snippets.filter((snippet) => snippet.id !== id));
}

function saveSnippets(snippets: Snippet[]): Promise<void> {
  return chrome.storage.local.set({ [STORAGE_KEY]: snippets });
}
