import { filterSnippets } from "../snippets/snippets";
import type { Snippet, SnippetDraft } from "../snippets/types";
import { addSnippet, deleteSnippet, editSnippet, getSnippets } from "../storage/snippets";

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

let snippets: Snippet[] = [];
let editingId: string | undefined;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void saveForm();
});
cancelButton.addEventListener("click", () => resetForm());
searchInput.addEventListener("input", renderSnippets);
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
      showFormStatus("Snippet actualizado.");
    } else {
      await addSnippet(draft);
      showFormStatus("Snippet guardado.");
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
  emptyState.querySelector("strong")!.textContent = snippets.length ? "No hay coincidencias" : "No hay snippets todavía";
  emptyState.querySelector("span")!.textContent = snippets.length ? "Probá con otra búsqueda." : "Creá el primero desde el formulario.";
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
  actions.append(actionButton("Editar", () => startEditing(snippet)), actionButton("Eliminar", () => void removeSnippet(snippet), "danger"));
  heading.append(shortcut, name);
  copy.append(heading, preview);
  item.append(copy, actions);
  return item;
}

function actionButton(label: string, action: () => void, className = ""): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `text-button ${className}`.trim();
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

function startEditing(snippet: Snippet): void {
  editingId = snippet.id;
  nameInput.value = snippet.name ?? "";
  shortcutInput.value = snippet.shortcut;
  contentInput.value = snippet.content;
  editorTitle.textContent = "Editar snippet";
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

function resetForm(clearStatus = true): void {
  editingId = undefined;
  form.reset();
  editorTitle.textContent = "Nuevo snippet";
  submitLabel.textContent = "Guardar snippet";
  cancelButton.hidden = true;
  if (clearStatus) formStatus.textContent = "";
}

function showFormStatus(message: string, isError = false): void {
  formStatus.textContent = message;
  formStatus.dataset.kind = isError ? "error" : "success";
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`No se encontró ${selector}.`);
  return element;
}
