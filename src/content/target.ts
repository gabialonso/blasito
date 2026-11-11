const SUPPORTED_INPUT_TYPES = new Set(["text", "search", "email", "url", "tel"]);

export function supportsInputType(type: string): boolean {
  return SUPPORTED_INPUT_TYPES.has(type);
}

// many secret fields are type=text (a revealed password, a one-time code, a card number),
// so the autocomplete hint is the only sign left that the field holds a secret.
const SENSITIVE_AUTOCOMPLETE = new Set([
  "current-password",
  "new-password",
  "one-time-code",
  "cc-number",
  "cc-csc",
  "cc-exp",
  "cc-exp-month",
  "cc-exp-year",
]);

/** true when a field's `autocomplete` attribute marks it as holding a password, code or card detail. */
export function isSensitiveAutocomplete(autocomplete: string | null): boolean {
  if (!autocomplete) return false;
  return autocomplete
    .toLowerCase()
    .split(/\s+/)
    .some((token) => SENSITIVE_AUTOCOMPLETE.has(token));
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
