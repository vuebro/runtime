<template lang="pug">
router-view(v-slot="{ Component }")
  component(:is="Component", :id="pages[0]?.id")
</template>
<script setup lang="ts">
/**
 * @file Root application component for VueBro runtime Handles SEO meta tags,
 *   favicon generation, and JSON-LD structured data Dynamically updates meta
 *   information based on the current route
 */

import type { TPage } from "@vuebro/shared";
import type { MetaFlat } from "unhead/types";

import { iconToHTML, iconToSVG, replaceIDs } from "@iconify/utils";
import { getIcon, iconLoaded, loadIcon } from "@iconify/vue";
import { useHead, useSeoMeta } from "@unhead/vue";
import { atlas, fetching, pages } from "@vuebro/shared";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

/**
 * Current route object from Vue Router
 *
 * @type {import("vue-router").RouteLocationNormalizedLoaded}
 */
const route = useRoute();

/**
 * Computed property for the current page data based on route name
 *
 * @type {import("vue").ComputedRef<TPage | undefined>}
 */
const a = computed(() => atlas.value[route.name as keyof TPage]),
  /**
   * Computed property for the page description
   *
   * @type {import("vue").ComputedRef<string | undefined>}
   */
  description = computed(() => a.value?.description),
  /**
   * Reactive reference for the favicon URL
   *
   * @type {import("vue").Ref<string>}
   */
  favicon = ref(""),
  /**
   * Reactive reference for JSON-LD structured data
   *
   * @type {import("vue").Ref<string>}
   */
  jsonld = ref(""),
  /**
   * Computed property for page keywords
   *
   * @type {import("vue").ComputedRef<string | undefined>}
   */
  keywords = computed(() => a.value?.keywords.join()),
  /**
   * Computed property for Open Graph images
   *
   * @type {import("vue").ComputedRef<{ alt: string; url: string }[] | []>}
   */
  ogImage = computed(
    () =>
      a.value?.images
        .filter(({ url }) => url)
        .map(({ alt = "", url }) => ({
          alt,
          url: `${window.location.origin}/${url}`,
        })) ?? [],
  ),
  /**
   * Computed property for Open Graph type
   *
   * @type {import("vue").ComputedRef<
   *   MetaFlat["ogType"] | null | undefined
   * >}
   */
  ogType = computed(
    () => a.value?.type as MetaFlat["ogType"] | null | undefined,
  ),
  /**
   * Computed property for Open Graph URL
   *
   * @type {import("vue").ComputedRef<string | undefined>}
   */
  ogUrl = computed(
    () =>
      a.value?.to &&
      `${window.location.origin}${a.value.to === "/" ? "" : a.value.to}`,
  ),
  /**
   * Computed property for the page title
   *
   * @type {import("vue").ComputedRef<string | undefined>}
   */
  title = computed(() => a.value?.title);

/**
 * Watcher that updates favicon and JSON-LD when the page data changes
 *
 * @param {TPage | undefined} value - Current page data
 */
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

/**
 * Sets up document head tags using unhead
 */
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

/**
 * Sets up SEO meta tags using unhead
 */
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
