import { filterSnippets } from "../snippets/model";
import type { ImportResult, Snippet, SnippetDraft } from "../snippets/types";
import { addSnippet, deleteSnippet, editSnippet, getSnippets, importSnippets } from "../snippets/storage";

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

let snippets: Snippet[] = [];
let editingId: string | undefined;

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
void loadSnippets();

async function loadSnippets(): Promise<void> {
  try {
    snippets = await getSnippets();
    listStatus.textContent = "";
    renderSnippets();
  } catch (error: unknown) {
    listStatus.textContent = messageFrom(error);
    listStatus.dataset.kind = "error";
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
      showFormStatus("Cambios guardados.");
    } else {
      await addSnippet(draft);
      showFormStatus("Atajo guardado.");
    }
    resetForm(false);
    await loadSnippets();
  } catch (error: unknown) {
    showFormStatus(messageFrom(error), true);
  }
}

function renderSnippets(): void {
  const visibleSnippets = filterSnippets(snippets, searchInput.value);
  list.replaceChildren(...visibleSnippets.map(renderSnippet));
  count.textContent = String(snippets.length);
  emptyState.hidden = visibleSnippets.length > 0;
  emptyState.querySelector("strong")!.textContent = snippets.length ? "No encontramos ese atajo" : "Todavía no guardaste atajos";
  emptyState.querySelector("span")!.textContent = snippets.length ? "Probá con otra búsqueda." : "Creá el primero con el formulario.";
}

function renderSnippet(snippet: Snippet): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "snippet-card";
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
  item.append(copy, actions);
  return item;
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
    await loadSnippets();
  } catch (error: unknown) {
    listStatus.textContent = messageFrom(error);
    listStatus.dataset.kind = "error";
  }
}

async function importFile(): Promise<void> {
  const [file] = importInput.files ?? [];
  if (!file) return;

  try {
    const result = await importSnippets(JSON.parse(await file.text()) as unknown);
    importStatus.textContent = importMessage(result);
    importStatus.dataset.kind = "success";
    importInput.value = "";
    await loadSnippets();
  } catch (error: unknown) {
    importStatus.textContent = error instanceof SyntaxError ? "El archivo no contiene JSON válido." : messageFrom(error);
    importStatus.dataset.kind = "error";
  }
}

function resetForm(clearStatus = true): void {
  editingId = undefined;
  form.reset();
  editorTitle.textContent = "Nuevo atajo";
  submitLabel.textContent = "Guardar atajo";
  cancelButton.hidden = true;
  if (clearStatus) formStatus.textContent = "";
}

function showFormStatus(message: string, isError = false): void {
  formStatus.textContent = message;
  formStatus.dataset.kind = isError ? "error" : "success";
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
