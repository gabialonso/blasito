import { describe, expect, it } from "vitest";

import { prepareImport } from "../src/snippets/model";
import type { Snippet } from "../src/snippets/types";

const existing: Snippet = {
  id: "existing",
  name: "Actual",
  shortcut: "/actual",
  content: "Texto actual",
  createdAt: "2026-09-08T10:00:00.000Z",
  updatedAt: "2026-09-08T10:00:00.000Z",
};

describe("prepareImport", () => {
  it("agrega los atajos válidos de una lista sin cambiar los actuales", () => {
    const result = prepareImport(
      [{ name: "Saludo", shortcut: " /hola ", content: "Hola" }],
      [existing],
      () => "imported",
      "2026-09-08T11:00:00.000Z",
    );

    expect(result).toEqual({
      snippets: [
        existing,
        {
          id: "imported",
          name: "Saludo",
          shortcut: "/hola",
          content: "Hola",
          createdAt: "2026-09-08T11:00:00.000Z",
          updatedAt: "2026-09-08T11:00:00.000Z",
        },
      ],
      imported: 1,
      duplicates: 0,
      invalid: 0,
    });
    expect(existing.shortcut).toBe("/actual");
  });

  it("acepta un objeto con la lista dentro de snippets", () => {
    const result = prepareImport(
      { snippets: [{ shortcut: "/hola", content: "Hola" }] },
      [],
      () => "imported",
      "2026-09-08T11:00:00.000Z",
    );

    expect(result.imported).toBe(1);
    expect(result.snippets[0].shortcut).toBe("/hola");
  });

  it("omite entradas inválidas y atajos repetidos", () => {
    const result = prepareImport(
      [
        { shortcut: "/actual", content: "Repetido" },
        { shortcut: "/nuevo", content: "Nuevo" },
        { shortcut: "/nuevo", content: "Duplicado" },
        { shortcut: 3, content: "Inválido" },
      ],
      [existing],
      () => "imported",
      "2026-09-08T11:00:00.000Z",
    );

    expect(result.imported).toBe(1);
    expect(result.duplicates).toBe(2);
    expect(result.invalid).toBe(1);
    expect(result.snippets.map((snippet) => snippet.shortcut)).toEqual(["/actual", "/nuevo"]);
  });

  it("rechaza un archivo cuya raíz no sea una lista de atajos", () => {
    expect(() => prepareImport({ otraClave: [] }, [existing])).toThrow(
      "El archivo debe contener una lista de atajos.",
    );
  });
});
