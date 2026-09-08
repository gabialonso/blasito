import { describe, expect, it } from "vitest";

import { expandTextControl } from "../src/content/expand";
import type { Snippet } from "../src/snippets/types";

const snippet: Snippet = {
  id: "maintenance",
  name: "Mantenimiento",
  shortcut: "/tmant",
  content: "Texto insertado",
  createdAt: "2026-09-08T10:00:00.000Z",
  updatedAt: "2026-09-08T10:00:00.000Z",
};

describe("expandTextControl", () => {
  it("reemplaza el atajo apenas se termina de escribir", () => {
    const field = {
      value: "/tmant",
      selectionStart: 6,
      selectionEnd: 6,
      readOnly: false,
      disabled: false,
      setRangeText(content: string, start: number, end: number) {
        this.value = this.value.slice(0, start) + content + this.value.slice(end);
        this.selectionStart = start + content.length;
        this.selectionEnd = this.selectionStart;
      },
    };

    expect(expandTextControl(field, [snippet])).toBe("Texto insertado");
    expect(field.value).toBe("Texto insertado");
    expect(field.selectionStart).toBe(15);
  });
});
