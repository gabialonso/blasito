import { defineConfig } from "vite";

// extension pages (popup and options). the content script has its own build in
// vite.content.config.ts because it can't be an es module.

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        popup: "src/popup/index.html",
        options: "src/options/index.html",
      },
    },
  },
});
