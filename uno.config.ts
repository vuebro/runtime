import attributify from "@unocss/preset-attributify";
import icons from "@unocss/preset-icons/browser";
import tagify from "@unocss/preset-tagify";
import typography from "@unocss/preset-typography";
import wind3 from "@unocss/preset-wind3";
export default {
  presets: [
    wind3(),
    typography(),
    icons({ cdn: "https://cdn.jsdelivr.net/npm/" }),
    tagify(),
    attributify(),
  ],
};
