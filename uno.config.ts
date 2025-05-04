import attributify from "@unocss/preset-attributify";
import icons from "@unocss/preset-icons/browser";
import tagify from "@unocss/preset-tagify";
import typography from "@unocss/preset-typography";
import presetWind4 from "@unocss/preset-wind4";
export default {
  presets: [
    presetWind4(),
    typography(),
    icons({ cdn: "https://cdn.jsdelivr.net/npm/" }),
    tagify(),
    attributify(),
  ],
};
