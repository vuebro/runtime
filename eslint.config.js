import eslint from "@eslint/js";
import eslintPluginImportX from "eslint-plugin-import-x";
import perfectionist from "eslint-plugin-perfectionist";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { configs as sonarjs } from "eslint-plugin-sonarjs";
import pluginVue from "eslint-plugin-vue";
import tseslint, { configs, parser } from "typescript-eslint";
import vueParser from "vue-eslint-parser";

/* -------------------------------------------------------------------------- */

const extraFileExtensions = [".vue"],
  files = ["**/*.js"],
  ignores = ["**/dist"],
  projectService = true,
  tsconfigRootDir = import.meta.dirname,
  parserOptions = {
    extraFileExtensions,
    parser,
    projectService,
    tsconfigRootDir,
  },
  languageOptions = { parser: vueParser, parserOptions },
  rules = {
    "@typescript-eslint/no-use-before-define": ["error", "nofunc"],
    "import-x/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["**/eslint.config.js", "**/vite.config.ts"],
        optionalDependencies: false,
      },
    ],
  };

/* -------------------------------------------------------------------------- */

export default tseslint.config(
  { ignores },
  { rules },
  { languageOptions },
  eslint.configs.recommended,
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.typescript,
  configs.strictTypeChecked,
  configs.stylisticTypeChecked,
  { extends: [configs.disableTypeChecked], files },
  ...pluginVue.configs["flat/recommended"],
  sonarjs.recommended,
  perfectionist.configs["recommended-natural"],
  eslintPluginPrettierRecommended,
);
