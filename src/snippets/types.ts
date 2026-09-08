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
