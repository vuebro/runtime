import config from "@vuebro/configs/vite";
import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig, mergeConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const external = ["vue", "vue-router", "@vuebro/loader-sfc"],
  targets = external.map((key, i) => ({
    dest: "assets",
    file: "",
    name: key,
    /**
     * Renames the file with the package version
     *
     * @param fileName The original file name
     * @param fileExtension The file extension
     * @returns The new file name with version
     */
    rename(fileName: string, fileExtension: string) {
      const { version } = JSON.parse(
        readFileSync(`node_modules/${key}/package.json`).toString(),
      ) as { version: string };
      const file = `${fileName}-${version}.${fileExtension}`;
      if (targets[i]) targets[i].file = `${targets[i].dest}/${file}`;
      return file;
    },
    src: `node_modules/${key}/dist/${
      key.split("/").pop() ?? ""
    }.esm-browser.prod.js`,
  }));

export default mergeConfig(
  config,
  defineConfig({
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
            markdown: [
              "markdown-it",
              "markdown-it-abbr",
              "markdown-it-deflist",
              "markdown-it-emoji",
              "markdown-it-footnote",
              "markdown-it-ins",
              "markdown-it-mark",
              "markdown-it-sub",
              "markdown-it-sup",
              "markdown-it-task-lists",
              "@mdit-vue/plugin-component",
              "@mdit-vue/plugin-frontmatter",
              "@mdit-vue/plugin-sfc",
              "@mdit-vue/plugin-toc",
            ],
            mermaid: ["@datatraccorporation/markdown-it-mermaid"],
            shared: ["@vuebro/shared"],
          },
        },
      },
    },
    plugins: [
      viteStaticCopy({ targets }),
      {
        /**
         * Function called when the bundle is closed to update the manifest.json
         */
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
  }),
);
