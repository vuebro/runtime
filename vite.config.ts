import vue from "@vitejs/plugin-vue";
import { createRequire } from "module";
import fs from "node:fs";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const external = ["vue", "vue-router", "@vuebro/loader-sfc"],
  isStaticEntry = true,
  require = createRequire(import.meta.url),
  targets = external.map((key, i) => ({
    dest: "assets",
    file: "",
    name: key,
    rename(fileName: string, fileExtension: string) {
      const file = `${fileName}-${
        (require(`${key}/package.json`) as { version: string }).version
      }.${fileExtension}`;
      if (targets[i]) targets[i].file = `${targets[i].dest}/${file}`;
      return file;
    },
    src: `node_modules/${key}/dist/${key.split("/").pop() ?? ""}.esm-browser.prod.js`,
  }));

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
            "ofetch",
          ],
        },
      },
    },
  },
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version) },
  plugins: [
    vue({ features: { prodDevtools: true } }),
    viteStaticCopy({ targets }),
    {
      closeBundle: () => {
        const path = "./dist/.vite/manifest.json";
        fs.writeFileSync(
          path,
          JSON.stringify({
            ...JSON.parse(fs.readFileSync(path).toString()),
            ...Object.fromEntries(
              targets.map(({ file, name, src }) => [
                src,
                { file, isStaticEntry, name },
              ]),
            ),
          }),
        );
      },
      name: "manifest",
    },
  ],
  resolve: {
    alias: { "@": ".", app: fileURLToPath(new URL("..", import.meta.url)) },
  },
});
