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
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) =>
  onScroll && onScroll(to, from, savedPosition);

/* -------------------------------------------------------------------------- */

const isEnabled = ({ enabled }: TPage): boolean => enabled;

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
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const isCurrentRouterName = ({ id }: TPage): boolean =>
  id === router.currentRoute.value.name;

/* -------------------------------------------------------------------------- */

const getA = (): null | TPage => pages.value.find(isCurrentRouterName) ?? null;

/* -------------------------------------------------------------------------- */
/*                                Computations                                */
/* -------------------------------------------------------------------------- */

const a: ComputedRef<null | TPage> = computed(getA);

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const getThat = (): null | TPage =>
  (router.currentRoute.value.path === "/" ? a.value?.$children[0] : a.value) ??
  null;

/* -------------------------------------------------------------------------- */
/*                                Computations                                */
/* -------------------------------------------------------------------------- */

const that: ComputedRef<null | TPage> = computed(getThat);

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const getSiblings = (): TPage[] => that.value?.siblings ?? [];

/* -------------------------------------------------------------------------- */
/*                                Computations                                */
/* -------------------------------------------------------------------------- */

const siblings: ComputedRef<TPage[]> = computed(getSiblings);

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const get$siblings = (): TPage[] => siblings.value.filter(isEnabled);

/* -------------------------------------------------------------------------- */
/*                                Computations                                */
/* -------------------------------------------------------------------------- */

const $siblings: ComputedRef<TPage[]> = computed(get$siblings);

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const promiseWithResolvers = <T>(): PromiseWithResolvers<T> => {
  let resolve: PromiseWithResolvers<T>["resolve"] | undefined;
  let reject: PromiseWithResolvers<T>["reject"] | undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve } as PromiseWithResolvers<T>;
};

/* -------------------------------------------------------------------------- */

const decode = (value: string): string => decodeURIComponent(value);

/* -------------------------------------------------------------------------- */

const log: Options["log"] = (type, ...args) => {
  (
    window.console[type as keyof Console] as (
      ...optionalParams: string[]
    ) => void
  )(...args.map(decode));
};

/* -------------------------------------------------------------------------- */

const addStyle = (style: string, id: string | undefined): void => {
  useStyleTag(style, { ...(id && { id }) });
};

/* -------------------------------------------------------------------------- */

const guard = ({ path }: RouteLocationNormalizedGeneric): string | undefined =>
  path !== decodeURI(path) ? decodeURI(path) : undefined;

/* -------------------------------------------------------------------------- */

const handleModule = async (
  type: string,
  getContentData: File["getContentData"],
  path: AbstractPath,
  options: Options,
): Promise<ContentData | null | undefined> => {
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
};

/* -------------------------------------------------------------------------- */

const module = ({ id = v4() }: TPage): Promise<object> => {
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
  return defineAsyncComponent((async () =>
    loadModule(abstractPath, {
      addStyle,
      getFile,
      handleModule,
      log,
      moduleCache,
    } as unknown as Options)) as AsyncComponentLoader<Promise<object>>);
};

/* -------------------------------------------------------------------------- */

const setScroll = ({ extractAll, toggleObserver }: RuntimeContext): void => {
  const all = async (): Promise<void> => {
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
};

/* -------------------------------------------------------------------------- */

const resolve = ({ id }: TPage = {} as TPage): void => {
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
