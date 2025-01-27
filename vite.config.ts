import type { RenameFunc } from "vite-plugin-static-copy";

import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { version } from "vue";

/* -------------------------------------------------------------------------- */

const app = fileURLToPath(new URL("..", import.meta.url)),
  alias = { "@": ".", app },
  base = "./",
  define = {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __VUE_PROD_DEVTOOLS__: true,
  },
  dest = "assets",
  external = ["vue"],
  manifest = true,
  resolve = { alias },
  src = "./node_modules/vue/dist/vue.esm-browser.prod.js";

const manualChunks = (id: string) =>
    id.split("node_modules/")[1]?.split("/")[0]?.replace(/^@/, ""),
  rename: RenameFunc = (fileName, fileExtension) =>
    `${fileName}-${version}.${fileExtension}`;

const output = { manualChunks },
  rollupOptions = { external, output },
  build = { manifest, rollupOptions },
  targets = [{ dest, rename, src }],
  plugins = [vue(), viteStaticCopy({ targets })];

/* -------------------------------------------------------------------------- */

export default defineConfig({ base, build, define, plugins, resolve });
