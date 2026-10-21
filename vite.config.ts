import { defineConfig } from "vite";

// Extension pages (popup and options). The content script has its own build in
// vite.content.config.ts because it can't be an ES module.

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
