import eslint from "@eslint/js";
import { flatConfigs } from "eslint-plugin-import-x";
import perfectionist from "eslint-plugin-perfectionist";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";
import globals from "globals";
import { configs, parser } from "typescript-eslint";
import vueParser from "vue-eslint-parser";

export default defineConfig(
  { ignores: ["**/dist"] },
  {
    rules: {
      "@typescript-eslint/no-use-before-define": ["error", "nofunc"],
      "import-x/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: ["**/eslint.config.ts", "**/vite.config.ts"],
          optionalDependencies: false,
        },
      ],
    },
  },
  {
    languageOptions: {
      globals: { ...globals.browser },
      parser: vueParser,
      parserOptions: {
        extraFileExtensions: [".vue"],
        parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  eslint.configs.recommended,
  //@ts-expect-error Argument of type 'PluginFlatConfig' is not assignable to parameter of type 'InfiniteArray<ConfigWithExtends>'.
  flatConfigs.recommended,
  flatConfigs.typescript,
  configs.strictTypeChecked,
  configs.stylisticTypeChecked,
  ...pluginVue.configs["flat/recommended"],
  perfectionist.configs["recommended-natural"],
  eslintPluginPrettierRecommended,
);
