/**
 * @module stores/monolit
 * @file Centralized state management store for the VueBro runtime. Contains
 *   reactive variables and computed properties for managing page states,
 *   component loading, and route-related data.
 */

import type { RouteRecordNameGeneric } from "vue-router";

import loadModule from "@vuebro/loader-sfc";
import { atlas, pages } from "@vuebro/shared";
import { useArrayFilter } from "@vueuse/core";
import { computed, defineAsyncComponent, ref } from "vue";

/**
 * Interface representing a promise with its associated resolve and reject
 * functions
 *
 * @template T The type of the resolved value
 */
interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: PromiseLike<T> | T) => void;
}

/**
 * Map tracking which components are currently intersecting (visible) in the
 * viewport
 *
 * @type {Map<string, boolean | undefined>}
 */
const intersecting = new Map<string, boolean | undefined>(),
  /**
   * Factory function to create an async component loader for a given page ID
   *
   * @param {string} id - The ID of the page to load
   * @returns {import("vue").DefineAsyncComponentOptions} An async component
   *   definition
   */
  module = (id: string) =>
    defineAsyncComponent(async () =>
      loadModule(`./pages/${id}.vue`, {
        scriptOptions: { inlineTemplate: true },
      }),
    ),
  /**
   * Map of promises associated with component loading, keyed by component ID
   *
   * @type {Map<string, PromiseWithResolvers<unknown>>}
   */
  promises = new Map<string, PromiseWithResolvers<unknown>>(),
  /**
   * Creates a new promise with separate resolve and reject functions
   *
   * @template T The type of the resolved value
   * @returns {PromiseWithResolvers<T>} An object containing the promise and its
   *   resolve/reject functions
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
  /**
   * A promise that resolves when the root component is ready
   *
   * @type {PromiseWithResolvers<unknown>}
   */
  root = promiseWithResolvers(),
  /**
   * Reactive reference to the current route name
   *
   * @type {import("vue").Ref<RouteRecordNameGeneric>}
   */
  routeName = ref<RouteRecordNameGeneric>(),
  /**
   * Reactive reference to track if scroll behavior is locked
   *
   * @type {import("vue").Ref<boolean>}
   */
  scrollLock = ref(false),
  /**
   * Computed property that returns the current page or component based on route
   * name
   *
   * @type {import("vue").ComputedRef<unknown>}
   */
  that = computed(() =>
    routeName.value === pages.value[0]?.id
      ? pages.value[0]?.$children[0]
      : atlas.value[routeName.value as keyof object],
  ),
  /**
   * Computed property that returns an array of components related to the
   * current route
   *
   * @type {import("vue").ComputedRef<unknown[]>}
   */
  these = computed(() =>
    that.value === undefined || that.value.parent?.flat
      ? (that.value?.siblings ?? [])
      : [that.value],
  );

/**
 * Reactive array filter that returns only the enabled components from 'these'
 *
 * @type {ReturnType<typeof useArrayFilter>}
 */
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
