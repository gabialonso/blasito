import { describe, expect, it } from "vitest";

import { isSensitiveAutocomplete, mightCompleteShortcut, supportsInputType } from "../../src/content/target";

describe("supportsInputType", () => {
  it.each(["text", "search", "email", "url", "tel"])(
    "permite escribir atajos en input type=%s",
    (type) => {
      expect(supportsInputType(type)).toBe(true);
    },
  );

  it.each(["password", "checkbox", "radio", "file", "date", "number"])(
    "ignora input type=%s",
    (type) => {
      expect(supportsInputType(type)).toBe(false);
    },
  );
});

describe("isSensitiveAutocomplete", () => {
  it.each(["current-password", "new-password", "one-time-code", "cc-number", "cc-csc", "cc-exp"])(
    "ignora campos con autocomplete=%s aunque sean type=text",
    (autocomplete) => {
      expect(isSensitiveAutocomplete(autocomplete)).toBe(true);
    },
  );

  it("reconoce el token sensible entre otros tokens y sin importar mayúsculas", () => {
    expect(isSensitiveAutocomplete("section-login Current-Password")).toBe(true);
    expect(isSensitiveAutocomplete("shipping  cc-number")).toBe(true);
  });

  it.each([null, "", "on", "off", "email", "username", "name", "cc-name"])(
    "permite atajos con autocomplete=%s",
    (autocomplete) => {
      expect(isSensitiveAutocomplete(autocomplete)).toBe(false);
    },
  );
});

describe("mightCompleteShortcut", () => {
  const lastCharacters = new Set(["a", "z"]);

  it("revisa el campo solo si lo escrito puede terminar un atajo", () => {
    expect(mightCompleteShortcut("insertText", "a", lastCharacters)).toBe(true);
    expect(mightCompleteShortcut("insertText", "b", lastCharacters)).toBe(false);
    expect(mightCompleteShortcut("insertFromPaste", "texto pegado z", lastCharacters)).toBe(true);
  });

  it("ignora borrados y cambios de formato", () => {
    expect(mightCompleteShortcut("deleteContentBackward", null, lastCharacters)).toBe(false);
    expect(mightCompleteShortcut("formatBold", null, lastCharacters)).toBe(false);
  });

  it("revisa el campo cuando el evento no informa qué se insertó", () => {
    expect(mightCompleteShortcut("insertReplacementText", null, lastCharacters)).toBe(true);
    expect(mightCompleteShortcut(undefined, undefined, lastCharacters)).toBe(true);
  });
});
