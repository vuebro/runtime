import type { RollupOptions } from "rollup";
import type { AliasOptions, BuildOptions, PluginOption } from "vite";
import type { RenameFunc } from "vite-plugin-static-copy";

import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { version } from "vue";

const base = "./";
const build: BuildOptions = (() => {
  const manifest = true;
  const rollupOptions: RollupOptions = (() => {
    const output = (() => {
      const manualChunks = (id: string) =>
        id.split("node_modules/")[1]?.split("/")[0]?.replace(/^@/, "");
      return { manualChunks };
    })();
    const external = ["vue"];
    return { external, output };
  })();
  return { manifest, rollupOptions };
})();
const define = {
  __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  __VUE_PROD_DEVTOOLS__: true,
};
const plugins: PluginOption[] = (() => {
  const targets = (() => {
    const dest = "assets";
    const src = "./node_modules/vue/dist/vue.esm-browser.prod.js";
    const rename: RenameFunc = (fileName, fileExtension) =>
      `${fileName}-${version}.${fileExtension}`;
    return [{ dest, rename, src }];
  })();
  return [vue(), viteStaticCopy({ targets })];
})();
const resolve = (() => {
  const alias: AliasOptions = (() => {
    const app = fileURLToPath(new URL("..", import.meta.url));
    return { "@": ".", app };
  })();
  return { alias };
})();
export default defineConfig({ base, build, define, plugins, resolve });
