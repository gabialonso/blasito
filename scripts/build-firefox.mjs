import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const chrome = JSON.parse(readFileSync("dist/manifest.json", "utf8"));
const firefox = {};

for (const [key, value] of Object.entries(chrome)) {
  if (key === "minimum_chrome_version") continue;
  if (key === "options_page") {
    firefox.options_ui = { page: value, open_in_tab: true };
    continue;
  }
  firefox[key] = value;
}

firefox.browser_specific_settings = {
  gecko: {
    id: "blasito@usuallygabo",
    // first desktop version that shows data_collection_permissions at install.
    strict_min_version: "140.0",
    data_collection_permissions: { required: ["none"] },
  },
  gecko_android: { strict_min_version: "142.0" },
};

rmSync("dist-firefox", { recursive: true, force: true });
cpSync("dist", "dist-firefox", { recursive: true });
writeFileSync("dist-firefox/manifest.json", `${JSON.stringify(firefox, null, 2)}\n`);
