import type { Snippet } from "../snippets/types";
import { findExpansion } from "../snippets/expansion";

export interface TextControl {
  value: string;
  selectionStart: number | null;
  selectionEnd: number | null;
  readOnly: boolean;
  disabled: boolean;
  setRangeText(content: string, start: number, end: number, selectionMode?: SelectionMode): void;
}

export function expandTextControl(field: TextControl, snippets: Snippet[]): string | undefined {
  if (field.readOnly || field.disabled || field.selectionStart === null || field.selectionStart !== field.selectionEnd) {
    return undefined;
  }

  const expansion = findExpansion(field.value, field.selectionStart, snippets);
  if (!expansion) return undefined;

  field.setRangeText(expansion.content, expansion.start, expansion.end, "end");
  return expansion.content;
}
