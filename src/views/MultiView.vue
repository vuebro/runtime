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
      @vue:mounted="
        () => {
          resolve(the);
        }
      "
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
/*                                Computations                                */
/* -------------------------------------------------------------------------- */

const templates: ComputedRef<object> = computed(() => {
  {
    const [[key, value] = []] = promises;
    promises.clear();
    if (key && value) promises.set(key, value);
  }
  return Object.fromEntries(
    $siblings.value.map((value) => [value.id, module(value)]),
  ) as object;
});

/* -------------------------------------------------------------------------- */

const intersecting: ComputedRef<Map<string, boolean>> = computed(
  () => new Map($siblings.value.map(({ id = v4() }) => [id, false])),
);

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

const clearStops = (): void => {
  stops.forEach((stop: () => void) => {
    stop();
  });
  stops.length = 0;
};

/* -------------------------------------------------------------------------- */

const initStops = (value: HTMLElement[]): void => {
  clearStops();
  setTimeout(() => {
    value.forEach((target) => {
      const { stop } = useIntersectionObserver(target, callback, {
        threshold,
      });
      stops.push(stop);
    });
  });
};

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
          : ([...intersecting.value.entries()].find(
              ([, value]) => value,
            )?.[0] ??
            [...$intersecting.value.entries()].find(
              ([, value]) => value,
            )?.[0] ??
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
