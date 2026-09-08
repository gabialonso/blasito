import type { Snippet, SnippetDraft } from "./types";

export function validateDraft(draft: SnippetDraft, snippets: Snippet[], currentId?: string): SnippetDraft {
  const shortcut = draft.shortcut.trim();
  if (!shortcut) {
    throw new Error("Escribí el atajo que querés usar.");
  }

  if (snippets.some((snippet) => snippet.shortcut === shortcut && snippet.id !== currentId)) {
    throw new Error("Ya guardaste un atajo igual.");
  }

  const name = draft.name?.trim();
  return {
    ...(name ? { name } : {}),
    shortcut,
    content: draft.content,
  };
}

export function createSnippet(
  draft: SnippetDraft,
  snippets: Snippet[],
  id: string = crypto.randomUUID(),
  timestamp = new Date().toISOString(),
): Snippet {
  return {
    id,
    ...validateDraft(draft, snippets),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateSnippet(
  snippet: Snippet,
  draft: SnippetDraft,
  snippets: Snippet[],
  timestamp = new Date().toISOString(),
): Snippet {
  return {
    id: snippet.id,
    ...validateDraft(draft, snippets, snippet.id),
    createdAt: snippet.createdAt,
    updatedAt: timestamp,
  };
}

export function parseStoredSnippets(value: unknown): Snippet[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || !value.every(isSnippet)) {
    throw new Error("No pudimos leer los atajos guardados.");
  }

  return value;
}

export function filterSnippets(snippets: Snippet[], query: string): Snippet[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return snippets;
  }

  return snippets.filter((snippet) =>
    [snippet.name, snippet.shortcut, snippet.content].some((value) =>
      value?.toLocaleLowerCase().includes(normalizedQuery),
    ),
  );
}

function isSnippet(value: unknown): value is Snippet {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snippet = value as Record<string, unknown>;
  return (
    typeof snippet.id === "string" &&
    (snippet.name === undefined || typeof snippet.name === "string") &&
    typeof snippet.shortcut === "string" &&
    typeof snippet.content === "string" &&
    typeof snippet.createdAt === "string" &&
    typeof snippet.updatedAt === "string"
  );
}
