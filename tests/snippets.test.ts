import { describe, expect, it } from "vitest";

import {
  createSnippet,
  filterSnippets,
  parseStoredSnippets,
  updateSnippet,
  validateDraft,
} from "../src/snippets/snippets";
import type { Snippet } from "../src/snippets/types";

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

  it("omite un nombre vacío", () => {
    expect(validateDraft({ name: "  ", shortcut: "/hola", content: "Hola" }, [])).toEqual({
      shortcut: "/hola",
      content: "Hola",
    });
  });

  it("rechaza shortcuts vacíos o duplicados", () => {
    expect(() => validateDraft({ shortcut: "   ", content: "x" }, [])).toThrow(
      "El shortcut no puede estar vacío.",
    );
    expect(() => validateDraft({ shortcut: " /hello ", content: "x" }, [existing])).toThrow(
      "Ya existe un snippet con ese shortcut.",
    );
  });

  it("permite conservar el shortcut del snippet editado", () => {
    expect(validateDraft({ shortcut: "/hello", content: "Nuevo" }, [existing], "one")).toEqual({
      shortcut: "/hello",
      content: "Nuevo",
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
      updateSnippet(existing, { shortcut: "/hello", content: "Hola de nuevo" }, [existing], "2026-09-08T12:00:00.000Z"),
    ).toEqual({
      id: "one",
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
      "Los snippets guardados no tienen un formato válido.",
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
