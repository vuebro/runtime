import type { RuntimeContext } from "@unocss/runtime";
import type { TPage } from "@vues3/shared";
import type { AsyncComponentLoader } from "vue";
import type {
  AbstractPath,
  File,
  ModuleExport,
  Options,
} from "vue3-sfc-loader";
import type { RouteRecordRaw, RouterScrollBehavior } from "vue-router";

import { importmap, pages } from "@vues3/shared";
import { useStyleTag } from "@vueuse/core";
import { v4 } from "uuid";
import * as vue from "vue";
import { computed, defineAsyncComponent, ref } from "vue";
import { loadModule } from "vue3-sfc-loader";
import { createRouter, createWebHistory } from "vue-router";

/* -------------------------------------------------------------------------- */

let onScroll: RouterScrollBehavior | undefined;

/* -------------------------------------------------------------------------- */

const behavior = "smooth",
  left = 0,
  moduleCache: ModuleExport = { vue },
  paused = ref(true),
  promises = new Map<string, PromiseWithResolvers<undefined>>(),
  scroll = ref(true),
  threshold = 0.1,
  top = 0;

const { pathname } = new URL(document.baseURI);
const history = createWebHistory(pathname),
  routes: RouteRecordRaw[] = [],
  scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) =>
    onScroll && onScroll(to, from, savedPosition),
  router = createRouter({ history, routes, scrollBehavior });
const a = computed(() =>
    pages.value.find(({ id }) => id === router.currentRoute.value.name),
  ),
  that = computed(() =>
    router.currentRoute.value.path === "/" ? a.value?.$children[0] : a.value,
  );
const siblings = computed(() => that.value?.siblings ?? []);
const $siblings = computed(() =>
  siblings.value.filter(({ enabled }) => enabled),
);

const promiseWithResolvers = <T>() => {
  let resolve: PromiseWithResolvers<T>["resolve"] | undefined;
  let reject: PromiseWithResolvers<T>["reject"] | undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve } as PromiseWithResolvers<T>;
};

const addStyle: Options["addStyle"] = (style, id) => {
    useStyleTag(style, { ...(id && { id }) });
  },
  handleModule = async (
    type: string,
    getContentData: File["getContentData"],
    path: AbstractPath,
    options: Options,
  ) => {
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
  log: Options["log"] = (type, ...args) => {
    (
      window.console[type as keyof Console] as (
        ...optionalParams: string[]
      ) => void
    )(...args.map((value: string) => decodeURIComponent(value)));
  },
  module = ({ id = v4() }) => {
    const type = "js";
    const abstractPath = `${id}.vue`;
    promises.set(id, promiseWithResolvers());
    const getFile = async (filePath: string) => {
      const { imports } = importmap;
      const getContentData = () => import(filePath);
      const fileName = filePath.split("/").pop();
      switch (true) {
        case filePath === abstractPath:
          return (await fetch(`./pages/${filePath}`)).text();
        case Object.keys(imports).some((value) => filePath.startsWith(value)):
          return { getContentData, type };
        default:
          return (
            await fetch(
              fileName === fileName?.split(".").pop()
                ? `${filePath}.js`
                : filePath,
            )
          ).text();
      }
    };
    return defineAsyncComponent((async () =>
      loadModule(abstractPath, {
        addStyle,
        getFile,
        handleModule,
        log,
        moduleCache,
      } as unknown as Options)) as AsyncComponentLoader<Promise<object>>);
  },
  resolve = ({ id } = {} as TPage) => {
    if (id) promises.get(id)?.resolve(undefined);
  },
  setScroll = ({ extractAll, toggleObserver }: RuntimeContext) => {
    const all = async () => {
      paused.value = true;
      toggleObserver(false);
      {
        const [{ promise } = {}] = promises.values();
        await promise;
      }
      await Promise.all([...promises.values()].map(({ promise }) => promise));
      await extractAll();
      toggleObserver(true);
      paused.value = false;
    };
    onScroll = async ({ name }) =>
      new Promise((res) => {
        if (name) {
          all().then(
            () => {
              const el = `#${String(name)}`;
              res(
                scroll.value && {
                  behavior,
                  ...(that.value?.parent?.flat && that.value.index
                    ? { el }
                    : { left, top }),
                },
              );
              scroll.value = true;
            },
            () => {
              res(false);
            },
          );
        } else res(false);
      });
  };

/* -------------------------------------------------------------------------- */

router.beforeEach(({ path }) =>
  path !== decodeURI(path) ? decodeURI(path) : undefined,
);

/* -------------------------------------------------------------------------- */

export {
  $siblings,
  a,
  behavior,
  module,
  paused,
  promises,
  resolve,
  router,
  scroll,
  setScroll,
  that,
  threshold,
};
