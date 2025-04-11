import type { RuntimeContext } from "@unocss/runtime";
import type { TPage } from "@vues3/shared";
import type { AsyncComponentLoader } from "vue";
import type { RouterScrollBehavior } from "vue-router";

import { importmap, pages } from "@vues3/shared";
import { loadModule } from "@vues3/vue3-sfc-loader";
import { useStyleTag } from "@vueuse/core";
import { v4 } from "uuid";
import * as vue from "vue";
import { computed, defineAsyncComponent, ref } from "vue";
import * as vueRouter from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
let onScroll: RouterScrollBehavior | undefined;
const { pathname } = new URL(document.baseURI);
const router = createRouter({
  history: createWebHistory(pathname),
  routes: [],
  scrollBehavior: (to, from, savedPosition) =>
    onScroll && onScroll(to, from, savedPosition),
});
const a = computed(() =>
    pages.value.find(({ id }) => id === router.currentRoute.value.name),
  ),
  behavior: ScrollOptions["behavior"] = "smooth",
  paused = ref(true),
  promises = new Map<string, PromiseWithResolvers<undefined>>(),
  promiseWithResolvers = <T>() => {
    let resolve: PromiseWithResolvers<T>["resolve"] | undefined;
    let reject: PromiseWithResolvers<T>["reject"] | undefined;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, reject, resolve } as PromiseWithResolvers<T>;
  },
  scroll = ref(true),
  that = computed(() =>
    router.currentRoute.value.path === "/" ? a.value?.$children[0] : a.value,
  );
const siblings = computed(() => that.value?.siblings ?? []);
const $siblings = computed(() =>
  siblings.value.filter(({ enabled }) => enabled),
);
const module = ({ id = v4() }) => {
    promises.set(id, promiseWithResolvers());
    return defineAsyncComponent((async () =>
      loadModule(`${id}.vue`, {
        addStyle: (style, id) => {
          useStyleTag(style, { ...(id && { id }) });
        },
        getFile: async (filePath: string) => {
          const { imports } = importmap;
          const fileName = filePath.split("/").pop();
          switch (true) {
            case filePath === `${id}.vue`:
              return (await fetch(`./pages/${filePath}`)).text();
            case Object.keys(imports).some((value) =>
              filePath.startsWith(value),
            ):
              return { getContentData: () => import(filePath), type: "js" };
            default:
              return (
                await fetch(
                  fileName === fileName?.split(".").pop()
                    ? `${filePath}.js`
                    : filePath,
                )
              ).text();
          }
        },
        // @ts-expect-error  Type 'undefined' is not assignable to type 'ModuleExport'
        handleModule: async (type, getContentData, path, options) => {
          switch (type) {
            case ".css":
              options.addStyle(
                (await getContentData(false)) as string,
                path.toString(),
              );
              return null;
            // case "css": {
            //   const { default: css } = (await getContentData(false)) as unknown as {
            //     default: CSSStyleSheet;
            //   };
            //   document.adoptedStyleSheets = [...document.adoptedStyleSheets, css];
            //   return null;
            // }
            case "js":
              return getContentData(false);
            default:
              return undefined;
          }
        },
        log: (type, ...args) => {
          (
            window.console[type as keyof Console] as (
              ...optionalParams: string[]
            ) => void
          )(...args.map((value: string) => decodeURIComponent(value)));
        },
        moduleCache: { vue, "vue-router": vueRouter },
      })) as AsyncComponentLoader<Promise<object>>);
  },
  resolve = ({ id } = {} as TPage) => {
    if (id) promises.get(id)?.resolve(undefined);
  },
  setScroll = ({ extractAll, toggleObserver }: RuntimeContext) => {
    onScroll = async ({ name }) => {
      if (name) {
        paused.value = true;
        toggleObserver(false);
        const [{ promise } = {}] = promises.values();
        await promise;
        await Promise.all([...promises.values()].map(({ promise }) => promise));
        await extractAll();
        toggleObserver(true);
        const routerScrollBehavior = scroll.value && {
          behavior,
          ...(that.value?.parent?.flat && that.value.index
            ? { el: `#${String(name)}` }
            : { left: 0, top: 0 }),
        };
        paused.value = false;
        scroll.value = true;
        return routerScrollBehavior;
      } else return false;
    };
  };
router.beforeEach(({ path }) =>
  path !== decodeURI(path) ? decodeURI(path) : undefined,
);
export {
  $siblings,
  a,
  module,
  paused,
  promises,
  resolve,
  router,
  scroll,
  setScroll,
  that,
};
