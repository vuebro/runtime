/**
 * @module vite.config
 * @file Vite configuration for the VueBro runtime Configures build options,
 *   external dependencies, and static asset copying
 */

import config from "@vuebro/configs/vite";
import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig, mergeConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

/**
 * List of dependencies to keep external during build
 *
 * @type {string[]}
 */
const external = ["vue", "vue-router", "@vuebro/loader-sfc"],
  /**
   * Configuration for static assets to be copied during build
   *
   * @type {{
   *   dest: string;
   *   file: string;
   *   name: string;
   *   rename: (fileName: string, fileExtension: string) => string;
   *   src: string;
   * }[]}
   */
  targets = external.map((key, i) => ({
    dest: "assets",
    file: "",
    name: key,
    /**
     * Renames the file with its version number
     *
     * @param {string} fileName - Original file name
     * @param {string} fileExtension - File extension
     * @returns {string} Versioned file name
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

/**
 * Export the merged Vite configuration Combines shared configuration with
 * project-specific build options
 *
 * @type {import("vite").UserConfig}
 */
export default mergeConfig(
  config,
  defineConfig({
    build: {
      /**
       * Generate manifest file for asset tracking
       */
      manifest: true,
      rollupOptions: {
        /**
         * External dependencies that shouldn't be bundled
         */
        external,
        output: {
          // manualChunks: (id) => {
          //   const [first, second] =
          //     id.split("node_modules/")[1]?.split("/") ?? [];
          //   return (
          //     first?.[0] === "@" && second ? `${first}-${second}` : first
          //   )?.replace(/^@/, "");
          // },
          /**
           * Custom chunk configuration for better code splitting
           */
          manualChunks: {
            /**
             * Shared dependencies chunk
             */
            shared: ["@vuebro/shared"],
            /**
             * UnoCSS related dependencies chunk
             */
            unocss: [
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
    /**
     * Vite plugins configuration
     */
    plugins: [
      /**
       * Plugin to copy external dependencies to dist folder
       */
      viteStaticCopy({ targets }),
      /**
       * Custom plugin to update manifest with external dependencies
       */
      {
        /**
         * Called when bundle is closed to update manifest file
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
