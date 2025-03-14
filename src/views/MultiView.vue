<template>
  <div
    v-for="the in $siblings"
    :id="the.id ?? v4()"
    :key="the.id ?? v4()"
    ref="refs"
    :class="the.class"
    :role="the.id === that?.id ? 'main' : 'section'"
    un-cloak
  >
    <component
      :is="template(the)"
      :id="the.id"
      @vue:mounted="resolve(the)"
    ></component>
  </div>
</template>
<script setup lang="ts">
import type { TPage } from "@vues3/shared";

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
const intersecting = computed(
    () => new Map($siblings.value.map(({ id = v4() }) => [id, false])),
  ),
  $intersecting = ref(new Map(intersecting.value)),
  refs = ref([]),
  router = useRouter(),
  stops: (() => void)[] = [],
  templates = computed(() => {
    const [[key, value] = []] = promises;
    promises.clear();
    if (key && value) promises.set(key, value);
    return Object.fromEntries(
      $siblings.value.map((page) => [page.id, module(page)]),
    ) as object;
  });
const clearStops = () => {
    stops.forEach((stop) => {
      stop();
    });
    stops.length = 0;
  },
  onStop = () => {
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
  },
  template = ({ id }: TPage) => templates.value[id as keyof object];
watch(
  refs,
  (value) => {
    clearStops();
    setTimeout(() => {
      value.forEach((target) => {
        const { stop } = useIntersectionObserver(
          target,
          ([{ isIntersecting, target: { id } = {} } = {}] = []) => {
            $intersecting.value = new Map(intersecting.value);
            if (id && isIntersecting !== undefined)
              intersecting.value.set(id, isIntersecting);
          },
          { threshold },
        );
        stops.push(stop);
      });
    });
  },
  { deep },
);
useScroll(window, { behavior, onStop });
onUnmounted(clearStops);
</script>
