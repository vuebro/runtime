import type { Preset } from "@unocss/core";
import type { TPage } from "@vuebro/shared";

import { createHead } from "@unhead/vue/client";
import webFonts from "@unocss/preset-web-fonts";
import initUnocssRuntime from "@unocss/runtime";
import {
  atlas,
  consoleError,
  customFetch,
  getFontsObjectFromArray,
  nodes,
  pages,
} from "@vuebro/shared";
import { createApp, nextTick } from "vue";

import defaults from "../uno.config";
import vueApp from "./App.vue";
import { router, setScroll } from "./stores/monolit";
import "./style.css";

const app = createApp(vueApp),
  jsonld = {
    async get(this: TPage) {
      if (this.id) {
        try {
          const response = await fetch(`./pages/${this.id}.jsonld`);
          return response.ok ? ((await response.json()) as object) : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    },
  };
app.use(createHead());
const initRouter = (async () => {
  const response = await fetch("index.json"),
    [page = {} as TPage] = (await (
      response.ok ? response : new Response("[]")
    ).json()) as TPage[];
  nodes.push(page);
  await nextTick();
  pages.value.forEach(
    ({ flat, id: name, loc, parent, path: relative }, index, array) => {
      Object.defineProperties(array[index], { jsonld });
      if (relative !== undefined) {
        const alias = loc
          ?.replaceAll(" ", "_")
          .replace(/^\/?/, "/")
          .replace(/\/?$/, "/");
        router.addRoute({
          ...(alias && loc ? { alias } : { undefined }),
          children: [
            {
              component:
                (parent?.flat ?? flat)
                  ? () => import("./views/MultiView.vue")
                  : () => import("./views/SingleView.vue"),
              name,
              path: "",
            },
          ],
          component: () => import("./views/SingleView.vue"),
          path: relative.replace(/^\/?/, "/").replace(/\/?$/, "/"),
        });
      }
    },
  );
  app.provide("pages", atlas);
  router.addRoute({
    component: () => import("./views/NotFoundView.vue"),
    name: "404",
    path: "/:pathMatch(.*)*",
  });
})();
(async () => {
  const response = await fetch("fonts.json"),
    fonts = getFontsObjectFromArray(
      (await (response.ok ? response : new Response("[]")).json()) as string[],
    );
  defaults.presets.push(webFonts({ customFetch, fonts }) as Preset);
  await initUnocssRuntime({
    defaults,
    ready: async (runtime) => {
      const { toggleObserver } = runtime;
      setScroll(runtime);
      await initRouter;
      app.use(router);
      app.mount("#app");
      toggleObserver(true);
      return false;
    },
    rootElement: () => document.getElementById("app") ?? undefined,
  });
})().catch(consoleError);
window.console.info(
  "👊",
  "VueBro",
  `ver.: ${__APP_VERSION__}`,
  "https://github.com/vuebro",
);
