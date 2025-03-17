import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

import { dependencies } from "./package.json";
export default defineConfig({
  base: "./",
  build: {
    manifest: true,
    rollupOptions: {
      external: ["vue", "vue-router"],
      output: {
        manualChunks: (id) =>
          id.split("node_modules/")[1]?.split("/")[0]?.replace(/^@/, ""),
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __VUE_PROD_DEVTOOLS__: true,
  },
  plugins: [
    vue(),
    viteStaticCopy({
      targets: ["vue", "vue-router"].map((value) => ({
        dest: "assets",
        rename: (fileName: string, fileExtension: string) =>
          `${fileName}-${dependencies[value as keyof typeof dependencies].replace(/^\^/, "")}.${fileExtension}`,
        src: `./node_modules/${value}/dist/${value}.esm-browser.prod.js`,
      })),
    }),
  ],
  resolve: {
    alias: { "@": ".", app: fileURLToPath(new URL("..", import.meta.url)) },
  },
});
