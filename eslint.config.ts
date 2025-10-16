import type { ConfigWithExtendsArray } from "@eslint/config-helpers";

import eslint from "@eslint/js";
import gitignore from "eslint-config-flat-gitignore";
import { flatConfigs } from "eslint-plugin-import-x";
import perfectionist from "eslint-plugin-perfectionist";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";
import globals from "globals";
import { configs, parser } from "typescript-eslint";
import vueParser from "vue-eslint-parser";

export default defineConfig(
  gitignore(),
  {
    languageOptions: {
      globals: globals.browser,
      parser: vueParser,
      parserOptions: {
        extraFileExtensions: [".vue"],
        parser,
        projectService: true,
      },
    },
  },
  eslint.configs.recommended,
  flatConfigs.recommended as ConfigWithExtendsArray,
  flatConfigs.typescript as ConfigWithExtendsArray,
  configs.strictTypeChecked,
  configs.stylisticTypeChecked,
  pluginVue.configs["flat/recommended"],
  perfectionist.configs["recommended-natural"],
  eslintPluginPrettierRecommended,
);
