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
import { computed, toRefs } from "vue";

import { module, root } from "@/stores/main";

const { nodes } = toRefs(sharedStore);
const is = computed(() => nodes.value[0] && module(nodes.value[0].id));
</script>
