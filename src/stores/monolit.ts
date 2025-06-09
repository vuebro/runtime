import type { RuntimeContext } from "@unocss/runtime";
import type { TPage } from "@vuebro/shared";
import type { RouterScrollBehavior } from "vue-router";

import loadModule from "@vuebro/sfc-loader";
import { pages } from "@vuebro/shared";
import { v4 } from "uuid";
import { computed, defineAsyncComponent, ref } from "vue";
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
    return defineAsyncComponent(async () => loadModule(`./pages/${id}.vue`));
  },
  resolve = ({ id } = {} as TPage) => {
    if (id) promises.get(id)?.resolve(undefined);
  },
  setScroll = ({ extractAll, toggleObserver }: RuntimeContext) => {
    onScroll = async ({ hash, name }) => {
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
          ...(hash || (that.value?.parent?.flat && that.value.index)
            ? { el: hash || `#${String(name)}` }
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
