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
/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { TPage } from "@vues3/shared";
import type { ComputedRef } from "vue";

import { v4 } from "uuid";
import { computed, inject, onUpdated } from "vue";

import { module, promises, resolve, that } from "../stores/monolit";

/* -------------------------------------------------------------------------- */
/*                                 Properties                                 */
/* -------------------------------------------------------------------------- */

const { id }: { id: string | undefined } = defineProps<{ id?: string }>();

/* -------------------------------------------------------------------------- */
/*                                 Injections                                 */
/* -------------------------------------------------------------------------- */

const pages: null | Record<string, TPage> = inject("pages") ?? null;

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const getThe = (): null | TPage =>
  id ? (pages?.[id as keyof object] ?? null) : that.value;

/* -------------------------------------------------------------------------- */
/*                                Computations                                */
/* -------------------------------------------------------------------------- */

const the: ComputedRef<null | TPage> = computed(getThe);

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const runResolve = (): void => {
  if (id && the.value) resolve(the.value);
};

/* -------------------------------------------------------------------------- */

const getIs = (): null | Promise<object> => {
  const [[key, value] = []] = promises;
  promises.clear();
  if (key && value) promises.set(key, value);
  return the.value && module(the.value);
};

/* -------------------------------------------------------------------------- */
/*                                Computations                                */
/* -------------------------------------------------------------------------- */

const is: ComputedRef<null | Promise<object>> = computed(getIs);

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

onUpdated(runResolve);

/* -------------------------------------------------------------------------- */
</script>
