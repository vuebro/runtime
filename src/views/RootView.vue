<template lang="pug">
Suspense
  div(v-if="the?.enabled", :id="the.id", :class="the.class", un-cloak)
    component(:is, :id="the.id", @vue:mounted="root.resolve(undefined)")
</template>

<script setup lang="ts">
import { pages } from "@vuebro/shared";
import { computed } from "vue";

import { module, root } from "@/stores/monolit";

const [the] = pages.value,
  is = computed(() => the && module(the.id));
</script>
