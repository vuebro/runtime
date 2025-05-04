import attributify from "@unocss/preset-attributify";
import icons from "@unocss/preset-icons/browser";
import tagify from "@unocss/preset-tagify";
import typography from "@unocss/preset-typography";
import wind4 from "@unocss/preset-wind4";
export default {
  presets: [
    wind4(),
    typography(),
    icons({ cdn: "https://cdn.jsdelivr.net/npm/" }),
    tagify(),
    attributify(),
  ],
};
