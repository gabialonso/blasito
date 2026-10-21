// Options page: list of snippets on the left, editor on the right.
// Picking a row opens it in the editor; "Nuevo atajo" clears the editor.
import { filterSnippets } from "../snippets/model";
import type { ImportResult, Snippet, SnippetDraft } from "../snippets/types";
import { addSnippet, deleteSnippets, editSnippet, getSnippets, importSnippets } from "../snippets/storage";
import { errorMessage, replayAnimation, requiredElement, setEmptyState, snippetSummary } from "../ui";

const SUCCESS_MESSAGE_MS = 4000;

// ---------- Page elements ----------

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

// In the one-column layout the editor is below the list and has to be scrolled into view.
const oneColumnLayout = window.matchMedia("(max-width: 1024px)");

// ---------- State ----------

let snippets: Snippet[] = [];
/** Snippet open in the editor, or undefined while creating a new one. */
let editing: Snippet | undefined;
/** Snippet saved a moment ago; its row flashes once on the next render. */
let justSavedId: string | undefined;
const selectedIds = new Set<string>();
const messageTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

// ---------- Events ----------

importInput.addEventListener("change", () => void importFile());
exportButton.addEventListener("click", exportSnippets);
newButton.addEventListener("click", () => openEditor(undefined));
searchInput.addEventListener("input", renderList);
selectAllInput.addEventListener("change", () => selectVisible(selectAllInput.checked));
deleteSelectedButton.addEventListener("click", () => void deleteSelected());
form.addEventListener("submit", (event) => {
  event.preventDefault();
  void saveForm();
});
cancelButton.addEventListener("click", () => openEditor(undefined));
deleteButton.addEventListener("click", () => void deleteEditing());

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
  openButton.addEventListener("click", () => openEditor(snippet));

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

function selectVisible(selected: boolean): void {
  for (const snippet of filterSnippets(snippets, searchInput.value)) {
    if (selected) selectedIds.add(snippet.id);
    else selectedIds.delete(snippet.id);
  }
  renderList();
}

// ---------- Editor ----------

/** Shows `snippet` in the editor, or an empty form for a new one when it is undefined. */
function openEditor(snippet: Snippet | undefined, { focus = true } = {}): void {
  editing = snippet;
  form.reset();
  formStatus.textContent = "";

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
    if (oneColumnLayout.matches) editor.scrollIntoView({ block: "start" });
    shortcutInput.focus({ preventScroll: !oneColumnLayout.matches });
  }
}

async function saveForm(): Promise<void> {
  const draft: SnippetDraft = {
    shortcut: shortcutInput.value,
    content: contentInput.value,
    name: nameInput.value,
  };

  let saved: Snippet;
  try {
    saved = editing ? await editSnippet(editing.id, draft) : await addSnippet(draft);
  } catch (error: unknown) {
    showMessage(formStatus, errorMessage(error), true);
    return;
  }

  const message = editing ? "Cambios guardados." : "Atajo guardado.";
  await loadSnippets();
  justSavedId = saved.id;
  openEditor(undefined, { focus: false });
  justSavedId = undefined;
  showMessage(formStatus, message);
}

// ---------- Deleting ----------

async function deleteEditing(): Promise<void> {
  if (editing) await removeSnippets([editing.id], `¿Eliminar ${editing.shortcut}?`);
}

async function deleteSelected(): Promise<void> {
  const ids = [...selectedIds];
  const question = ids.length === 1 ? "¿Eliminar el atajo seleccionado?" : `¿Eliminar los ${ids.length} atajos seleccionados?`;
  await removeSnippets(ids, question);
}

async function removeSnippets(ids: string[], question: string): Promise<void> {
  if (ids.length === 0 || !window.confirm(question)) return;

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
  return `${parts.join(", ")}.`;
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
