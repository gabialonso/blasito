import { defineConfig } from "vite";

// second build, only for the content script. chrome loads content scripts as classic
// scripts, not es modules, so it is bundled alone as one iife file: dist/content.js.

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
