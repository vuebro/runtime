import vue from "@vitejs/plugin-vue";
import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const external = ["vue", "vue-router", "@vuebro/loader-sfc"],
  targets = external.map((key, i) => ({
    dest: "assets",
    file: "",
    name: key,
    rename(fileName: string, fileExtension: string) {
      const { version } = JSON.parse(
        readFileSync(`node_modules/${key}/package.json`).toString(),
      ) as { version: string };
      const file = `${fileName}-${version}.${fileExtension}`;
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
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  plugins: [
    vue(),
    viteStaticCopy({ targets }),
    {
      closeBundle: () => {
        const path = "./dist/.vite/manifest.json";
        writeFileSync(
          path,
          JSON.stringify({
            ...JSON.parse(readFileSync(path).toString()),
            ...Object.fromEntries(
              targets.map(({ file, name, src }) => [
                src,
                { file, isStaticEntry: true, name },
              ]),
            ),
          }),
        );
      },
      name: "manifest",
    },
  ],
  resolve: { alias: { "@": "./src" } },
});
