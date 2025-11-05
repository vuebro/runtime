import { createHead } from "@unhead/vue/client";
import initUnocssRuntime from "@unocss/runtime";
import presets from "@vuebro/configs/uno/presets";
import { atlas, fetching, nodes, pages } from "@vuebro/shared";
import { toReactive, useScroll } from "@vueuse/core";
import { consola } from "consola/browser";
import { ofetch as customFetch } from "ofetch";
import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";

import vueApp from "@/App.vue";
import {
  $these,
  intersecting,
  promises,
  root,
  routeName,
  that,
} from "@/stores/monolit";
import "@/style.css";
import notFoundView from "@/views/NotFoundView.vue";
import pageView from "@/views/PageView.vue";
import rootView from "@/views/RootView.vue";

const [[page = {}], fonts] = (
    await Promise.all(
      ["index", "fonts"].map((file) => fetching(`${file}.json`)),
    )
  ).map((value) => value ?? []),
  app = createApp(vueApp),
  { pathname } = new URL(document.baseURI);

consola.info(
  "👊 VueBro / https://github.com/vuebro / runtime ver.:",
  __APP_VERSION__,
);

nodes.push(page);

await initUnocssRuntime({
  defaults: {
    presets: presets({
      webFontsOptions: {
        customFetch,
        fonts: Object.fromEntries(
          fonts.map((font: string) => [
            font.toLowerCase().replace(/ /g, "_"),
            font,
          ]),
        ),
      },
    }),
  },
  /**
   * Callback function called when the application is ready
   *
   * @param root0 The root object containing initialization functions
   * @param root0.extractAll Function to extract all components
   * @param root0.toggleObserver Function to toggle the intersection observer
   * @returns Returns false to indicate completion
   */
  ready: ({ extractAll, toggleObserver }) => {
    let scrollLock = false;

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
        /**
         * Defines the scroll behavior for router navigation
         *
         * @param root0 The root object
         * @param root0.hash The hash value for scrolling to an element
         * @param root0.name The route name
         * @returns Scroll options or false
         */
        scrollBehavior: async ({ hash, name }) => {
          if (name) {
            routeName.value = name;
            if (scrollLock) scrollLock = false;
            else {
              const { index, parent: { flat } = {} } = that.value ?? {};
              toggleObserver(true);
              await root.promise;
              await Promise.all(
                [...promises.values()].map(({ promise }) => promise),
              );
              await extractAll();
              toggleObserver(false);
              if ("requestIdleCallback" in window)
                await new Promise((resolve) => requestIdleCallback(resolve));
              else {
                await new Promise((resolve) => requestAnimationFrame(resolve));
                await new Promise((resolve) => setTimeout(resolve));
              }
              return {
                behavior: "smooth" as ScrollOptions["behavior"],
                ...(hash || (flat && index)
                  ? { el: hash || `#${String(name)}` }
                  : { left: 0, top: 0 }),
              };
            }
          }
          return false;
        },
      }),
      { x, y } = useScroll(window, {
        /**
         * Callback when scrolling stops
         */
        onStop: () => {
          const [first] = $these.value,
            [root] = pages.value;
          if (root && first) {
            const { $children: [{ id } = {}] = [] } = root;
            const name =
              !Math.floor(x.value) && !Math.floor(y.value) && first.id === id
                ? root.id
                : ([...intersecting.entries()].find(
                    ([, value]) => value,
                  )?.[0] ?? first.id);
            if (name !== routeName.value) {
              scrollLock = true;
              router.push({ name }).catch(consola.error);
            }
          }
        },
      });

    router.beforeEach(({ path }) =>
      path !== decodeURI(path) ? decodeURI(path) : undefined,
    );

    app.use(router);

    return false;
  },
  /**
   * Returns the root element for the application
   *
   * @returns The root element or undefined if not found
   */
  rootElement: () => document.getElementById("app") ?? undefined,
});

app.use(createHead()).provide("pages", toReactive(atlas)).mount("#app");
