<template>
  <div
    v-for="the in these"
    :id="the.id ?? v4()"
    :key="the.id ?? v4()"
    ref="refs"
    :class="the.class"
    :role="the.id === that?.id ? 'main' : 'section'"
    un-cloak
  >
    <component
      :is="templates[the.id as keyof object]"
      :id="the.id"
      un-cloak
      @vue:mounted="resolve(the)"
    ></component>
  </div>
</template>
<script setup lang="ts">
import { consoleError, pages } from "@vuebro/shared";
import { useIntersectionObserver, useScroll } from "@vueuse/core";
import { v4 } from "uuid";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import {
  module,
  paused,
  promises,
  resolve,
  scroll,
  that,
} from "../stores/monolit";

const refs = ref([]),
  router = useRouter(),
  siblings = computed(() => that.value?.siblings ?? []),
  stops: (() => void)[] = [];

const $siblings = computed(() =>
    siblings.value.filter(({ enabled }) => enabled),
  ),
  clearStops = () => {
    stops.forEach((stop) => {
      stop();
    });
    stops.length = 0;
  },
  these = computed(() =>
    that.value === undefined || that.value.parent?.flat
      ? $siblings.value
      : [that.value],
  );

const intersecting = computed(
    () => new Map(these.value.map(({ id = v4() }) => [id, false])),
  ),
  $intersecting = ref(new Map(intersecting.value)),
  templates = computed(() => {
    const [[key, value] = []] = promises;
    promises.clear();
    if (key && value) promises.set(key, value);
    return Object.fromEntries(
      these.value.map((page) => [page.id, module(page)]),
    ) as object;
  });

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
          { threshold: 0.1 },
        );
        stops.push(stop);
      });
    });
  },
  { deep: true },
);

useScroll(window, {
  behavior: "smooth",
  onStop: () => {
    if (!paused.value) {
      const { scrollX, scrollY } = window;
      const [first] = these.value;
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
});

onUnmounted(clearStops);
</script>
