const SUPPORTED_INPUT_TYPES = new Set(["text", "search", "email", "url", "tel"]);

export function supportsInputType(type: string): boolean {
  return SUPPORTED_INPUT_TYPES.has(type);
}
