<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" :id="pages[0]?.id"></component>
  </router-view>
</template>
<script setup lang="ts">
import type { TPage } from "@vuebro/shared";
import type { MetaFlat } from "unhead/types";

import { getIcon, iconLoaded, loadIcon } from "@iconify/vue";
import { useHead, useSeoMeta } from "@unhead/vue";
import { pages } from "@vuebro/shared";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const a = computed(() => pages.value.find(({ id }) => id === route.name)),
  favicon = ref(""),
  jsonld = ref(""),
  ogUrl = computed(
    () =>
      a.value?.to &&
      `${window.location.origin}${a.value.to === "/" ? "" : a.value.to}`,
  );

watch(a, async (value) => {
  let href = "/favicon.ico";
  if (value?.icon) {
    const icon = iconLoaded(value.icon)
      ? getIcon(value.icon)
      : await loadIcon(value.icon);
    if (icon) {
      const { body, height, left, top, width } = icon;
      href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left.toString()} ${top.toString()} ${width.toString()} ${height.toString()}">${body}</svg>`;
    }
  }
  favicon.value = href;
});
useHead({
  link: [
    [favicon, "icon", "icon"],
    [ogUrl, "canonical"],
  ].map(([href, rel, key]) => ({ href, key, rel })),
  script: [
    {
      id: "application/ld+json",
      innerHTML: jsonld,
      type: "application/ld+json",
    },
  ],
});
useSeoMeta({
  description: computed(() => a.value?.description),
  keywords: computed(() => a.value?.keywords.join()),
  ogDescription: computed(() => a.value?.description),
  ogImage: computed(
    () =>
      a.value?.images
        .filter(({ url }) => url)
        .map(({ alt = "", url }) => ({
          alt,
          url: `${window.location.origin}/${url}`,
        })) ?? [],
  ),
  ogTitle: computed(() => a.value?.title),
  ogType: computed(
    () => a.value?.type as MetaFlat["ogType"] | null | undefined,
  ),
  ogUrl,
  title: computed(() => a.value?.title),
});
watch(
  () =>
    (
      a.value as
        | (TPage & {
            jsonld: Promise<object>;
          })
        | undefined
    )?.jsonld,
  async (value) => {
    jsonld.value =
      JSON.stringify(await value) || '{"@context":"https://schema.org"}';
  },
);
</script>
