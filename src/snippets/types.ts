export interface Snippet {
  id: string;
  name?: string;
  shortcut: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface SnippetDraft {
  name?: string;
  shortcut: string;
  content: string;
}

/** what storage holds: the snippets that can be used, and rows that could not be read, kept as they are. */
export interface StoredSnippets {
  snippets: Snippet[];
  unreadable: unknown[];
}

export interface ImportResult {
  snippets: Snippet[];
  imported: number;
  duplicates: number;
  invalid: number;
}
