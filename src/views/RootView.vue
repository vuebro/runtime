<template lang="pug">
Suspense
  div(v-if="the?.enabled", :id="the.id", :class="the.class", un-cloak)
    component(:is, :id="the.id", @vue:mounted="root.resolve(undefined)")
</template>

<script setup lang="ts">
/**
 * @file Root view component that renders the first page in the pages array Uses
 *   Suspense for asynchronous component loading and handles mounting
 */

import { pages } from "@vuebro/shared";
import { computed } from "vue";

import { module, root } from "@/stores/monolit";

/**
 * The first page in the pages array
 *
 * @type {import("@vuebro/shared").TPage | undefined}
 */
const [the] = pages.value,
  /**
   * Computed property that returns the async component for the first page
   *
   * @type {import("vue").ComputedRef<
   *   import("vue").DefineAsyncComponentOptions | undefined
   * >}
   */
  is = computed(() => the && module(the.id));
</script>
