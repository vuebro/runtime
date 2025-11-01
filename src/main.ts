/**
 * @module main
 * @file Main entry point for the VueBro runtime application. This file
 *   initializes the Vue app, sets up routing, and configures UnoCSS runtime. It
 *   handles page loading, font loading, scroll behavior, and intersection
 *   observer functionality.
 */

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

/**
 * Fetches the initial page data and fonts configuration from JSON files.
 *
 * @type {Array} An Array containing the first page and fonts array
 */
const [[page = {}], fonts] = (
    await Promise.all(
      ["index", "fonts"].map((file) => fetching(`${file}.json`)),
    )
  ).map((value) => value ?? []),
  /**
   * The Vue application instance
   *
   * @type {import("vue").App}
   */
  app = createApp(vueApp),
  /** The pathname from the document's base URI */
  { pathname } = new URL(document.baseURI);

consola.info(
  "👊 VueBro / https://github.com/vuebro / runtime ver.:",
  __APP_VERSION__,
);

nodes.push(page);

/**
 * Initialize UnoCSS runtime with the provided presets and font configurations
 */
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
   * Called when UnoCSS runtime is ready Sets up the Vue Router with scroll
   * behavior and intersection observer tracking
   *
   * @param {object} root0 - The runtime API object
   * @param {() => Promise<void>} root0.extractAll - Function to extract all CSS
   * @param {(enabled: boolean) => void} root0.toggleObserver - Function to
   *   toggle observer
   * @returns {boolean} Always returns false
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
         * Defines scroll behavior when navigating between routes
         *
         * @param {object} to - The target route
         * @param {string} to.hash - The hash of the target route
         * @param {string} to.name - The name of the target route
         * @returns {object | false} Scroll position object or false
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
      /** Scroll position tracking using VueUse */
      { x, y } = useScroll(window, {
        /**
         * Callback executed when scrolling stops Updates the route based on the
         * visible component
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

    /**
     * Global navigation guard to decode URI paths if needed
     *
     * @param {object} to - The target route
     * @param {string} to.path - The path of the target route
     * @returns {string | undefined} Decoded path or undefined
     */
    router.beforeEach(({ path }) =>
      path !== decodeURI(path) ? decodeURI(path) : undefined,
    );

    app.use(router);

    return false;
  },
  /**
   * Returns the root element for the application
   *
   * @returns {HTMLElement | null} The root app element or null if not found
   */
  rootElement: () => document.getElementById("app") ?? undefined,
});

/**
 * Mounts the Vue application to the DOM after setting up the head and providing
 * page data
 */
app.use(createHead()).provide("pages", toReactive(atlas)).mount("#app");
