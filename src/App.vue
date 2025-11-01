<template lang="pug">
router-view(v-slot="{ Component }")
  component(:is="Component", :id="pages[0]?.id")
</template>
<script setup lang="ts">
import type { TPage } from "@vuebro/shared";
import type { MetaFlat } from "unhead/types";

import { iconToHTML, iconToSVG, replaceIDs } from "@iconify/utils";
import { getIcon, iconLoaded, loadIcon } from "@iconify/vue";
import { useHead, useSeoMeta } from "@unhead/vue";
import { atlas, fetching, pages } from "@vuebro/shared";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const a = computed(() => atlas.value[route.name as keyof TPage]),
  description = computed(() => a.value?.description),
  favicon = ref(""),
  jsonld = ref(""),
  keywords = computed(() => a.value?.keywords.join()),
  ogImage = computed(
    () =>
      a.value?.images
        .filter(({ url }) => url)
        .map(({ alt = "", url }) => ({
          alt,
          url: `${window.location.origin}/${url}`,
        })) ?? [],
  ),
  ogType = computed(
    () => a.value?.type as MetaFlat["ogType"] | null | undefined,
  ),
  ogUrl = computed(
    () =>
      a.value?.to &&
      `${window.location.origin}${a.value.to === "/" ? "" : a.value.to}`,
  ),
  title = computed(() => a.value?.title);

watch(a, async (value) => {
  if (value) {
    let href = "/favicon.ico";
    if (value.icon) {
      const icon = iconLoaded(value.icon)
        ? getIcon(value.icon)
        : await loadIcon(value.icon);
      if (icon) {
        console.log(icon);
        const { attributes, body } = iconToSVG(icon, { height: 16, width: 16 });
        href = `data:image/svg+xml,${encodeURIComponent(iconToHTML(replaceIDs(body), attributes))}`;
      }
    }
    favicon.value = href;
    jsonld.value = JSON.stringify(
      (await fetching(`./pages/${value.id}.jsonld`)) ?? {
        "@context": "https://schema.org",
      },
    );
  }
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
  description,
  keywords,
  ogDescription: description,
  ogImage,
  ogTitle: title,
  ogType,
  ogUrl,
  title,
});
</script>
