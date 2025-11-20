<template lang="pug">
div(
  v-for="[id, is] in templates",
  :id,
  :key="id",
  v-element-visibility="[(state)=>{intersecting.set(id,state)},{threshold:0.1}]",
  :class="kvNodes[id]?.class",
  un-cloak
)
  component(:is, :id="id", @vue:mounted="promises.get(id)?.resolve(undefined)")
</template>

<script setup lang="ts">
import { sharedStore } from "@vuebro/shared";
import { vElementVisibility } from "@vueuse/components";
import { computed, onUnmounted, toRef, watchEffect } from "vue";

import { mainStore, module, promiseWithResolvers } from "@/stores/main";

const $these = $toRef(mainStore, "$these"),
  kvNodes = toRef(sharedStore, "kvNodes"),
  { intersecting, promises } = mainStore;

/**
 * Clears the intersecting and promises maps
 */
const clear = () => {
    [intersecting, promises].forEach((map) => {
      map.clear();
    });
  },
  templates = computed(() => new Map($these.map(({ id }) => [id, module(id)])));

watchEffect(() => {
  clear();
  $these.forEach(({ id }) => {
    intersecting.set(id, false);
    promises.set(id, promiseWithResolvers());
  });
});

onUnmounted(() => {
  clear();
});
</script>
