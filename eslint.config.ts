/**
 * @module eslint.config
 * @file ESLint configuration for the VueBro runtime Extends shared
 *   configuration and adds project-specific options
 */

import shared from "@vuebro/configs/eslint";
import { defineConfig } from "eslint/config";

/**
 * Export the ESLint configuration combining shared settings with
 * project-specific options
 *
 * @type {import("eslint").Linter.Config}
 */
export default defineConfig(shared, {
  /**
   * Language-specific options for ESLint
   */
  languageOptions: {
    /**
     * Parser-specific options
     */
    parserOptions: {
      /**
       * Configuration for TypeScript project service Allows default project
       * settings for config files
       */
      projectService: { allowDefaultProject: ["*.config.ts"] },
      /**
       * Root directory for TypeScript configuration
       */
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
