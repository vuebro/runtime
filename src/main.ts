import type { Preset } from "@unocss/core";
import type { TImportmap, TPage } from "@vues3/shared";
import type { Component } from "vue";

import { createHead } from "@unhead/vue";
import webFonts from "@unocss/preset-web-fonts";
import "@unocss/reset/tailwind-compat.css";
import initUnocssRuntime from "@unocss/runtime";
import {
  atlas,
  consoleError,
  customFetch,
  getFontsObjectFromArray,
  importmap,
  nodes,
  pages,
} from "@vues3/shared";
import { computed, createApp, nextTick, readonly, shallowReadonly } from "vue";

import defaults from "../uno.config";
import vueApp from "./App.vue";
import { router, setScroll } from "./stores/monolit";
import "./style.css";
const id = computed(() => router.currentRoute.value.name),
  initRouter = (async () => {
    const [{ imports }, [page = {} as TPage]] = await Promise.all(
      ["index.importmap", "index.json"].map(async (value, index) => {
        const body = index ? "[]" : "{}",
          response = await fetch(value);
        return (response.ok ? response : new Response(body)).json() as Promise<
          TImportmap | TPage[]
        >;
      }) as [Promise<TImportmap>, Promise<TPage[]>],
    );
    importmap.imports = imports;
    nodes.push(page);
    await nextTick();
    window.app.provide("pages", shallowReadonly(atlas));
    pages.value.forEach(({ flat, id: name, loc, parent, path: relative }) => {
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
    });
    router.addRoute({
      component: () => import("./views/NotFoundView.vue"),
      name: "404",
      path: "/:pathMatch(.*)*",
    });
  })();
const rootElement = () => document.getElementById("app") ?? undefined;
window.app = createApp(vueApp as Component);
window.app.use(createHead());
window.app.provide("id", readonly(id));
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
      window.app.use(router);
      window.app.mount(rootElement());
      toggleObserver(true);
      return false;
    },
    rootElement,
  });
})().catch(consoleError);
window.console.info(
  "⛵",
  "vueS3",
  `ver.: ${__APP_VERSION__}`,
  "https://github.com/vues3",
);
