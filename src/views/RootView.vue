<template lang="pug">
Suspense
  div(v-if="the?.enabled", :id="the.id", :class="the.class", un-cloak)
    component(:is, :id="the.id", @vue:mounted="main.root.resolve(undefined)")
</template>

<script setup lang="ts">
import { useSharedStore } from "@vuebro/shared";
import { computed } from "vue";

import { module, useMainStore } from "@/stores/main";

const shared = useSharedStore(),
  [the] = shared.pages,
  is = computed(() => the && module(the.id)),
  main = useMainStore();
</script>
