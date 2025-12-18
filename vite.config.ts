import type { HtmlTagDescriptor } from "vite";

import inject from "@rollup/plugin-inject";
import config from "@vuebro/configs/vite";
import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig, mergeConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const external = ["vue", "vue-router", "@vuebro/loader-sfc"],
  targets = external.map((key, i) => ({
    dest: "assets",
    file: "",
    name: key,
    rename(fileName: string, fileExtension: string) {
      if (targets[i].file)
        return targets[i].file.split("/").pop() ?? targets[i].file;
      else {
        const { version } = JSON.parse(
          readFileSync(`node_modules/${key}/package.json`).toString(),
        ) as { version: string };
        const file = `${fileName}-${version}.${fileExtension}`;
        targets[i].file = `${targets[i].dest}/${file}`;
        return file;
      }
    },
    src: `node_modules/${key}/dist/${
      key.split("/").pop() ?? key
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
            katex: ["katex"],
            markdown: [
              "markdown-it",
              "markdown-it-mdc",
              "@mdit/plugin-katex",
              "@mdit/plugin-abbr",
              "@mdit/plugin-dl",
              "@mdit/plugin-footnote",
              "@mdit/plugin-icon",
              "@mdit/plugin-ins",
              "@mdit/plugin-mark",
              "@mdit/plugin-sub",
              "@mdit/plugin-sup",
              "@mdit/plugin-tasklist",
              "@mdit-vue/plugin-component",
              "@mdit-vue/plugin-frontmatter",
              "@mdit-vue/plugin-sfc",
              "@mdit-vue/plugin-toc",
            ],
            shared: ["@vuebro/shared"],
          },
        },
        plugins: [inject({ Buffer: ["buffer", "Buffer"] })],
      },
    },
    plugins: [
      viteStaticCopy({ targets }),
      {
        closeBundle() {
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
      {
        name: "importmap",
        transformIndexHtml() {
          const imports = Object.fromEntries(
            targets.map((target) => [
              target.name,
              `./assets/${target.rename(
                `${target.name.split("/").pop() ?? target.name}.esm-browser.prod`,
                "js",
              )}`,
            ]),
          );
          return [
            {
              attrs: { type: "importmap" },
              children: JSON.stringify({ imports }),
              injectTo: "head",
              tag: "script",
            },
            ...Object.values(imports).map(
              (href) =>
                ({
                  attrs: { crossorigin: true, href, rel: "modulepreload" },
                  injectTo: "head",
                  tag: "link",
                }) as HtmlTagDescriptor,
            ),
          ];
        },
      },
    ],
  }),
);
