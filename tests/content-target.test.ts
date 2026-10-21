import { describe, expect, it } from "vitest";

import { supportsInputType } from "../src/content/target";

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
