<template lang="pug">
Suspense
  div(
    v-if="nodes[0]?.enabled",
    :id="nodes[0].id",
    :class="nodes[0].class",
    un-cloak
  )
    component(:is, :id="nodes[0].id", @vue:mounted="root.resolve(undefined)")
</template>

<script setup lang="ts">
import { sharedStore } from "@vuebro/shared";
import { computed } from "vue";

import { mainStore, module } from "@/stores/main";

const nodes = $toRef(sharedStore, "nodes"),
  { root } = mainStore;
const is = computed(() => nodes[0] && module(nodes[0].id));
</script>
