import eslint from "@eslint/js";
import { flatConfigs } from "eslint-plugin-import-x";
import perfectionist from "eslint-plugin-perfectionist";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tseslint, { configs, parser } from "typescript-eslint";
import vueParser from "vue-eslint-parser";
export default tseslint.config(
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
  flatConfigs.recommended,
  flatConfigs.typescript,
  configs.strictTypeChecked,
  configs.stylisticTypeChecked,
  ...pluginVue.configs["flat/recommended"],
  perfectionist.configs["recommended-natural"],
  eslintPluginPrettierRecommended,
);
