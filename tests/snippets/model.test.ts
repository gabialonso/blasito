import { describe, expect, it } from "vitest";

import {
  createSnippet,
  filterSnippets,
  looksLikeAWord,
  previewLines,
  parseStoredSnippets,
  updateSnippet,
  validateDraft,
  ValidationError,
} from "../../src/snippets/model";
import type { Snippet, SnippetDraft } from "../../src/snippets/types";

const existing: Snippet = {
  id: "one",
  name: "Saludo",
  shortcut: "/hello",
  content: "Hola",
  createdAt: "2026-09-08T10:00:00.000Z",
  updatedAt: "2026-09-08T10:00:00.000Z",
};

describe("validateDraft", () => {
  it("normaliza nombre y shortcut", () => {
    expect(validateDraft({ name: "  Saludo  ", shortcut: " /hola ", content: " Hola " }, [])).toEqual({
      name: "Saludo",
      shortcut: "/hola",
      content: " Hola ",
    });
  });

  it("omite un nombre vacío para conservar atajos sin nombre", () => {
    expect(validateDraft({ name: "  ", shortcut: "/hola", content: "Hola" }, [])).toEqual({
      shortcut: "/hola",
      content: "Hola",
    });
  });

  it("explica con palabras simples los campos vacíos o repetidos", () => {
    expect(() => validateDraft({ name: "Saludo", shortcut: "   ", content: "x" }, [])).toThrow(
      "Escribí el atajo que querés usar.",
    );
    expect(() => validateDraft({ name: "Saludo", shortcut: "/hola", content: "  " }, [])).toThrow(
      "Escribí el texto que querés guardar.",
    );
    expect(() =>
      validateDraft({ name: "Saludo", shortcut: " /hello ", content: "x" }, [existing]),
    ).toThrow("Ya tenés un atajo igual. Elegí otro.");
  });

  it("indica qué campo hay que corregir", () => {
    const fieldOf = (draft: SnippetDraft) => {
      try {
        validateDraft(draft, [existing]);
      } catch (error) {
        return error instanceof ValidationError ? error.field : "otro error";
      }
      return "sin error";
    };

    expect(fieldOf({ shortcut: " ", content: "x" })).toBe("shortcut");
    expect(fieldOf({ shortcut: "/nuevo", content: " " })).toBe("content");
    expect(fieldOf({ shortcut: "/hello", content: "x" })).toBe("shortcut");
  });

  it("permite conservar el shortcut del snippet editado", () => {
    expect(validateDraft({ name: "Saludo", shortcut: "/hello", content: "Nuevo" }, [existing], "one")).toEqual({
      name: "Saludo",
      shortcut: "/hello",
      content: "Nuevo",
    });
  });

  it("permite nombres repetidos entre distintos atajos", () => {
    expect(
      validateDraft({ name: "Saludo", shortcut: "/otro", content: "Hola" }, [existing]),
    ).toEqual({
      name: "Saludo",
      shortcut: "/otro",
      content: "Hola",
    });
  });
});

describe("snippet lifecycle", () => {
  it("crea un snippet con identidad y fecha deterministas", () => {
    expect(
      createSnippet(
        { name: "  Saludo ", shortcut: " /hola ", content: "Hola" },
        [],
        "two",
        "2026-09-08T11:00:00.000Z",
      ),
    ).toEqual({
      id: "two",
      name: "Saludo",
      shortcut: "/hola",
      content: "Hola",
      createdAt: "2026-09-08T11:00:00.000Z",
      updatedAt: "2026-09-08T11:00:00.000Z",
    });
  });

  it("actualiza contenido sin cambiar identidad ni fecha de creación", () => {
    expect(
      updateSnippet(
        existing,
        { name: "Saludo", shortcut: "/hello", content: "Hola de nuevo" },
        [existing],
        "2026-09-08T12:00:00.000Z",
      ),
    ).toEqual({
      id: "one",
      name: "Saludo",
      shortcut: "/hello",
      content: "Hola de nuevo",
      createdAt: "2026-09-08T10:00:00.000Z",
      updatedAt: "2026-09-08T12:00:00.000Z",
    });
  });
});

describe("parseStoredSnippets", () => {
  it("usa una lista vacía cuando aún no hay datos", () => {
    expect(parseStoredSnippets(undefined)).toEqual([]);
  });

  it("rechaza datos corruptos sin convertirlos silenciosamente", () => {
    expect(() => parseStoredSnippets([{ shortcut: "/sin-id" }])).toThrow(
      "No pudimos leer los atajos guardados.",
    );
  });

  it("acepta snippets completos", () => {
    expect(parseStoredSnippets([existing])).toEqual([existing]);
  });
});

describe("filterSnippets", () => {
  it("busca sin distinguir mayúsculas en nombre, shortcut y contenido", () => {
    const other: Snippet = {
      ...existing,
      id: "two",
      name: "Plantilla de bug",
      shortcut: "/bug",
      content: "Resultado esperado",
    };

    expect(filterSnippets([existing, other], "SALUDO")).toEqual([existing]);
    expect(filterSnippets([existing, other], "/BUG")).toEqual([other]);
    expect(filterSnippets([existing, other], "esperado")).toEqual([other]);
    expect(filterSnippets([existing, other], "  ")).toEqual([existing, other]);
  });
});

describe("previewLines", () => {
  it("devuelve las líneas con contenido, sin espacios sobrantes", () => {
    expect(previewLines("Saludos,\n  Gabriel  \n\n\nEquipo de QA\n")).toEqual(["Saludos,", "Gabriel", "Equipo de QA"]);
  });

  it("mantiene un texto de una sola línea", () => {
    expect(previewLines("Listo, gracias.")).toEqual(["Listo, gracias."]);
  });
});

describe("looksLikeAWord", () => {
  it("detecta atajos que también son palabras comunes", () => {
    expect(looksLikeAWord("ok")).toBe(true);
    expect(looksLikeAWord("año")).toBe(true);
    expect(looksLikeAWord("hola2")).toBe(true);
  });

  it("acepta atajos con algún símbolo", () => {
    expect(looksLikeAWord("/ok")).toBe(false);
    expect(looksLikeAWord(";firma")).toBe(false);
    expect(looksLikeAWord("ok!")).toBe(false);
  });
});
