import { describe, expect, it } from "vitest";

import { findExpansion, isTriggerKey } from "../src/snippets/expansion";
import type { Snippet } from "../src/snippets/types";

const hello: Snippet = {
  id: "hello",
  name: "Saludo",
  shortcut: "/hello",
  content: "Hola, ¿cómo estás?",
  createdAt: "2026-09-08T10:00:00.000Z",
  updatedAt: "2026-09-08T10:00:00.000Z",
};

describe("isTriggerKey", () => {
  it.each([" ", "Enter", "Tab"])("acepta %j como delimitador", (key) => {
    expect(isTriggerKey(key)).toBe(true);
  });

  it("rechaza otras teclas", () => {
    expect(isTriggerKey("a")).toBe(false);
  });
});

describe("findExpansion", () => {
  it("encuentra un shortcut completo antes del cursor", () => {
    expect(findExpansion("texto /hello", 12, [hello])).toEqual({
      start: 6,
      end: 12,
      content: "Hola, ¿cómo estás?",
    });
  });

  it("conserva la posición del texto posterior", () => {
    expect(findExpansion("/hello después", 6, [hello])).toEqual({
      start: 0,
      end: 6,
      content: "Hola, ¿cómo estás?",
    });
  });

  it("evita reemplazos dentro de palabras", () => {
    expect(findExpansion("texto/hello", 11, [hello])).toBeUndefined();
    expect(findExpansion("á/hello", 7, [hello])).toBeUndefined();
    expect(findExpansion("2/hello", 7, [hello])).toBeUndefined();
    expect(findExpansion("_/hello", 7, [hello])).toBeUndefined();
  });

  it("permite shortcuts después de puntuación", () => {
    expect(findExpansion("(/hello", 7, [hello])).toEqual({
      start: 1,
      end: 7,
      content: "Hola, ¿cómo estás?",
    });
  });

  it("no encuentra coincidencias parciales", () => {
    expect(findExpansion("/hell", 5, [hello])).toBeUndefined();
  });
});
