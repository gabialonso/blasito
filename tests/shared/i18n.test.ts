import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";

import { formatList, getLanguage, setLanguage, t, type Language } from "../../src/shared/i18n";
import { validateDraft } from "../../src/snippets/model";

const languages: Language[] = ["es", "en"];

afterEach(() => setLanguage("en"));

describe("i18n", () => {
  it("tiene en cada idioma todos los textos que usa el HTML", () => {
    for (const page of ["src/popup/index.html", "src/options/index.html"]) {
      const html = readFileSync(page, "utf8");
      const keys = [...html.matchAll(/data-i18n(?:-placeholder|-label|-title)?="([^"]+)"/g)].map((match) => match[1]);
      expect(keys.length).toBeGreaterThan(0);

      for (const language of languages) {
        setLanguage(language);
        for (const key of keys) expect(typeof t()[key as keyof ReturnType<typeof t>], `${page}: ${key}`).toBe("string");
      }
    }
  });

  it("cambia los textos y las listas según el idioma elegido", () => {
    setLanguage("es");
    expect(getLanguage()).toBe("es");
    expect(t().newSnippet).toBe("Nuevo atajo");
    expect(formatList(["/a", "/b"])).toBe("/a y /b");

    setLanguage("en");
    expect(t().newSnippet).toBe("New snippet");
    expect(formatList(["/a", "/b"])).toBe("/a and /b");
  });

  it("valida los atajos con mensajes en el idioma actual", () => {
    setLanguage("es");
    expect(() => validateDraft({ shortcut: " ", content: "x" }, [])).toThrow("Escribí el atajo que querés usar.");
  });
});
