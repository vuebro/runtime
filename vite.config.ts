import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { version } from "vue";

export default defineConfig({
  base: "./",
  build: {
    manifest: true,
    rollupOptions: {
      external: ["vue", "vue-router"],
      output: {
        // manualChunks: (id) =>
        //   id.split("node_modules/")[1]?.split("/")[0]?.replace(/^@/, ""),
        manualChunks: (id) => {
          const [first, second] =
            id.split("node_modules/")[1]?.split("/") ?? [];
          return (
            first?.[0] === "@" && second ? `${first}-${second}` : first
          )?.replace(/^@/, "");
        },
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
      targets: Object.entries({
        vue: version,
        "vue-router": (
          await import("vue-router/package.json", { with: { type: "json" } })
        ).default.version,
      }).map(([key, value]) => ({
        dest: "assets",
        rename: (fileName: string, fileExtension: string) =>
          `${fileName}-${value}.${fileExtension}`,
        src: `./node_modules/${key}/dist/${key}.esm-browser.prod.js`,
      })),
    }),
  ],
  resolve: {
    alias: { "@": ".", app: fileURLToPath(new URL("..", import.meta.url)) },
  },
});
