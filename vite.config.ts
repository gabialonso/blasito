import { defineConfig } from "vite";

// extension pages (popup and options). the content script has its own build in
// vite.content.config.ts because it can't be an es module.

export default defineConfig({
  build: {
    // the polyfill calls fetch(); chrome 92+ preloads modules natively.
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        popup: "src/popup/index.html",
        options: "src/options/index.html",
      },
    },
  },
});
