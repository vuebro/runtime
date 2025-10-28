import type { TPage } from "@vuebro/shared";

import { createHead } from "@unhead/vue/client";
import initUnocssRuntime from "@unocss/runtime";
import presets from "@vuebro/configs/uno/presets";
import { atlas, fetching, nodes, pages } from "@vuebro/shared";
import { toReactive } from "@vueuse/core";
import { consola } from "consola/browser";
import { createApp, watch } from "vue";
import { createRouter, createWebHistory } from "vue-router";

import vueApp from "@/App.vue";
import { pause, promises, scroll } from "@/stores/monolit";
import notFoundView from "@/views/NotFoundView.vue";
import pageView from "@/views/PageView.vue";
import rootView from "@/views/RootView.vue";
import "@/style.css";

const app = createApp(vueApp);

consola.info(
  "👊 VueBro / https://github.com/vuebro / runtime ver.:",
  __APP_VERSION__,
);

const jsonld = {
    async get(this: TPage) {
      if (this.id) await fetching(`./pages/${this.id}.jsonld`);
    },
  },
  { pathname } = new URL(document.baseURI);

(async () => {
  const [[page = {}], fonts] = (
    await Promise.all(
      ["index.json", "fonts.json"].map((file) => fetching(file)),
    )
  ).map((value) => value ?? []);
  nodes.push(page);
  await initUnocssRuntime({
    defaults: {
      presets: presets({
        webFontsOptions: {
          fonts: Object.fromEntries(
            fonts.map((font: string) => [
              font.toLowerCase().replace(/ /g, "_"),
              font,
            ]),
          ),
        },
      }),
    },
    ready: ({ extractAll, toggleObserver }) => {
      watch(pause, (value) => {
        toggleObserver(value);
      });
      const router = createRouter({
        history: createWebHistory(pathname),
        routes: [
          ...pages.value
            .filter(({ path }) => path !== undefined)
            .map((page) => {
              const {
                id: name,
                loc,
                path,
              } = page as { id: string; loc?: string; path: string };
              const alias = loc
                ?.replace(/ /g, "_")
                .replace(/^\/?/, "/")
                .replace(/\/?$/, "/");
              return {
                ...(alias && { alias }),
                children: [{ component: pageView, name, path: "" }],
                component: rootView,
                path: path.replace(/^\/?/, "/").replace(/\/?$/, "/"),
              };
            }),
          { component: notFoundView, name: "404", path: "/:pathMatch(.*)*" },
        ],
        scrollBehavior: async ({ hash, name, path }) => {
          if (name) {
            const [{ promise } = {}] = promises.values(),
              { index, parent: { flat } = {} } =
                (path === "/"
                  ? atlas.value[name as keyof object]?.$children[0]
                  : atlas.value[name as keyof object]) ?? {};
            pause.value = true;
            await promise;
            await Promise.all(
              [...promises.values()].map(({ promise }) => promise),
            );
            await extractAll();
            const routerScrollBehavior = scroll.value && {
              behavior: "smooth" as ScrollOptions["behavior"],
              ...(hash || (flat && index)
                ? { el: hash || `#${String(name)}` }
                : { left: 0, top: 0 }),
            };
            pause.value = false;
            scroll.value = true;
            return routerScrollBehavior;
          } else return false;
        },
      });
      router.beforeEach(({ path }) =>
        path !== decodeURI(path) ? decodeURI(path) : undefined,
      );
      app.use(router);
      return false;
    },
    rootElement: () => document.getElementById("app") ?? undefined,
  });
  pages.value.forEach((page) => {
    Object.defineProperties(page, { jsonld });
  });
  app.use(createHead()).provide("pages", toReactive(atlas)).mount("#app");
})().catch(consola.error);
