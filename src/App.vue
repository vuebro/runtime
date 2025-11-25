<template lang="pug">
router-view(v-slot="{ Component }")
  component(:is="Component", :id="nodes[0]?.id")
</template>
<script setup lang="ts">
import type { TPage } from "@vuebro/shared";
import type { MetaFlat } from "unhead/types";

import { iconToHTML, iconToSVG, replaceIDs } from "@iconify/utils";
import { getIcon, iconLoaded, loadIcon } from "@iconify/vue";
import { useHead, useSeoMeta } from "@unhead/vue";
import { fetching, sharedStore } from "@vuebro/shared";
import { computed, toRefs, watchEffect } from "vue";
import { useRoute } from "vue-router";

let favicon = $ref(""),
  jsonld = $ref("");

const route = useRoute(),
  { kvNodes, nodes } = $(toRefs(sharedStore));

const a = $computed(() => kvNodes[route.name as keyof TPage]),
  description = computed(() => a?.description),
  keywords = computed(() => a?.keywords.join()),
  ogImage = computed(
    () =>
      a?.images
        .filter(({ url }) => url)
        .map(({ alt = "", url }) => ({
          alt,
          url: `${window.location.origin}/${url}`,
        })) ?? [],
  ),
  ogType = computed(() => a?.type as MetaFlat["ogType"] | null),
  ogUrl = computed(
    () => a?.to && `${window.location.origin}${a.to === "/" ? "" : a.to}`,
  ),
  title = computed(() => a?.title);

// eslint-disable-next-line @typescript-eslint/no-misused-promises
watchEffect(async () => {
  if (a) {
    let href = "/favicon.ico";
    if (a.icon) {
      const icon = iconLoaded(a.icon)
        ? getIcon(a.icon)
        : await loadIcon(a.icon);
      if (icon) {
        const { attributes, body } = iconToSVG(icon, { height: 16, width: 16 });
        href = `data:image/svg+xml,${encodeURIComponent(iconToHTML(replaceIDs(body), attributes))}`;
      }
    }
    favicon = href;
    jsonld = JSON.stringify(
      (await fetching(`./docs/${a.id}.jsonld`)) ?? {
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
