import type { Snippet } from "./types";

export interface Expansion {
  start: number;
  end: number;
  content: string;
}

export function isTriggerKey(key: string): boolean {
  return key === " " || key === "Enter" || key === "Tab";
}

export function findExpansion(value: string, cursor: number, snippets: Snippet[]): Expansion | undefined {
  for (const snippet of snippets) {
    const start = cursor - snippet.shortcut.length;
    if (start < 0 || value.slice(start, cursor) !== snippet.shortcut) {
      continue;
    }

    const precedingCharacter = value[start - 1];
    if (precedingCharacter && /[\p{L}\p{N}_]/u.test(precedingCharacter)) {
      continue;
    }

    return { start, end: cursor, content: snippet.content };
  }

  return undefined;
}
