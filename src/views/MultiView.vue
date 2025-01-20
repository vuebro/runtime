<template>
  <div
    :class="the.class"
    :id="the.id ?? v4()"
    :key="the.id ?? v4()"
    :role="the.id === that?.id ? 'main' : 'section'"
    ref="refs"
    un-cloak
    v-for="the in $siblings"
  >
    <component
      :id="the.id"
      :is="template(the)"
      @vue:mounted="resolve(the)"
    ></component>
  </div>
</template>
<script setup lang="ts">
/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { TPage } from "@vues3/shared";
import type { ComputedRef, Ref } from "vue";
import type { Router } from "vue-router";

import { consoleError, deep, pages } from "@vues3/shared";
import { useIntersectionObserver, useScroll } from "@vueuse/core";
import { v4 } from "uuid";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import {
  $siblings,
  behavior,
  module,
  paused,
  promises,
  resolve,
  scroll,
  that,
  threshold,
} from "../stores/monolit";

/* -------------------------------------------------------------------------- */
/*                                   Arrays                                   */
/* -------------------------------------------------------------------------- */

const stops: (() => void)[] = [];

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const getEntry = (value: TPage): [string | undefined, Promise<object>] => [
  value.id,
  module(value),
];

/* -------------------------------------------------------------------------- */

const getTemplates = (): object => {
  const [[key, value] = []] = promises;
  promises.clear();
  if (key && value) promises.set(key, value);
  return Object.fromEntries($siblings.value.map(getEntry)) as object;
};

/* -------------------------------------------------------------------------- */

const getIntersectItem = ({ id = v4() }: TPage): [string, false] => [id, false];

/* -------------------------------------------------------------------------- */

const getIntersecting = (): Map<string, false> =>
  new Map($siblings.value.map(getIntersectItem));

/* -------------------------------------------------------------------------- */
/*                                Computations                                */
/* -------------------------------------------------------------------------- */

const templates: ComputedRef<object> = computed(getTemplates);

/* -------------------------------------------------------------------------- */

const intersecting: ComputedRef<Map<string, boolean>> =
  computed(getIntersecting);

/* -------------------------------------------------------------------------- */
/*                                 References                                 */
/* -------------------------------------------------------------------------- */

const refs: Ref<HTMLElement[]> = ref([]);

/* -------------------------------------------------------------------------- */

const $intersecting: Ref<Map<string, boolean>> = ref(
  new Map(intersecting.value),
);

/* -------------------------------------------------------------------------- */
/*                                   Objects                                  */
/* -------------------------------------------------------------------------- */

const router: Router = useRouter();

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const callback: IntersectionObserverCallback = ([
  { isIntersecting, target: { id } = {} } = {},
] = []) => {
  $intersecting.value = new Map(intersecting.value);
  if (id && isIntersecting !== undefined)
    intersecting.value.set(id, isIntersecting);
};

/* -------------------------------------------------------------------------- */

const runStop = (stop: () => void): void => {
  stop();
};

/* -------------------------------------------------------------------------- */

const clearStops = (): void => {
  stops.forEach(runStop);
  stops.length = 0;
};

/* -------------------------------------------------------------------------- */

const addStop = (target: HTMLElement): void => {
  const { stop } = useIntersectionObserver(target, callback, {
    threshold,
  });
  stops.push(stop);
};

/* -------------------------------------------------------------------------- */

const initStops = (value: HTMLElement[]): void => {
  clearStops();
  setTimeout(() => {
    value.forEach(addStop);
  });
};

/* -------------------------------------------------------------------------- */

const isValue = ([, value]: [string, boolean]): boolean => value;

/* -------------------------------------------------------------------------- */

const onStop = (): void => {
  if (!paused.value && that.value && $siblings.value.length) {
    const { scrollX, scrollY } = window;
    const [first] = $siblings.value;
    const [root] = pages.value;
    if (root && first) {
      const { $children: [{ id } = {}] = [] } = root;
      const name =
        !Math.floor(scrollX) && !Math.floor(scrollY) && first.id === id
          ? root.id
          : ([...intersecting.value.entries()].find(isValue)?.[0] ??
            [...$intersecting.value.entries()].find(isValue)?.[0] ??
            first.id);
      scroll.value = false;
      router.push({ name }).catch(consoleError);
    }
  }
};

/* -------------------------------------------------------------------------- */

const template = ({ id }: TPage): object => templates.value[id as keyof object];

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

useScroll(window, { behavior, onStop });

/* -------------------------------------------------------------------------- */

watch(refs, initStops, { deep });

/* -------------------------------------------------------------------------- */

onUnmounted(clearStops);

/* -------------------------------------------------------------------------- */
</script>
