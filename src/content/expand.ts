// text fields (input/textarea) and rich editors (contenteditable) need different code.
import type { Snippet } from "../snippets/types";
import { findExpansion } from "../snippets/expansion";

/** the parts of an <input> or <textarea> we use; a plain object can stand in for tests. */
export interface TextControl {
  value: string;
  selectionStart: number | null;
  selectionEnd: number | null;
  readOnly: boolean;
  disabled: boolean;
  setRangeText(content: string, start: number, end: number, selectionMode?: SelectionMode): void;
}

interface EditorMatch {
  node: Text;
  offset: number;
  content: string;
}

export function expandTextControl(field: TextControl, snippets: Snippet[]): string | undefined {
  const hasCaret = field.selectionStart !== null && field.selectionStart === field.selectionEnd;
  if (field.readOnly || field.disabled || !hasCaret) return undefined;

  const expansion = findExpansion(field.value, field.selectionStart!, snippets);
  if (!expansion) return undefined;

  field.setRangeText(expansion.content, expansion.start, expansion.end, "end");
  return expansion.content;
}

export function expandContentEditable(editor: HTMLElement, snippets: Snippet[]): string | undefined {
  const selection = editor.ownerDocument.getSelection();
  if (!selection?.rangeCount || !selection.isCollapsed) return undefined;

  const caret = selection.getRangeAt(0);
  if (!editor.contains(caret.startContainer)) return undefined;

  const match = findMatchBeforeCaret(editor, caret, snippets);
  if (!match) return undefined;

  // select the shortcut so the next step replaces it.
  const shortcutRange = caret.cloneRange();
  shortcutRange.setStart(match.node, match.offset);
  selection.removeAllRanges();
  selection.addRange(shortcutRange);

  if (insertWithEditorCommand(editor.ownerDocument, match.content)) return match.content;

  insertWithRange(editor, selection, shortcutRange, match.content);
  return match.content;
}

/**
 * preferred way: the browser's own "insertText" command keeps the editor's undo history
 * and is understood by most rich-text editors.
 */
function insertWithEditorCommand(doc: Document, content: string): boolean {
  try {
    return doc.execCommand("insertText", false, content);
  } catch {
    return false;
  }
}

/** fallback for editors that reject execCommand: edit the dom directly and announce the change. */
function insertWithRange(editor: HTMLElement, selection: Selection, range: Range, content: string): void {
  range.deleteContents();
  const inserted = document.createTextNode(content);
  range.insertNode(inserted);
  range.setStartAfter(inserted);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  editor.dispatchEvent(new InputEvent("input", { bubbles: true, data: content, inputType: "insertReplacementText" }));
}

function findMatchBeforeCaret(editor: HTMLElement, caret: Range, snippets: Snippet[]): EditorMatch | undefined {
  // fast path: if the text node under the caret is longer than every shortcut, the whole
  // shortcut (and the character before it) is in that node. no need to read the whole editor.
  const caretNode = caret.startContainer;
  const longestShortcut = Math.max(...snippets.map((snippet) => snippet.shortcut.length));
  if (caretNode instanceof Text && caret.startOffset > longestShortcut) {
    const expansion = findExpansion(caretNode.data, caret.startOffset, snippets);
    return expansion && { node: caretNode, offset: expansion.start, content: expansion.content };
  }

  // slow path: the shortcut may be split across nodes, e.g. "/ho<b>la</b>".
  // read all text before the caret, then find which node the match starts in.
  const beforeCaret = caret.cloneRange();
  beforeCaret.selectNodeContents(editor);
  beforeCaret.setEnd(caret.startContainer, caret.startOffset);
  const text = beforeCaret.toString();
  const expansion = findExpansion(text, text.length, snippets);
  if (!expansion) return undefined;

  const textNodes = collectTextNodes(editor);
  const start = locateTextOffset(textNodes.map((node) => node.data), expansion.start);
  return start && { node: textNodes[start.nodeIndex], offset: start.offset, content: expansion.content };
}

function collectTextNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node as Text);
  return nodes;
}

export function locateTextOffset(nodes: string[], offset: number): { nodeIndex: number; offset: number } | undefined {
  if (offset < 0) return undefined;

  let remaining = offset;
  for (const [nodeIndex, text] of nodes.entries()) {
    if (remaining <= text.length) return { nodeIndex, offset: remaining };
    remaining -= text.length;
  }

  return undefined;
}
