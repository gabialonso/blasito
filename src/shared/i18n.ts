// Interface texts in Spanish and English. The pages choose the language; everything else calls t().
// No Chrome or DOM here, so the snippet logic can use it too.

export type Language = "es" | "en";

const es = {
  // Static texts, referenced from the HTML with data-i18n attributes.
  optionsTitle: "Blasito · Tus atajos",
  language: "Idioma",
  skipToEditor: "Ir al editor",
  tagline: "Escribí un atajo en cualquier campo de texto y Blasito lo reemplaza por el texto guardado.",
  import: "Importar",
  export: "Exportar",
  listTitle: "Tus atajos",
  newSnippet: "Nuevo atajo",
  searchSnippets: "Buscar atajos",
  listKeysHint: "Con las flechas arriba y abajo te movés entre los atajos.",
  selectAll: "Seleccionar todos",
  editorWidth: "Ancho del editor",
  resizerHint: "Arrastrá para cambiar el ancho del editor",
  shortcut: "Atajo",
  shortcutHint: "Lo que vas a escribir, por ejemplo /hola",
  content: "Texto guardado",
  contentHint: "Lo que aparece en lugar del atajo",
  name: "Nombre",
  nameHint: "Opcional, para encontrarlo después",
  saveSnippet: "Guardar atajo",
  saveChanges: "Guardar cambios",
  cancel: "Cancelar",
  delete: "Eliminar",
  deleteQuestion: "¿Eliminar?",
  popupHint: "Elegí un atajo para copiar su texto, o apretá Enter para copiar el primero.",
  snippets: "Atajos",
  manageSnippets: "Administrar atajos",
  emptyTitle: "Todavía no guardaste atajos",
  emptyOptionsDetail: "Tocá «Nuevo atajo» para crear el primero.",
  emptyPopupDetail: "Creá uno para insertar tus textos más rápido.",
  noMatchTitle: "No encontramos ese atajo",
  noMatchDetail: "Probá con otra búsqueda.",

  // Texts built by the page scripts.
  editorWidthValue: (pixels: number) => `Editor de ${pixels} píxeles de ancho`,
  selectSnippet: (label: string) => `Seleccionar ${label}`,
  editSnippet: (label: string) => `Editar ${label}`,
  deleteSelected: (count: number) => `Eliminar seleccionados (${count})`,
  discardTitle: "¿Descartar los cambios?",
  discardMessage: "Hay cambios sin guardar en el editor. Si seguís, se pierden.",
  discard: "Descartar",
  changesSaved: "Cambios guardados.",
  snippetSaved: "Atajo guardado.",
  wordTitle: (shortcut: string) => `¿Guardar «${shortcut}» sin símbolo?`,
  wordMessage: (shortcut: string) =>
    `Se va a reemplazar cada vez que escribas «${shortcut}» como palabra suelta. Para evitarlo, empezalo con un símbolo, por ejemplo /${shortcut}.`,
  saveAnyway: "Guardar igual",
  deleteOneTitle: (shortcut: string) => `¿Eliminar ${shortcut}?`,
  deleteOneMessage: "Vas a borrar este atajo. No se puede deshacer.",
  deleteManyTitle: (count: number) => (count === 1 ? "¿Eliminar 1 atajo?" : `¿Eliminar ${count} atajos?`),
  deleteManyMessage: (shortcuts: string) => `Vas a borrar ${shortcuts}. No se puede deshacer.`,
  more: (count: number) => `${count} más`,
  deleted: (count: number) => (count === 1 ? "Atajo eliminado." : `${count} atajos eliminados.`),
  invalidJson: "El archivo no contiene JSON válido.",
  imported: (count: number) => `${count} ${count === 1 ? "atajo importado" : "atajos importados"}`,
  duplicates: (count: number) => `${count} ${count === 1 ? "repetido" : "repetidos"}`,
  invalid: (count: number) => `${count} ${count === 1 ? "inválido" : "inválidos"}`,
  nothingToExport: "Todavía no hay atajos para exportar.",
  exported: (count: number) => (count === 1 ? "1 atajo exportado." : `${count} atajos exportados.`),
  exportFileName: (date: string) => `blasito-atajos-${date}.json`,
  copy: "Copiar",
  copied: "Copiado",
  copiedStatus: (shortcut: string) => `Copiaste el texto de ${shortcut}.`,
  copyFailed: "No pudimos copiar el texto.",
  unexpectedError: "Ocurrió un error inesperado.",

  // Errors from the snippet logic.
  missingShortcut: "Escribí el atajo que querés usar.",
  missingContent: "Escribí el texto que querés guardar.",
  duplicateShortcut: "Ya tenés un atajo igual. Elegí otro.",
  unreadableStorage: "No pudimos leer los atajos guardados.",
  notAList: "El archivo debe contener una lista de atajos.",
  snippetNotFound: "No encontramos ese atajo. Puede que lo hayas eliminado en otra pestaña.",
};

export type Messages = typeof es;

const en: Messages = {
  optionsTitle: "Blasito · Your snippets",
  language: "Language",
  skipToEditor: "Skip to editor",
  tagline: "Type a shortcut in any text field and Blasito replaces it with your saved text.",
  import: "Import",
  export: "Export",
  listTitle: "Your snippets",
  newSnippet: "New snippet",
  searchSnippets: "Search snippets",
  listKeysHint: "Use the up and down arrows to move between snippets.",
  selectAll: "Select all",
  editorWidth: "Editor width",
  resizerHint: "Drag to change the editor width",
  shortcut: "Shortcut",
  shortcutHint: "What you will type, for example /hi",
  content: "Saved text",
  contentHint: "What appears instead of the shortcut",
  name: "Name",
  nameHint: "Optional, to find it later",
  saveSnippet: "Save snippet",
  saveChanges: "Save changes",
  cancel: "Cancel",
  delete: "Delete",
  deleteQuestion: "Delete?",
  popupHint: "Pick a snippet to copy its text, or press Enter to copy the first one.",
  snippets: "Snippets",
  manageSnippets: "Manage snippets",
  emptyTitle: "You have no snippets yet",
  emptyOptionsDetail: "Press “New snippet” to create your first one.",
  emptyPopupDetail: "Create one to insert your texts faster.",
  noMatchTitle: "No snippet matches",
  noMatchDetail: "Try another search.",

  editorWidthValue: (pixels) => `Editor ${pixels} pixels wide`,
  selectSnippet: (label) => `Select ${label}`,
  editSnippet: (label) => `Edit ${label}`,
  deleteSelected: (count) => `Delete selected (${count})`,
  discardTitle: "Discard changes?",
  discardMessage: "The editor has unsaved changes. If you continue, they will be lost.",
  discard: "Discard",
  changesSaved: "Changes saved.",
  snippetSaved: "Snippet saved.",
  wordTitle: (shortcut) => `Save “${shortcut}” without a symbol?`,
  wordMessage: (shortcut) =>
    `It will be replaced every time you type “${shortcut}” as a word. To avoid that, start it with a symbol, for example /${shortcut}.`,
  saveAnyway: "Save anyway",
  deleteOneTitle: (shortcut) => `Delete ${shortcut}?`,
  deleteOneMessage: "This snippet will be deleted. This can't be undone.",
  deleteManyTitle: (count) => (count === 1 ? "Delete 1 snippet?" : `Delete ${count} snippets?`),
  deleteManyMessage: (shortcuts) => `${shortcuts} will be deleted. This can't be undone.`,
  more: (count) => `${count} more`,
  deleted: (count) => (count === 1 ? "Snippet deleted." : `${count} snippets deleted.`),
  invalidJson: "The file does not contain valid JSON.",
  imported: (count) => `${count} ${count === 1 ? "snippet imported" : "snippets imported"}`,
  duplicates: (count) => `${count} ${count === 1 ? "duplicate" : "duplicates"}`,
  invalid: (count) => `${count} invalid`,
  nothingToExport: "There are no snippets to export yet.",
  exported: (count) => (count === 1 ? "1 snippet exported." : `${count} snippets exported.`),
  exportFileName: (date) => `blasito-snippets-${date}.json`,
  copy: "Copy",
  copied: "Copied",
  copiedStatus: (shortcut) => `Copied the text of ${shortcut}.`,
  copyFailed: "Couldn't copy the text.",
  unexpectedError: "Something unexpected went wrong.",

  missingShortcut: "Type the shortcut you want to use.",
  missingContent: "Type the text you want to save.",
  duplicateShortcut: "You already have this shortcut. Pick another one.",
  unreadableStorage: "Couldn't read the saved snippets.",
  notAList: "The file must contain a list of snippets.",
  snippetNotFound: "That snippet no longer exists. It may have been deleted in another tab.",
};

const messages: Record<Language, Messages> = { es, en };
let current: Language = "en";

export function isLanguage(value: unknown): value is Language {
  return value === "es" || value === "en";
}

export function setLanguage(language: Language): void {
  current = language;
}

export function getLanguage(): Language {
  return current;
}

/** Texts in the current language. */
export function t(): Messages {
  return messages[current];
}

/** "/a, /b y /c" or "/a, /b, and /c", depending on the language. */
export function formatList(items: string[]): string {
  return new Intl.ListFormat(current, { type: "conjunction" }).format(items);
}
