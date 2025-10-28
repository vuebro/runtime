import type { RuntimeContext } from "@unocss/runtime";
import type { TPage } from "@vuebro/shared";
import type { RouterScrollBehavior } from "vue-router";

import loadModule from "@vuebro/loader-sfc";
import { atlas } from "@vuebro/shared";
import uid from "uuid-random";
import { computed, defineAsyncComponent, ref } from "vue";
import { createRouter, createWebHistory } from "vue-router";

interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: PromiseLike<T> | T) => void;
}

let onScroll: RouterScrollBehavior | undefined;

const { pathname } = new URL(document.baseURI);

const paused = ref(true),
  promises = new Map<string, PromiseWithResolvers<unknown>>(),
  promiseWithResolvers = <T>() => {
    let resolve!: PromiseWithResolvers<T>["resolve"];
    let reject!: PromiseWithResolvers<T>["reject"];
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, reject, resolve };
  },
  router = createRouter({
    history: createWebHistory(pathname),
    routes: [],
    scrollBehavior: (to, from, savedPosition) =>
      onScroll?.(to, from, savedPosition),
  }),
  scroll = ref(true),
  that = computed(() =>
    router.currentRoute.value.path === "/"
      ? atlas.value[router.currentRoute.value.name as keyof object]
          ?.$children[0]
      : atlas.value[router.currentRoute.value.name as keyof object],
  );

const module = ({ id = uid() }) => {
    promises.set(id, promiseWithResolvers());
    return defineAsyncComponent(async () =>
      loadModule(`./pages/${id}.vue`, {
        scriptOptions: { inlineTemplate: true },
      }),
    );
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
          behavior: "smooth" as ScrollOptions["behavior"],
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

export { module, paused, promises, resolve, router, scroll, setScroll, that };
