import type { RouteRecordNameGeneric } from "vue-router";

import loadModule from "@vuebro/loader-sfc";
import { atlas, pages } from "@vuebro/shared";
import { useArrayFilter } from "@vueuse/core";
import { computed, defineAsyncComponent, ref } from "vue";

interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: PromiseLike<T> | T) => void;
}

const intersecting = new Map<string, boolean | undefined>(),
  module = (id: string) =>
    defineAsyncComponent(async () =>
      loadModule(`./pages/${id}.vue`, {
        scriptOptions: { inlineTemplate: true },
      }),
    ),
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
  root = promiseWithResolvers(),
  routeName = ref<RouteRecordNameGeneric>(),
  scrollLock = ref(false),
  that = computed(() =>
    routeName.value === pages.value[0]?.id
      ? pages.value[0]?.$children[0]
      : atlas.value[routeName.value as keyof object],
  ),
  these = computed(() =>
    that.value === undefined || that.value.parent?.flat
      ? (that.value?.siblings ?? [])
      : [that.value],
  );

const $these = useArrayFilter(these, ({ enabled }) => enabled);

export {
  $these,
  intersecting,
  module,
  promises,
  promiseWithResolvers,
  root,
  routeName,
  scrollLock,
  that,
};
