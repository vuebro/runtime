import vue from "@vitejs/plugin-vue";
import { createRequire } from "module";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const external = ["vue", "vue-router", "@vuebro/loader-sfc"],
  require = createRequire(import.meta.url);

export default defineConfig({
  base: "./",
  build: {
    manifest: true,
    rollupOptions: {
      external,
      output: {
        // manualChunks: (id) => {
        //   const [first, second] =
        //     id.split("node_modules/")[1]?.split("/") ?? [];
        //   return (
        //     first?.[0] === "@" && second ? `${first}-${second}` : first
        //   )?.replace(/^@/, "");
        // },
        manualChunks: {
          shared: ["@vuebro/shared"],
          unocss: [
            "@unocss/core",
            "@unocss/preset-attributify",
            "@unocss/preset-tagify",
            "@unocss/preset-typography",
            "@unocss/preset-web-fonts",
            "@unocss/preset-wind4",
            "@unocss/runtime",
          ],
        },
      },
    },
  },
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version) },
  plugins: [
    vue({ features: { prodDevtools: true } }),
    viteStaticCopy({
      targets: external.map((key) => ({
        dest: "assets",
        rename: (fileName: string, fileExtension: string) =>
          `${fileName}-${
            (require(`${key}/package.json`) as { version: string }).version
          }.${fileExtension}`,
        src: `./node_modules/${key}/dist/${key.split("/").pop() ?? ""}.esm-browser.prod.js`,
      })),
    }),
  ],
  resolve: {
    alias: { "@": ".", app: fileURLToPath(new URL("..", import.meta.url)) },
  },
});
