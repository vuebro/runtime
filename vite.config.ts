/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { RollupOptions } from "rollup";
import type {
  AliasOptions,
  BuildOptions,
  PluginOption,
  UserConfig,
} from "vite";
import type { RenameFunc } from "vite-plugin-static-copy";

import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { version } from "vue";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const base = "./";

/* -------------------------------------------------------------------------- */

const manifest = true;

/* -------------------------------------------------------------------------- */

const app = fileURLToPath(new URL("..", import.meta.url));

/* -------------------------------------------------------------------------- */

const dest = "assets";

/* -------------------------------------------------------------------------- */

const src = "./node_modules/vue/dist/vue.esm-browser.prod.js";

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const manualChunks = (id: string) =>
  id.split("node_modules/")[1]?.split("/")[0]?.replace(/^@/, "");

/* -------------------------------------------------------------------------- */

const rename: RenameFunc = (fileName, fileExtension) =>
  `${fileName}-${version}.${fileExtension}`;

/* -------------------------------------------------------------------------- */
/*                                   Arrays                                   */
/* -------------------------------------------------------------------------- */

const external = ["vue"];

/* -------------------------------------------------------------------------- */

const targets = [{ dest, rename, src }];

/* -------------------------------------------------------------------------- */

const plugins: PluginOption[] = [vue(), viteStaticCopy({ targets })];

/* -------------------------------------------------------------------------- */
/*                                   Objects                                  */
/* -------------------------------------------------------------------------- */

const output = { manualChunks };

/* -------------------------------------------------------------------------- */

const rollupOptions: RollupOptions = { external, output };

/* -------------------------------------------------------------------------- */

const build: BuildOptions = { manifest, rollupOptions };

/* -------------------------------------------------------------------------- */

const define = {
  __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  __VUE_PROD_DEVTOOLS__: true,
};

/* -------------------------------------------------------------------------- */

const alias: AliasOptions = { "@": ".", app };

/* -------------------------------------------------------------------------- */

const resolve: UserConfig["resolve"] = { alias };

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export default defineConfig({ base, build, define, plugins, resolve });

/* -------------------------------------------------------------------------- */
