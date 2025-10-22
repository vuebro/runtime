import type { TPage } from "@vuebro/shared";

import { createHead } from "@unhead/vue/client";
import initUnocssRuntime from "@unocss/runtime";
import presets from "@vuebro/configs/uno/presets";
import {
  atlas,
  fonts,
  getFontsObjectFromArray,
  nodes,
  pages,
} from "@vuebro/shared";
import { toReactive } from "@vueuse/core";
import { consola } from "consola/browser";
import { createApp, nextTick } from "vue";

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
  pages.value.forEach(({ id: name, loc, path: relative }, index, array) => {
    Object.defineProperties(array[index], { jsonld });
    if (relative !== undefined) {
      const alias = loc
        ?.replace(/ /g, "_")
        .replace(/^\/?/, "/")
        .replace(/\/?$/, "/");
      router.addRoute({
        ...(alias && loc ? { alias } : { undefined }),
        children: [
          {
            component: () => import("./views/PageView.vue"),
            name,
            path: "",
          },
        ],
        component: () => import("./views/RootView.vue"),
        path: relative.replace(/^\/?/, "/").replace(/\/?$/, "/"),
      });
    }
  });
  router.addRoute({
    component: () => import("./views/NotFoundView.vue"),
    name: "404",
    path: "/:pathMatch(.*)*",
  });
})();
(async () => {
  const response = await fetch("fonts.json");
  fonts.push(
    ...((await (
      response.ok ? response : new Response("[]")
    ).json()) as string[]),
  );
  await initUnocssRuntime({
    defaults: {
      presets: presets({
        webFontsOptions: { fonts: getFontsObjectFromArray(fonts) },
      }),
    },
    ready: async (runtime) => {
      const { toggleObserver } = runtime;
      setScroll(runtime);
      await initRouter;
      app.provide("pages", toReactive(atlas));
      app.use(router);
      await router.isReady();
      app.mount("#app");
      toggleObserver(true);
      return false;
    },
    rootElement: () => document.getElementById("app") ?? undefined,
  });
})().catch(consola.error);

consola.info(
  "👊 VueBro / https://github.com/vuebro / runtime ver.:",
  __APP_VERSION__,
);
