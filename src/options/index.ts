import { filterSnippets } from "../snippets/model";
import type { ImportResult, Snippet, SnippetDraft } from "../snippets/types";
import { addSnippet, deleteSnippets, editSnippet, getSnippets, importSnippets } from "../snippets/storage";
import { requiredElement, snippetSummary } from "../ui";

const form = requiredElement<HTMLFormElement>("#snippet-form");
const nameInput = requiredElement<HTMLInputElement>("#name");
const shortcutInput = requiredElement<HTMLInputElement>("#shortcut");
const contentInput = requiredElement<HTMLTextAreaElement>("#content");
const searchInput = requiredElement<HTMLInputElement>("#search");
const list = requiredElement<HTMLUListElement>("#snippet-list");
const emptyState = requiredElement<HTMLElement>("#empty-state");
const count = requiredElement<HTMLElement>("#snippet-count");
const editorTitle = requiredElement<HTMLElement>("#editor-title");
const submitLabel = requiredElement<HTMLElement>("#submit-label");
const cancelButton = requiredElement<HTMLButtonElement>("#cancel-edit");
const formStatus = requiredElement<HTMLElement>("#form-status");
const listStatus = requiredElement<HTMLElement>("#list-status");
const importInput = requiredElement<HTMLInputElement>("#import-file");
const exportButton = requiredElement<HTMLButtonElement>("#export-button");
const newButton = requiredElement<HTMLButtonElement>("#new-snippet");
const deleteCurrentButton = requiredElement<HTMLButtonElement>("#delete-current");
const editor = requiredElement<HTMLElement>("#editor");
const narrowLayout = window.matchMedia("(max-width: 860px)");
const selectAllInput = requiredElement<HTMLInputElement>("#select-all");
const bulkDeleteButton = requiredElement<HTMLButtonElement>("#bulk-delete");
const listToolbar = requiredElement<HTMLElement>(".list-toolbar");

let snippets: Snippet[] = [];
let editingId: string | undefined;
const selectedIds = new Set<string>();
const statusTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

const STATUS_TIMEOUT_MS = 4000;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void saveForm();
});
cancelButton.addEventListener("click", () => {
  resetForm();
  shortcutInput.focus();
});
newButton.addEventListener("click", () => {
  resetForm();
  focusEditor();
});
deleteCurrentButton.addEventListener("click", () => {
  const current = snippets.find((snippet) => snippet.id === editingId);
  if (current) void removeSnippets([current.id], `¿Eliminar ${current.shortcut}?`);
});
searchInput.addEventListener("input", renderSnippets);
importInput.addEventListener("change", () => void importFile());
exportButton.addEventListener("click", exportSnippets);
selectAllInput.addEventListener("change", () => toggleSelectAll(selectAllInput.checked));
bulkDeleteButton.addEventListener("click", bulkDeleteSnippets);
void loadSnippets();

async function loadSnippets(): Promise<void> {
  try {
    snippets = await getSnippets();
    pruneSelection();
    listStatus.textContent = "";
    renderSnippets();
  } catch (error: unknown) {
    showStatus(listStatus, messageFrom(error), true);
  }
}

function pruneSelection(): void {
  const ids = new Set(snippets.map((snippet) => snippet.id));
  for (const id of selectedIds) {
    if (!ids.has(id)) selectedIds.delete(id);
  }
}

async function saveForm(): Promise<void> {
  const draft: SnippetDraft = {
    name: nameInput.value,
    shortcut: shortcutInput.value,
    content: contentInput.value,
  };

  try {
    if (editingId) {
      await editSnippet(editingId, draft);
      showStatus(formStatus, "Cambios guardados.");
    } else {
      await addSnippet(draft);
      showStatus(formStatus, "Atajo guardado.");
    }
    resetForm(false);
    await loadSnippets();
  } catch (error: unknown) {
    showStatus(formStatus, messageFrom(error), true);
  }
}

function renderSnippets(): void {
  const visibleSnippets = filterSnippets(snippets, searchInput.value);
  list.replaceChildren(...visibleSnippets.map(renderSnippet));
  count.textContent = String(snippets.length);
  emptyState.hidden = visibleSnippets.length > 0;
  emptyState.querySelector("strong")!.textContent = snippets.length ? "No encontramos ese atajo" : "Todavía no guardaste atajos";
  emptyState.querySelector("span")!.textContent = snippets.length ? "Probá con otra búsqueda." : "Tocá «Nuevo atajo» para crear el primero.";
  updateBulkBar(visibleSnippets);
}

function renderSnippet(snippet: Snippet): HTMLLIElement {
  const label = snippet.name ? `${snippet.shortcut} (${snippet.name})` : snippet.shortcut;
  const select = document.createElement("input");
  select.type = "checkbox";
  select.checked = selectedIds.has(snippet.id);
  select.setAttribute("aria-label", `Seleccionar ${label}`);
  select.addEventListener("change", () => toggleSelection(snippet.id, select.checked));
  // The whole row opens the snippet in the editor: one obvious target instead of small buttons.
  const open = document.createElement("button");
  open.type = "button";
  open.className = "row-open";
  open.setAttribute("aria-label", `Editar ${label}`);
  open.append(...snippetSummary(snippet));
  open.addEventListener("click", () => startEditing(snippet));
  const item = document.createElement("li");
  item.className = "snippet-row";
  if (snippet.id === editingId) {
    item.classList.add("is-inverted");
    open.setAttribute("aria-current", "true");
  }
  item.append(select, open);
  return item;
}

function toggleSelection(id: string, checked: boolean): void {
  if (checked) selectedIds.add(id);
  else selectedIds.delete(id);
  updateBulkBar(filterSnippets(snippets, searchInput.value));
}

function toggleSelectAll(checked: boolean): void {
  for (const snippet of filterSnippets(snippets, searchInput.value)) {
    if (checked) selectedIds.add(snippet.id);
    else selectedIds.delete(snippet.id);
  }
  renderSnippets();
}

function updateBulkBar(visibleSnippets: Snippet[]): void {
  const visibleSelected = visibleSnippets.filter((snippet) => selectedIds.has(snippet.id));
  // A disabled checkbox is nearly invisible; hide the whole toolbar when there is nothing to select.
  listToolbar.hidden = visibleSnippets.length === 0 && selectedIds.size === 0;
  selectAllInput.checked = visibleSnippets.length > 0 && visibleSelected.length === visibleSnippets.length;
  selectAllInput.indeterminate = visibleSelected.length > 0 && visibleSelected.length < visibleSnippets.length;
  bulkDeleteButton.hidden = selectedIds.size === 0;
  bulkDeleteButton.textContent = `Eliminar seleccionados (${selectedIds.size})`;
}

function startEditing(snippet: Snippet): void {
  editingId = snippet.id;
  nameInput.value = snippet.name ?? "";
  shortcutInput.value = snippet.shortcut;
  contentInput.value = snippet.content;
  editorTitle.textContent = `Editar ${snippet.shortcut}`;
  submitLabel.textContent = "Guardar cambios";
  cancelButton.hidden = false;
  deleteCurrentButton.hidden = false;
  formStatus.textContent = "";
  renderSnippets();
  focusEditor();
}

function focusEditor(): void {
  // On narrow screens the editor sits below the list; on wide ones it is already visible.
  if (narrowLayout.matches) editor.scrollIntoView({ block: "start" });
  shortcutInput.focus({ preventScroll: !narrowLayout.matches });
}

function bulkDeleteSnippets(): void {
  const ids = [...selectedIds];
  if (!ids.length) return;
  void removeSnippets(
    ids,
    ids.length === 1 ? "¿Eliminar el atajo seleccionado?" : `¿Eliminar los ${ids.length} atajos seleccionados?`,
  );
}

async function removeSnippets(ids: string[], question: string): Promise<void> {
  if (!window.confirm(question)) return;

  try {
    await deleteSnippets(ids);
    if (editingId && ids.includes(editingId)) resetForm();
    for (const id of ids) selectedIds.delete(id);
    await loadSnippets();
    showStatus(listStatus, ids.length === 1 ? "Atajo eliminado." : `${ids.length} atajos eliminados.`);
    // The focused row button is gone; keep keyboard users in the list area.
    searchInput.focus();
  } catch (error: unknown) {
    showStatus(listStatus, messageFrom(error), true);
  }
}

function exportSnippets(): void {
  if (!snippets.length) {
    showStatus(listStatus, "Todavía no hay atajos para exportar.", true);
    return;
  }

  const blob = new Blob([JSON.stringify(snippets, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `blasito-atajos-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showStatus(listStatus, snippets.length === 1 ? "1 atajo exportado." : `${snippets.length} atajos exportados.`);
}

async function importFile(): Promise<void> {
  const [file] = importInput.files ?? [];
  if (!file) return;

  try {
    const result = await importSnippets(JSON.parse(await file.text()) as unknown);
    importInput.value = "";
    await loadSnippets();
    showStatus(listStatus, importMessage(result));
  } catch (error: unknown) {
    importInput.value = "";
    showStatus(listStatus, error instanceof SyntaxError ? "El archivo no contiene JSON válido." : messageFrom(error), true);
  }
}

function resetForm(clearStatus = true): void {
  editingId = undefined;
  form.reset();
  editorTitle.textContent = "Nuevo atajo";
  submitLabel.textContent = "Guardar atajo";
  cancelButton.hidden = true;
  deleteCurrentButton.hidden = true;
  if (clearStatus) formStatus.textContent = "";
  renderSnippets();
}

function showStatus(element: HTMLElement, message: string, isError = false): void {
  element.textContent = message;
  element.dataset.kind = isError ? "error" : "success";
  clearTimeout(statusTimers.get(element));
  // Errors stay visible until the next action so they are not missed.
  if (isError) return;
  statusTimers.set(
    element,
    setTimeout(() => {
      element.textContent = "";
    }, STATUS_TIMEOUT_MS),
  );
}

function importMessage({ imported, duplicates, invalid }: ImportResult): string {
  const details = [
    `${imported} ${imported === 1 ? "atajo importado" : "atajos importados"}`,
    ...(duplicates ? [`${duplicates} repetido${duplicates === 1 ? "" : "s"}`] : []),
    ...(invalid ? [`${invalid} inválido${invalid === 1 ? "" : "s"}`] : []),
  ];
  return `${details.join(", ")}.`;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}
