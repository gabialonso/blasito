import { defineConfig } from "vite";

// Second build, only for the content script. Chrome loads content scripts as classic
// scripts, not ES modules, so it is bundled alone as one IIFE file: dist/content.js.

export default defineConfig({
  publicDir: false,
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/content/index.ts",
      formats: ["iife"],
      name: "BlasitoContent",
      fileName: () => "content.js",
    },
  },
});
