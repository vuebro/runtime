<template lang="pug">
div(
  v-for="[id, is] in templates",
  :id,
  :key="id",
  v-intersection-observer="[([{isIntersecting}={}])=>{intersecting.set(id,isIntersecting)},{threshold:0.1}]",
  un-cloak,
  :class="kvNodes[id]?.class"
)
  component(:is, :id="id", @vue:mounted="promises.get(id)?.resolve(undefined)")
</template>

<script setup lang="ts">
import { kvNodes } from "@vuebro/shared";
import { vIntersectionObserver } from "@vueuse/components";
import { computed, onUnmounted, watch } from "vue";

import {
  $these,
  intersecting,
  module,
  promises,
  promiseWithResolvers,
} from "@/stores/main";

/**
 * Clears the intersecting and promises maps
 */
const clear = () => {
    [intersecting, promises].forEach((map) => {
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
      intersecting.set(id, false);
      promises.set(id, promiseWithResolvers());
    });
  },
  { immediate: true },
);

onUnmounted(() => {
  clear();
});
</script>
