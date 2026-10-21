const SUPPORTED_INPUT_TYPES = new Set(["text", "search", "email", "url", "tel"]);

export function supportsInputType(type: string): boolean {
  return SUPPORTED_INPUT_TYPES.has(type);
}

// cheap filter that runs on every keystroke: only insertions whose last character
// can finish some shortcut are worth reading the field for.
export function mightCompleteShortcut(
  inputType: string | undefined,
  data: string | null | undefined,
  lastCharacters: ReadonlySet<string>,
): boolean {
  if (inputType && !inputType.startsWith("insert")) return false;
  if (!data) return true;
  return lastCharacters.has(data.at(-1)!);
}
