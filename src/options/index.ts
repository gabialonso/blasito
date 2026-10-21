import { filterSnippets } from "../snippets/model";
import type { ImportResult, Snippet, SnippetDraft } from "../snippets/types";
import { addSnippet, deleteSnippet, deleteSnippets, editSnippet, getSnippets, importSnippets } from "../snippets/storage";

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
const importStatus = requiredElement<HTMLElement>("#import-status");
const exportButton = requiredElement<HTMLButtonElement>("#export-button");
const exportStatus = requiredElement<HTMLElement>("#export-status");
const selectAllInput = requiredElement<HTMLInputElement>("#select-all");
const bulkDeleteButton = requiredElement<HTMLButtonElement>("#bulk-delete");
const bulkDeleteLabel = requiredElement<HTMLElement>("#bulk-delete-label");

let snippets: Snippet[] = [];
let editingId: string | undefined;
const selectedIds = new Set<string>();
const statusTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

const STATUS_TIMEOUT_MS = 4000;

const actionIcons = {
  edit: '<svg class="feather" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
  trash: '<svg class="feather" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
} as const;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void saveForm();
});
cancelButton.addEventListener("click", () => resetForm());
searchInput.addEventListener("input", renderSnippets);
importInput.addEventListener("change", () => void importFile());
exportButton.addEventListener("click", exportSnippets);
selectAllInput.addEventListener("change", () => toggleSelectAll(selectAllInput.checked));
bulkDeleteButton.addEventListener("click", () => void bulkDeleteSnippets());
void loadSnippets();

async function loadSnippets(): Promise<void> {
  try {
    snippets = await getSnippets();
    pruneSelection();
    listStatus.textContent = "";
    renderSnippets();
  } catch (error: unknown) {
    listStatus.textContent = messageFrom(error);
    listStatus.dataset.kind = "error";
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
  emptyState.querySelector("span")!.textContent = snippets.length ? "Probá con otra búsqueda." : "Creá el primero con el formulario.";
  updateBulkBar(visibleSnippets);
}

function renderSnippet(snippet: Snippet): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "snippet-card";
  const select = document.createElement("input");
  select.type = "checkbox";
  select.className = "snippet-select";
  select.checked = selectedIds.has(snippet.id);
  select.setAttribute("aria-label", `Seleccionar ${snippet.name || snippet.shortcut}`);
  select.addEventListener("change", () => toggleSelection(snippet.id, select.checked));
  const copy = document.createElement("div");
  copy.className = "snippet-copy";
  const heading = document.createElement("div");
  heading.className = "snippet-heading";
  const shortcut = document.createElement("code");
  shortcut.className = "shortcut";
  shortcut.textContent = snippet.shortcut;
  const name = document.createElement("strong");
  name.textContent = snippet.name || "Sin nombre";
  const preview = document.createElement("p");
  preview.textContent = snippet.content;
  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.append(actionButton("Editar", "edit", () => startEditing(snippet)), actionButton("Eliminar", "trash", () => void removeSnippet(snippet), "danger"));
  heading.append(shortcut, name);
  copy.append(heading, preview);
  item.append(select, copy, actions);
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
  selectAllInput.disabled = visibleSnippets.length === 0;
  selectAllInput.checked = visibleSnippets.length > 0 && visibleSelected.length === visibleSnippets.length;
  selectAllInput.indeterminate = visibleSelected.length > 0 && visibleSelected.length < visibleSnippets.length;
  bulkDeleteButton.hidden = selectedIds.size === 0;
  bulkDeleteLabel.textContent = `Eliminar seleccionados (${selectedIds.size})`;
}

function actionButton(label: string, icon: keyof typeof actionIcons, action: () => void, className = ""): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `text-button ${className}`.trim();
  button.insertAdjacentHTML("afterbegin", actionIcons[icon]);
  button.append(label);
  button.addEventListener("click", action);
  return button;
}

function startEditing(snippet: Snippet): void {
  editingId = snippet.id;
  nameInput.value = snippet.name ?? "";
  shortcutInput.value = snippet.shortcut;
  contentInput.value = snippet.content;
  editorTitle.textContent = "Editar atajo";
  submitLabel.textContent = "Guardar cambios";
  cancelButton.hidden = false;
  formStatus.textContent = "";
  nameInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function removeSnippet(snippet: Snippet): Promise<void> {
  if (!window.confirm(`¿Eliminar ${snippet.shortcut}?`)) return;

  try {
    await deleteSnippet(snippet.id);
    if (editingId === snippet.id) resetForm();
    selectedIds.delete(snippet.id);
    await loadSnippets();
  } catch (error: unknown) {
    showStatus(listStatus, messageFrom(error), true);
  }
}

async function bulkDeleteSnippets(): Promise<void> {
  const ids = [...selectedIds];
  if (!ids.length) return;

  const confirmMessage =
    ids.length === 1 ? "¿Eliminar el atajo seleccionado?" : `¿Eliminar los ${ids.length} atajos seleccionados?`;
  if (!window.confirm(confirmMessage)) return;

  try {
    await deleteSnippets(ids);
    if (editingId && ids.includes(editingId)) resetForm();
    selectedIds.clear();
    await loadSnippets();
    showStatus(listStatus, ids.length === 1 ? "Atajo eliminado." : `${ids.length} atajos eliminados.`);
  } catch (error: unknown) {
    showStatus(listStatus, messageFrom(error), true);
  }
}

function exportSnippets(): void {
  if (!snippets.length) {
    showStatus(exportStatus, "Todavía no hay atajos para descargar.", true);
    return;
  }

  const blob = new Blob([JSON.stringify(snippets, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `blasito-atajos-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showStatus(exportStatus, snippets.length === 1 ? "1 atajo descargado." : `${snippets.length} atajos descargados.`);
}

async function importFile(): Promise<void> {
  const [file] = importInput.files ?? [];
  if (!file) return;

  try {
    const result = await importSnippets(JSON.parse(await file.text()) as unknown);
    showStatus(importStatus, importMessage(result));
    importInput.value = "";
    await loadSnippets();
  } catch (error: unknown) {
    showStatus(importStatus, error instanceof SyntaxError ? "El archivo no contiene JSON válido." : messageFrom(error), true);
  }
}

function resetForm(clearStatus = true): void {
  editingId = undefined;
  form.reset();
  editorTitle.textContent = "Crear nuevo atajo";
  submitLabel.textContent = "Guardar atajo";
  cancelButton.hidden = true;
  if (clearStatus) formStatus.textContent = "";
}

function showStatus(element: HTMLElement, message: string, isError = false): void {
  element.textContent = message;
  element.dataset.kind = isError ? "error" : "success";
  clearTimeout(statusTimers.get(element));
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

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`No se encontró ${selector}.`);
  return element;
}
