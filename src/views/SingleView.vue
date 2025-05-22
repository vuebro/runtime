<template>
  <div v-if="the?.enabled" :id="the?.id ?? v4()" :class="the?.class" un-cloak>
    <component
      :is
      :id="the?.id"
      un-cloak
      @vue:mounted="if (the) resolve(the);"
    ></component>
  </div>
</template>
<script setup lang="ts">
import { atlas } from "@vuebro/shared";
import { v4 } from "uuid";
import { computed, onUpdated } from "vue";

import { module, promises, resolve, that } from "../stores/monolit";
const { id = null } = defineProps<{ id?: string }>();
const the = computed(() => (id ? atlas[id as keyof object] : that.value));
const is = computed(() => {
  const [[key, value] = []] = promises;
  promises.clear();
  if (key && value) promises.set(key, value);
  return the.value && module(the.value);
});
onUpdated(() => {
  if (id && the.value) resolve(the.value);
});
</script>
