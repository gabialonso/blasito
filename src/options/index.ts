// Options page: list of snippets on the left, editor on the right.
// Picking a row opens it in the editor; "Nuevo atajo" clears the editor.
import { filterSnippets, looksLikeAWord, ValidationError } from "../snippets/model";
import type { ImportResult, Snippet, SnippetDraft } from "../snippets/types";
import { addSnippet, deleteSnippets, editSnippet, getSnippets, importSnippets } from "../snippets/storage";
import { setupEditorResizer } from "./resize";
import { errorMessage, handleArrowKeys, replayAnimation, requiredElement, setEmptyState, snippetSummary } from "../shared/ui";

const SUCCESS_MESSAGE_MS = 4000;

// ---------- Page elements ----------

const skipLink = requiredElement<HTMLAnchorElement>("#skip-to-editor");
const importInput = requiredElement<HTMLInputElement>("#import-input");
const exportButton = requiredElement<HTMLButtonElement>("#export-button");

const count = requiredElement<HTMLElement>("#snippet-count");
const newButton = requiredElement<HTMLButtonElement>("#new-button");
const searchInput = requiredElement<HTMLInputElement>("#search");
const listStatus = requiredElement<HTMLElement>("#list-status");
const listToolbar = requiredElement<HTMLElement>("#list-toolbar");
const selectAllInput = requiredElement<HTMLInputElement>("#select-all");
const deleteSelectedButton = requiredElement<HTMLButtonElement>("#delete-selected-button");
const list = requiredElement<HTMLUListElement>("#snippet-list");
const emptyState = requiredElement<HTMLElement>("#empty-state");

const layout = requiredElement<HTMLElement>(".options-layout");
const resizer = requiredElement<HTMLElement>("#panel-resizer");
const editor = requiredElement<HTMLElement>("#editor");
const editorTitle = requiredElement<HTMLElement>("#editor-title");
const form = requiredElement<HTMLFormElement>("#snippet-form");
const shortcutInput = requiredElement<HTMLInputElement>("#shortcut");
const contentInput = requiredElement<HTMLTextAreaElement>("#content");
const nameInput = requiredElement<HTMLInputElement>("#name");
const formStatus = requiredElement<HTMLElement>("#form-status");
const saveButton = requiredElement<HTMLButtonElement>("#save-button");
const cancelButton = requiredElement<HTMLButtonElement>("#cancel-button");
const deleteButton = requiredElement<HTMLButtonElement>("#delete-button");
const shortcutError = requiredElement<HTMLElement>("#shortcut-error");
const contentError = requiredElement<HTMLElement>("#content-error");

const confirmDialog = requiredElement<HTMLDialogElement>("#confirm-dialog");
const confirmTitle = requiredElement<HTMLElement>("#confirm-title");
const confirmMessage = requiredElement<HTMLElement>("#confirm-message");
const confirmButton = requiredElement<HTMLButtonElement>("#confirm-button");

/** Fields that can show their own error, with the element where the message goes. */
const fieldErrors = {
  shortcut: { input: shortcutInput, message: shortcutError },
  content: { input: contentInput, message: contentError },
};

// ---------- State ----------

let snippets: Snippet[] = [];
/** Snippet open in the editor, or undefined while creating a new one. */
let editing: Snippet | undefined;
/** Snippet saved a moment ago; its row flashes once on the next render. */
let justSavedId: string | undefined;
const selectedIds = new Set<string>();
const messageTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

// ---------- Events ----------

skipLink.addEventListener("click", (event) => {
  event.preventDefault();
  shortcutInput.focus();
});
importInput.addEventListener("change", () => void importFile());
exportButton.addEventListener("click", exportSnippets);
newButton.addEventListener("click", () => void switchEditor(undefined));
searchInput.addEventListener("input", renderList);
// ↑/↓ jump between rows without tabbing through every checkbox.
searchInput.addEventListener("keydown", moveWithArrows);
list.addEventListener("keydown", moveWithArrows);
selectAllInput.addEventListener("change", () => selectVisible(selectAllInput.checked));
deleteSelectedButton.addEventListener("click", () => void deleteSelected());
form.addEventListener("submit", (event) => {
  event.preventDefault();
  void saveForm();
});
cancelButton.addEventListener("click", () => void switchEditor(undefined));
// Esc leaves the editor, asking first if something would be lost.
form.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !(editing || hasUnsavedChanges())) return;
  // Without this, the same Esc press would also close the dialog that switchEditor opens.
  event.preventDefault();
  void switchEditor(undefined);
});
// An error disappears as soon as the user starts fixing that field.
shortcutInput.addEventListener("input", () => clearFieldError("shortcut"));
contentInput.addEventListener("input", () => clearFieldError("content"));
deleteButton.addEventListener("click", () => void deleteEditing());

setupEditorResizer(layout, resizer);
void loadSnippets();

// ---------- Loading and rendering ----------

async function loadSnippets(): Promise<void> {
  try {
    snippets = await getSnippets();
  } catch (error: unknown) {
    showMessage(listStatus, errorMessage(error), true);
    return;
  }

  // Forget selected snippets that no longer exist.
  for (const id of selectedIds) {
    if (!snippets.some((snippet) => snippet.id === id)) selectedIds.delete(id);
  }
  renderList();
}

function renderList(): void {
  const visibleSnippets = filterSnippets(snippets, searchInput.value);
  list.replaceChildren(...visibleSnippets.map(renderRow));
  count.textContent = String(snippets.length);

  emptyState.hidden = visibleSnippets.length > 0;
  if (snippets.length === 0) {
    setEmptyState(emptyState, "Todavía no guardaste atajos", "Tocá «Nuevo atajo» para crear el primero.");
  } else {
    setEmptyState(emptyState, "No encontramos ese atajo", "Probá con otra búsqueda.");
  }

  renderSelectionToolbar(visibleSnippets);
}

function renderRow(snippet: Snippet): HTMLLIElement {
  const label = snippet.name ? `${snippet.shortcut} (${snippet.name})` : snippet.shortcut;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = selectedIds.has(snippet.id);
  checkbox.setAttribute("aria-label", `Seleccionar ${label}`);
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) selectedIds.add(snippet.id);
    else selectedIds.delete(snippet.id);
    renderSelectionToolbar(filterSnippets(snippets, searchInput.value));
  });

  // The whole row is one button that opens the snippet in the editor.
  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "row-open";
  openButton.setAttribute("aria-label", `Editar ${label}`);
  openButton.append(...snippetSummary(snippet));
  openButton.addEventListener("click", () => void switchEditor(snippet));

  const row = document.createElement("li");
  row.className = "snippet-row";
  if (snippet.id === justSavedId) row.classList.add("is-saved");
  if (snippet.id === editing?.id) {
    row.classList.add("is-inverted");
    openButton.setAttribute("aria-current", "true");
  }
  row.append(checkbox, openButton);
  return row;
}

function renderSelectionToolbar(visibleSnippets: Snippet[]): void {
  const visibleSelected = visibleSnippets.filter((snippet) => selectedIds.has(snippet.id)).length;

  // A disabled checkbox is hard to see, so the toolbar disappears when there is nothing to select.
  listToolbar.hidden = visibleSnippets.length === 0 && selectedIds.size === 0;
  selectAllInput.checked = visibleSnippets.length > 0 && visibleSelected === visibleSnippets.length;
  selectAllInput.indeterminate = visibleSelected > 0 && visibleSelected < visibleSnippets.length;
  deleteSelectedButton.hidden = selectedIds.size === 0;
  deleteSelectedButton.textContent = `Eliminar seleccionados (${selectedIds.size})`;
}

function moveWithArrows(event: KeyboardEvent): void {
  handleArrowKeys(event, [...list.querySelectorAll<HTMLButtonElement>(".row-open")], searchInput);
}

function selectVisible(selected: boolean): void {
  for (const snippet of filterSnippets(snippets, searchInput.value)) {
    if (selected) selectedIds.add(snippet.id);
    else selectedIds.delete(snippet.id);
  }
  renderList();
}

// ---------- Editor ----------

/** Like openEditor, but first asks before throwing away unsaved changes. */
async function switchEditor(snippet: Snippet | undefined): Promise<void> {
  // Picking the row that is already open just goes back to the editor.
  if (snippet && snippet.id === editing?.id) {
    shortcutInput.focus();
    return;
  }

  if (hasUnsavedChanges()) {
    const discard = await askConfirmation(
      "¿Descartar los cambios?",
      "Hay cambios sin guardar en el editor. Si seguís, se pierden.",
      "Descartar",
    );
    if (!discard) return;
  }
  openEditor(snippet);
}

/** True when the form differs from the snippet being edited (or from an empty form). */
function hasUnsavedChanges(): boolean {
  return (
    shortcutInput.value !== (editing?.shortcut ?? "") ||
    contentInput.value !== (editing?.content ?? "") ||
    nameInput.value !== (editing?.name ?? "")
  );
}

/** Shows `snippet` in the editor, or an empty form for a new one when it is undefined. */
function openEditor(snippet: Snippet | undefined, { focus = true } = {}): void {
  editing = snippet;
  form.reset();
  formStatus.textContent = "";
  clearFieldError("shortcut");
  clearFieldError("content");

  if (snippet) {
    shortcutInput.value = snippet.shortcut;
    contentInput.value = snippet.content;
    nameInput.value = snippet.name ?? "";
  }

  editorTitle.textContent = snippet ? `Editar ${snippet.shortcut}` : "Nuevo atajo";
  saveButton.textContent = snippet ? "Guardar cambios" : "Guardar atajo";
  cancelButton.hidden = !snippet;
  deleteButton.hidden = !snippet;
  renderList();

  if (focus) {
    replayAnimation(editor, "is-opening");
    // Focusing scrolls the field into view only when it isn't visible (the one-column layout);
    // its scroll-margin in the CSS keeps the editor title in view too.
    shortcutInput.focus();
  }
}

async function saveForm(): Promise<void> {
  const draft: SnippetDraft = {
    shortcut: shortcutInput.value,
    content: contentInput.value,
    name: nameInput.value,
  };

  if (!(await confirmWordShortcut(draft.shortcut.trim()))) return;

  let saved: Snippet;
  try {
    saved = editing ? await editSnippet(editing.id, draft) : await addSnippet(draft);
  } catch (error: unknown) {
    if (error instanceof ValidationError && error.field in fieldErrors) {
      showFieldError(error.field as keyof typeof fieldErrors, error.message);
    } else {
      showMessage(formStatus, errorMessage(error), true);
    }
    return;
  }

  const message = editing ? "Cambios guardados." : "Atajo guardado.";
  await loadSnippets();
  justSavedId = saved.id;
  openEditor(undefined, { focus: false });
  justSavedId = undefined;
  showMessage(formStatus, message);
}

/**
 * A shortcut like "ok" is also a normal word, so it would expand while writing a sentence.
 * Saving it is allowed, but only after a warning (and only when the shortcut is new or changed).
 */
async function confirmWordShortcut(shortcut: string): Promise<boolean> {
  if (!looksLikeAWord(shortcut) || shortcut === editing?.shortcut) return true;

  const confirmed = await askConfirmation(
    `¿Guardar «${shortcut}» sin símbolo?`,
    `Se va a reemplazar cada vez que escribas «${shortcut}» como palabra suelta. Para evitarlo, empezalo con un símbolo, por ejemplo /${shortcut}.`,
    "Guardar igual",
  );
  if (!confirmed) shortcutInput.focus();
  return confirmed;
}

// ---------- Deleting ----------

async function deleteEditing(): Promise<void> {
  if (!editing) return;
  const confirmed = await askConfirmation(`¿Eliminar ${editing.shortcut}?`, "Vas a borrar este atajo. No se puede deshacer.", "Eliminar");
  if (confirmed) await removeSnippets([editing.id]);
}

async function deleteSelected(): Promise<void> {
  const ids = [...selectedIds];
  if (ids.length === 0) return;

  const title = ids.length === 1 ? "¿Eliminar 1 atajo?" : `¿Eliminar ${ids.length} atajos?`;
  const shortcuts = snippets.filter((snippet) => selectedIds.has(snippet.id)).map((snippet) => snippet.shortcut);
  const confirmed = await askConfirmation(title, `Vas a borrar ${listShortcuts(shortcuts)}. No se puede deshacer.`, "Eliminar");
  if (confirmed) await removeSnippets(ids);
}

const spanishList = new Intl.ListFormat("es", { type: "conjunction" });

/** "/a, /b y 3 más": names a few shortcuts without making the dialog huge. */
function listShortcuts(shortcuts: string[], max = 5): string {
  const shown = shortcuts.length > max ? [...shortcuts.slice(0, max), `${shortcuts.length - max} más`] : shortcuts;
  return spanishList.format(shown);
}

async function removeSnippets(ids: string[]): Promise<void> {
  try {
    await deleteSnippets(ids);
  } catch (error: unknown) {
    showMessage(listStatus, errorMessage(error), true);
    return;
  }

  for (const id of ids) selectedIds.delete(id);
  if (editing && ids.includes(editing.id)) openEditor(undefined, { focus: false });
  await loadSnippets();
  showMessage(listStatus, ids.length === 1 ? "Atajo eliminado." : `${ids.length} atajos eliminados.`);
  // The focused button no longer exists; move keyboard users back to the list.
  searchInput.focus();
}

/**
 * Opens the page's own confirmation dialog (instead of window.confirm).
 * `action` is the label of the destructive button; resolves to true only if it is pressed.
 */
function askConfirmation(title: string, message: string, action: string): Promise<boolean> {
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmButton.textContent = action;

  return new Promise((resolve) => {
    // returnValue is the value of the button that closed the dialog; Esc leaves it empty.
    confirmDialog.returnValue = "";
    confirmDialog.addEventListener("close", () => resolve(confirmDialog.returnValue === "confirm"), { once: true });
    confirmDialog.showModal();
  });
}

// ---------- Import and export ----------

async function importFile(): Promise<void> {
  const [file] = importInput.files ?? [];
  if (!file) return;
  // Clear the input so choosing the same file again still triggers "change".
  importInput.value = "";

  try {
    const result = await importSnippets(JSON.parse(await file.text()) as unknown);
    await loadSnippets();
    showMessage(listStatus, importMessage(result));
  } catch (error: unknown) {
    const message = error instanceof SyntaxError ? "El archivo no contiene JSON válido." : errorMessage(error);
    showMessage(listStatus, message, true);
  }
}

function importMessage({ imported, duplicates, invalid }: ImportResult): string {
  const parts = [`${imported} ${imported === 1 ? "atajo importado" : "atajos importados"}`];
  if (duplicates) parts.push(`${duplicates} ${duplicates === 1 ? "repetido" : "repetidos"}`);
  if (invalid) parts.push(`${invalid} ${invalid === 1 ? "inválido" : "inválidos"}`);
  return `${spanishList.format(parts)}.`;
}

function exportSnippets(): void {
  if (snippets.length === 0) {
    showMessage(listStatus, "Todavía no hay atajos para exportar.", true);
    return;
  }

  const file = new Blob([JSON.stringify(snippets, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = `blasito-atajos-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);

  showMessage(listStatus, snippets.length === 1 ? "1 atajo exportado." : `${snippets.length} atajos exportados.`);
}

// ---------- Messages ----------

function showFieldError(field: keyof typeof fieldErrors, message: string): void {
  const { input, message: messageElement } = fieldErrors[field];
  input.setAttribute("aria-invalid", "true");
  messageElement.textContent = message;
  messageElement.hidden = false;
  replayAnimation(messageElement, "is-announced");
  input.focus();
}

function clearFieldError(field: keyof typeof fieldErrors): void {
  const { input, message } = fieldErrors[field];
  input.removeAttribute("aria-invalid");
  message.hidden = true;
}

/** Shows a message under a section. Success messages fade after a few seconds; errors stay. */
function showMessage(element: HTMLElement, message: string, isError = false): void {
  element.textContent = message;
  element.dataset.kind = isError ? "error" : "success";
  replayAnimation(element, "is-announced");

  clearTimeout(messageTimers.get(element));
  if (isError) return;

  const timer = setTimeout(() => (element.textContent = ""), SUCCESS_MESSAGE_MS);
  messageTimers.set(element, timer);
}
