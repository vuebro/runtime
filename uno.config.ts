import config from "@vuebro/configs/uno";
import presets from "@vuebro/configs/uno/presets";
import { defineConfig } from "unocss";

export default defineConfig({ presets: presets(), ...config });
