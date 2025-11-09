import type { RouteRecordNameGeneric } from "vue-router";

import loadModule from "@vuebro/loader-sfc";
import { useSharedStore } from "@vuebro/shared";
import { useArrayFilter } from "@vueuse/core";
import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, defineAsyncComponent, ref } from "vue";

interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: PromiseLike<T> | T) => void;
}
/**
 * Loads a module dynamically
 *
 * @param id The ID of the module to load
 * @returns The async component
 */
export const module = (id: string) =>
    defineAsyncComponent(async () =>
      loadModule(`./pages/${id}.vue`, {
        scriptOptions: { inlineTemplate: true },
      }),
    ),
  /**
   * Creates a promise with separate resolve and reject functions
   *
   * @returns Object containing the promise and its resolve/reject functions
   */
  promiseWithResolvers = <T>() => {
    let resolve!: PromiseWithResolvers<T>["resolve"];
    let reject!: PromiseWithResolvers<T>["reject"];
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, reject, resolve };
  },
  useMainStore = defineStore("main", () => {
    const routeName = ref<RouteRecordNameGeneric>(),
      shared = useSharedStore(),
      that = computed(() =>
        routeName.value === shared.pages[0]?.id
          ? shared.pages[0]?.$children[0]
          : shared.atlas[routeName.value as keyof object],
      ),
      these = computed(() =>
        that.value === undefined || that.value.parent?.flat
          ? (that.value?.siblings ?? [])
          : [that.value],
      );
    return {
      $these: useArrayFilter(these, ({ enabled }) => enabled),
      intersecting: new Map<string, boolean | undefined>(),
      promises: new Map<string, PromiseWithResolvers<unknown>>(),
      root: promiseWithResolvers(),
      routeName,
      scrollLock: ref(false),
      that,
    };
  });

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot));
