/**
 * @module uno.config
 * @file UnoCSS configuration for the VueBro runtime Sets up UnoCSS with custom
 *   presets and configuration
 */

import config from "@vuebro/configs/uno";
import presets from "@vuebro/configs/uno/presets";
import { defineConfig } from "unocss";

/**
 * Export the UnoCSS configuration combining presets with base configuration
 *
 * @type {import("unocss").UserConfig}
 */
export default defineConfig({
  /**
   * The UnoCSS presets to be used in the application
   */
  presets: presets(),
  /**
   * Additional UnoCSS configuration options
   */
  ...config,
});
