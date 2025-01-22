<template>
  <router-view v-slot="{ Component }">
    <component :id="pages[0]?.id" :is="Component"></component>
  </router-view>
</template>
<script setup lang="ts">
/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { Link } from "@unhead/vue";
import type { TPage } from "@vues3/shared";
import type { ComputedRef, Ref } from "vue";
import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";
import type { MetaFlat } from "zhead";

import { getIcon, iconExists, loadIcon } from "@iconify/vue";
import { useHead, useSeoMeta } from "@unhead/vue";
import { pages } from "@vues3/shared";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

/* -------------------------------------------------------------------------- */
/*                                   Objects                                  */
/* -------------------------------------------------------------------------- */

const route: RouteLocationNormalizedLoadedGeneric = useRoute();

/* -------------------------------------------------------------------------- */
/*                                  Computed                                  */
/* -------------------------------------------------------------------------- */

const a: ComputedRef<TPage | undefined> = computed(() =>
  pages.value.find(({ id }) => id === route.name),
);

/* -------------------------------------------------------------------------- */

const ogUrl: ComputedRef<string | undefined> = computed(
  () =>
    a.value?.to &&
    `${window.location.origin}${a.value.to === "/" ? "" : a.value.to}`,
);

/* -------------------------------------------------------------------------- */
/*                                 References                                 */
/* -------------------------------------------------------------------------- */

const favicon: Ref<string> = ref("");

/* -------------------------------------------------------------------------- */
/*                                   Arrays                                   */
/* -------------------------------------------------------------------------- */

const link: Link<object>[] = [
  [favicon, "icon", "icon"],
  [ogUrl, "canonical"],
].map(([href, rel, key]) => ({ href, key, rel }));

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const description = (): string | undefined => a.value?.description ?? undefined;

/* -------------------------------------------------------------------------- */

const keywords = (): string | undefined => a.value?.keywords.join();

/* -------------------------------------------------------------------------- */

const ogDescription = (): string | undefined =>
  a.value?.description ?? undefined;

/* -------------------------------------------------------------------------- */

const ogImage = (): TPage["images"] =>
  a.value?.images
    .filter(({ url }) => url)
    .map(({ alt = "", url }) => ({
      alt,
      url: url ? `${window.location.origin}/${url}` : "",
    })) ?? [];

/* -------------------------------------------------------------------------- */

const ogTitle = (): string | undefined => a.value?.title;

/* -------------------------------------------------------------------------- */

const ogType = (): MetaFlat["ogType"] | undefined =>
  a.value?.type ? (a.value.type as MetaFlat["ogType"]) : undefined;

/* -------------------------------------------------------------------------- */

const title = (): string => a.value?.title ?? "";

/* -------------------------------------------------------------------------- */
/*                                  Watchers                                  */
/* -------------------------------------------------------------------------- */

watch(a, async (value) => {
  let href = "/favicon.ico";
  if (value?.icon) {
    const icon = iconExists(value.icon)
      ? getIcon(value.icon)
      : await loadIcon(value.icon);
    if (icon) {
      const { body, height, left, top, width } = icon;
      href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left.toString()} ${top.toString()} ${width.toString()} ${height.toString()}">${body}</svg>`;
    }
  }
  favicon.value = href;
});

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

useHead({ link });

/* -------------------------------------------------------------------------- */

useSeoMeta({
  description,
  keywords,
  ogDescription,
  ogImage,
  ogTitle,
  ogType,
  ogUrl,
  title,
});

/* -------------------------------------------------------------------------- */
</script>
