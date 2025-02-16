<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" :id="pages[0]?.id"></component>
  </router-view>
</template>
<script setup lang="ts">
import type { MetaFlat } from "zhead";

import { getIcon, iconExists, loadIcon } from "@iconify/vue";
import { useHead, useSeoMeta } from "@unhead/vue";
import { pages } from "@vues3/shared";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

/* -------------------------------------------------------------------------- */

const route = useRoute();

const a = computed(() => pages.value.find(({ id }) => id === route.name)),
  favicon = ref(""),
  ogUrl = computed(
    () =>
      a.value?.to &&
      `${window.location.origin}${a.value.to === "/" ? "" : a.value.to}`,
  ),
  link = [
    [favicon, "icon", "icon"],
    [ogUrl, "canonical"],
  ].map(([href, rel, key]) => ({ href, key, rel }));

const description = () => a.value?.description ?? undefined,
  keywords = () => a.value?.keywords.join(),
  ogDescription = () => a.value?.description ?? undefined,
  ogImage = () =>
    a.value?.images
      .filter(({ url }) => url)
      .map(({ alt = "", url }) => ({
        alt,
        url: url ? `${window.location.origin}/${url}` : "",
      })) ?? [],
  ogTitle = () => a.value?.title,
  ogType = () =>
    a.value?.type ? (a.value.type as MetaFlat["ogType"]) : undefined,
  title = () => a.value?.title ?? "";

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

useHead({ link });

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
</script>
