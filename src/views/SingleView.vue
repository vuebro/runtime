<template>
  <div :class="the?.class" :id="the?.id ?? v4()" un-cloak v-if="the?.enabled">
    <component
      :id="the?.id"
      :is
      @vue:mounted="if (the) resolve(the);"
    ></component>
  </div>
</template>
<script setup lang="ts">
import { v4 } from "uuid";
import { computed, inject, onUpdated } from "vue";

import { module, promises, resolve, that } from "../stores/monolit";

/* -------------------------------------------------------------------------- */

const { id } = defineProps<{ id?: string }>();

const pages = inject("pages"),
  the = computed(() => (id ? pages?.[id as keyof object] : that.value));

const is = computed(() => {
  const [[key, value] = []] = promises;
  promises.clear();
  if (key && value) promises.set(key, value);
  return the.value && module(the.value);
});

/* -------------------------------------------------------------------------- */

onUpdated(() => {
  if (id && the.value) resolve(the.value);
});
</script>
