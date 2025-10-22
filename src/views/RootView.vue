<template lang="pug">
Suspense
  div(
    v-if="the?.enabled",
    :id="the?.id ?? uid()",
    :class="the?.class",
    un-cloak
  )
    component(:is, :pid="the?.id", @vue:mounted="resolve(the)")
</template>
<script setup lang="ts">
import { pages, uid } from "@vuebro/shared";
import { computed } from "vue";

import { module, resolve } from "../stores/monolit";

const [the] = pages.value,
  is = computed(() => the && module(the));
</script>
