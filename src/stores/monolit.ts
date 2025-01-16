/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { RuntimeContext } from "@unocss/runtime";
import type { TPage } from "@vues3/shared";
import type { AsyncComponentLoader, ComputedRef, Ref } from "vue";
import type {
  AbstractPath,
  ContentData,
  File,
  ModuleExport,
  Options,
} from "vue3-sfc-loader";
import type {
  RouteLocationNormalizedGeneric,
  Router,
  RouteRecordRaw,
  RouterHistory,
  RouterScrollBehavior,
} from "vue-router";

import { importmap, pages } from "@vues3/shared";
import { useStyleTag } from "@vueuse/core";
import { v4 } from "uuid";
import * as vue from "vue";
import { computed, defineAsyncComponent, ref } from "vue";
import { loadModule } from "vue3-sfc-loader";
import { createRouter, createWebHistory } from "vue-router";

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */

let onScroll: RouterScrollBehavior | undefined;

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) =>
  onScroll && onScroll(to, from, savedPosition);

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const behavior = "smooth";

/* -------------------------------------------------------------------------- */

const threshold = 0.1;

/* -------------------------------------------------------------------------- */

const top = 0;

/* -------------------------------------------------------------------------- */

const left = 0;

/* -------------------------------------------------------------------------- */
/*                                    Maps                                    */
/* -------------------------------------------------------------------------- */

const promises: Map<string, PromiseWithResolvers<null>> = new Map<
  string,
  PromiseWithResolvers<null>
>();

/* -------------------------------------------------------------------------- */
/*                                   Arrays                                   */
/* -------------------------------------------------------------------------- */

const routes: RouteRecordRaw[] = [];

/* -------------------------------------------------------------------------- */
/*                                   Objects                                  */
/* -------------------------------------------------------------------------- */

const moduleCache: ModuleExport = { vue };

/* -------------------------------------------------------------------------- */

const { pathname }: { pathname: string } = new URL(document.baseURI);

/* -------------------------------------------------------------------------- */

const history: RouterHistory = createWebHistory(pathname);

/* -------------------------------------------------------------------------- */

const router: Router = createRouter({ history, routes, scrollBehavior });

/* -------------------------------------------------------------------------- */
/*                                 References                                 */
/* -------------------------------------------------------------------------- */

const scroll: Ref<boolean> = ref(true);

/* -------------------------------------------------------------------------- */

const paused: Ref<boolean> = ref(true);

/* -------------------------------------------------------------------------- */
/*                                Computations                                */
/* -------------------------------------------------------------------------- */

const a: ComputedRef<null | TPage> = computed(
  () =>
    pages.value.find(({ id }) => id === router.currentRoute.value.name) ?? null,
);

/* -------------------------------------------------------------------------- */

const that: ComputedRef<null | TPage> = computed(
  () =>
    (router.currentRoute.value.path === "/"
      ? a.value?.$children[0]
      : a.value) ?? null,
);

/* -------------------------------------------------------------------------- */

const siblings: ComputedRef<TPage[]> = computed(
  () => that.value?.siblings ?? [],
);

/* -------------------------------------------------------------------------- */

const $siblings: ComputedRef<TPage[]> = computed(() =>
  siblings.value.filter(({ enabled }) => enabled),
);

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const promiseWithResolvers: <T>() => PromiseWithResolvers<T> = <T>() => {
  let resolve: PromiseWithResolvers<T>["resolve"] | undefined;
  let reject: PromiseWithResolvers<T>["reject"] | undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve } as PromiseWithResolvers<T>;
};

/* -------------------------------------------------------------------------- */

const log: Options["log"] = (type, ...args) => {
  (
    window.console[type as keyof Console] as (
      ...optionalParams: string[]
    ) => void
  )(...args.map((value: string) => decodeURIComponent(value)));
};

/* -------------------------------------------------------------------------- */

function addStyle(style: string, id: string | undefined): void {
  useStyleTag(style, { ...(id && { id }) });
}

/* -------------------------------------------------------------------------- */

function guard({ path }: RouteLocationNormalizedGeneric): string | undefined {
  return path !== decodeURI(path) ? decodeURI(path) : undefined;
}

/* -------------------------------------------------------------------------- */

async function handleModule(
  type: string,
  getContentData: File["getContentData"],
  path: AbstractPath,
  options: Options,
): Promise<ContentData | null | undefined> {
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
}

/* -------------------------------------------------------------------------- */

function module({ id = v4() }: TPage): Promise<object> {
  const abstractPath = `${id}.vue`;
  promises.set(id, promiseWithResolvers());
  const getFile: Options["getFile"] = async (filePath: string) => {
    const { imports } = importmap;
    switch (true) {
      case filePath === abstractPath:
        return (await fetch(`./pages/${filePath}`)).text();
      case Object.keys(imports).some((value) => filePath.startsWith(value)): {
        // const fileName = filePath.split("/").pop();
        // const ext = fileName?.split(".").pop();
        // let type = ext === fileName ? "" : ext;
        const getContentData: File["getContentData"] = () => {
          return import(
            filePath
            // type === "css" ? { with: { type } } : undefined
          ) as Promise<ContentData>;
        };
        // type = type === "css" ? type : "js";
        const type = "js";
        return { getContentData, type };
      }
      default: {
        const fileName = filePath.split("/").pop();
        return (
          await fetch(
            fileName === fileName?.split(".").pop()
              ? `${filePath}.js`
              : filePath,
          )
        ).text();
      }
    }
  };
  return defineAsyncComponent((async () => {
    return loadModule(abstractPath, {
      addStyle,
      getFile,
      handleModule,
      log,
      moduleCache,
    } as unknown as Options);
  }) as AsyncComponentLoader<Promise<object>>);
}

/* -------------------------------------------------------------------------- */

function setScroll({ extractAll, toggleObserver }: RuntimeContext): void {
  const all = async () => {
    paused.value = true;
    toggleObserver(false);
    {
      const [{ promise = null } = {}] = promises.values();
      await promise;
    }
    await Promise.all([...promises.values()].map(({ promise }) => promise));
    await extractAll();
    toggleObserver(true);
    paused.value = false;
  };
  onScroll = async ({ name }) =>
    new Promise((resolve) => {
      if (name) {
        all().then(
          () => {
            const el = `#${String(name)}`;
            resolve(
              scroll.value && {
                behavior,
                ...(that.value?.parent?.along && that.value.index
                  ? { el }
                  : { left, top }),
              },
            );
            scroll.value = true;
          },
          () => {
            resolve(false);
          },
        );
      } else resolve(false);
    });
}

/* -------------------------------------------------------------------------- */

const resolve: ({ id }: TPage) => void = ({ id } = {} as TPage) => {
  if (id) promises.get(id)?.resolve(null);
};

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

router.beforeEach(guard);

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
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

/* -------------------------------------------------------------------------- */
