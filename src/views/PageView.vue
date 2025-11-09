<template lang="pug">
div(
  v-for="[id, is] in templates",
  :id,
  :key="id",
  v-intersection-observer="[([{isIntersecting}={}])=>{main.intersecting.set(id,isIntersecting)},{threshold:0.1}]",
  un-cloak,
  :class="shared.atlas[id]?.class"
)
  component(
    :is,
    :id="id",
    @vue:mounted="main.promises.get(id)?.resolve(undefined)"
  )
</template>

<script setup lang="ts">
import { useSharedStore } from "@vuebro/shared";
import { vIntersectionObserver } from "@vueuse/components";
import { storeToRefs } from "pinia";
import { computed, onUnmounted, watch } from "vue";

import { module, promiseWithResolvers, useMainStore } from "@/stores/main";

const main = useMainStore(),
  shared = useSharedStore(),
  { $these } = storeToRefs(main);

/**
 * Clears the intersecting and promises maps
 */
const clear = () => {
    [main.intersecting, main.promises].forEach((map) => {
      map.clear();
    });
  },
  templates = computed(
    () => new Map($these.value.map(({ id }) => [id, module(id)])),
  );

watch(
  $these,
  (value) => {
    clear();
    value.forEach(({ id }) => {
      main.intersecting.set(id, false);
      main.promises.set(id, promiseWithResolvers());
    });
  },
  { immediate: true },
);

onUnmounted(() => {
  clear();
});
</script>
