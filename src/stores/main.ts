import type { TPage } from "@vuebro/shared";
import type { RouteRecordNameGeneric } from "vue-router";

import loadModule from "@vuebro/loader-sfc";
import { sharedStore } from "@vuebro/shared";
import { computed, defineAsyncComponent, reactive, toRefs } from "vue";

interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: PromiseLike<T> | T) => void;
}

const { kvNodes, nodes } = $(toRefs(sharedStore));

/**
 * Creates a promise with separate resolve and reject functions
 *
 * @returns Object containing the promise and its resolve/reject functions
 */
export const promiseWithResolvers = <T>() => {
    let resolve!: PromiseWithResolvers<T>["resolve"];
    let reject!: PromiseWithResolvers<T>["reject"];
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, reject, resolve };
  },
  mainStore = reactive({
    $these: computed((): TPage[] =>
      mainStore.these.filter(({ enabled }) => enabled),
    ),
    intersecting: new Map<string, boolean | undefined>(),
    promises: new Map<string, PromiseWithResolvers<unknown>>(),
    root: promiseWithResolvers(),
    routeName: undefined as RouteRecordNameGeneric,
    scrollLock: false,
    that: computed((): TPage | undefined =>
      mainStore.routeName === nodes[0]?.id
        ? nodes[0]?.$children[0]
        : kvNodes[mainStore.routeName as keyof object],
    ),
    these: computed((): TPage[] =>
      mainStore.that === undefined || mainStore.that.parent?.flat
        ? (mainStore.that?.siblings ?? [])
        : [mainStore.that],
    ),
  }),
  /**
   * Loads a module dynamically
   *
   * @param id The ID of the module to load
   * @returns The async component
   */
  module = (id: string) =>
    defineAsyncComponent(async () =>
      loadModule(`./pages/${id}.vue`, {
        scriptOptions: { inlineTemplate: true },
      }),
    );
