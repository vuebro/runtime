<template lang="pug">
div(
  v-for="[id, is] in templates",
  :id,
  :key="id",
  v-intersection-observer="[([{isIntersecting}={}])=>{intersecting.set(id,isIntersecting)},{threshold:0.1}]",
  un-cloak,
  :class="atlas[id]?.class"
)
  component(:is, :id="id", @vue:mounted="promises.get(id)?.resolve(undefined)")
</template>

<script setup lang="ts">
/**
 * @file Page view component that renders multiple page components Uses
 *   intersection observer to track component visibility and manages component
 *   mounting
 */

import { atlas } from "@vuebro/shared";
import { vIntersectionObserver } from "@vueuse/components";
import { computed, onUnmounted, watch } from "vue";

import {
  $these,
  intersecting,
  module,
  promises,
  promiseWithResolvers,
} from "@/stores/monolit";

/**
 * Clears intersection and promise maps
 */
const clear = () => {
    [intersecting, promises].forEach((map) => {
      map.clear();
    });
  },
  /**
   * Computed property that creates a map of templates with their async
   * components
   *
   * @type {import("vue").ComputedRef<
   *   Map<string, import("vue").DefineAsyncComponentOptions>
   * >}
   */
  templates = computed(
    () => new Map($these.value.map(({ id }) => [id, module(id)])),
  );

/**
 * Watcher that updates the maps when $these changes
 */
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

/**
 * Cleanup function that clears maps when component unmounts
 */
onUnmounted(() => {
  clear();
});
</script>
