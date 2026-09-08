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

export interface TextOffset {
  nodeIndex: number;
  offset: number;
}

export function locateTextOffset(nodes: string[], offset: number): TextOffset | undefined {
  if (offset < 0) return undefined;

  let remaining = offset;
  for (const [nodeIndex, text] of nodes.entries()) {
    if (remaining <= text.length) return { nodeIndex, offset: remaining };
    remaining -= text.length;
  }

  return undefined;
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

export function expandContentEditable(editor: HTMLElement, snippets: Snippet[]): string | undefined {
  const doc = editor.ownerDocument;
  const selection = doc.getSelection();
  if (!selection?.rangeCount || !selection.isCollapsed) return undefined;

  const caret = selection.getRangeAt(0);
  if (!editor.contains(caret.startContainer)) return undefined;

  const beforeCaret = caret.cloneRange();
  beforeCaret.selectNodeContents(editor);
  beforeCaret.setEnd(caret.startContainer, caret.startOffset);
  const value = beforeCaret.toString();
  const expansion = findExpansion(value, value.length, snippets);
  if (!expansion) return undefined;

  const walker = doc.createTreeWalker(editor, doc.defaultView?.NodeFilter.SHOW_TEXT ?? 4);
  const textNodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) textNodes.push(node as Text);
  const start = locateTextOffset(textNodes.map((node) => node.data), expansion.start);
  if (!start) return undefined;

  const replacement = caret.cloneRange();
  replacement.setStart(textNodes[start.nodeIndex], start.offset);
  selection.removeAllRanges();
  selection.addRange(replacement);

  try {
    if (doc.execCommand("insertText", false, expansion.content)) return expansion.content;
  } catch {
    // The Range fallback below covers editors that reject execCommand.
  }

  replacement.deleteContents();
  const inserted = doc.createTextNode(expansion.content);
  replacement.insertNode(inserted);
  replacement.setStartAfter(inserted);
  replacement.collapse(true);
  selection.removeAllRanges();
  selection.addRange(replacement);
  const InputEventClass = doc.defaultView?.InputEvent;
  editor.dispatchEvent(InputEventClass ? new InputEventClass("input", { bubbles: true, data: expansion.content, inputType: "insertReplacementText" }) : new Event("input", { bubbles: true }));
  return expansion.content;
}
