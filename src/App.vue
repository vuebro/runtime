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
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const isRouteName = ({ id }: TPage): boolean => id === route.name;

/* -------------------------------------------------------------------------- */

const getA = (): null | TPage => pages.value.find(isRouteName) ?? null;

/* -------------------------------------------------------------------------- */
/*                                  Computed                                  */
/* -------------------------------------------------------------------------- */

const a: ComputedRef<null | TPage> = computed(getA);

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const getOgUrl = (): string | undefined => {
  if (a.value?.to === null || a.value?.to === undefined) return undefined;
  return `${window.location.origin}${a.value.to === "/" ? "" : a.value.to}`;
};

/* -------------------------------------------------------------------------- */
/*                                  Computed                                  */
/* -------------------------------------------------------------------------- */

const ogUrl: ComputedRef<string | undefined> = computed(getOgUrl);

/* -------------------------------------------------------------------------- */
/*                                 References                                 */
/* -------------------------------------------------------------------------- */

const favicon: Ref<string> = ref("");

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const description = (): null | string => a.value?.description ?? null;

/* -------------------------------------------------------------------------- */

const keywords = (): null | string => a.value?.keywords.join() ?? null;

/* -------------------------------------------------------------------------- */

const ogDescription = (): null | string => a.value?.description ?? null;

/* -------------------------------------------------------------------------- */

const isUrl = ({ url }: { url: string }): string => url;

/* -------------------------------------------------------------------------- */

const addOrigin = ({
  alt = "",
  url,
}: {
  alt?: string;
  url: string;
}): {
  alt: string;
  url: string;
} => ({
  alt,
  url: url ? `${window.location.origin}/${url}` : "",
});

/* -------------------------------------------------------------------------- */

const ogImage = (): TPage["images"] =>
  a.value?.images.filter(isUrl).map(addOrigin) ?? [];

/* -------------------------------------------------------------------------- */

const ogTitle = (): null | string => a.value?.title ?? null;

/* -------------------------------------------------------------------------- */

const ogType = (): MetaFlat["ogType"] | null =>
  a.value?.type ? (a.value.type as MetaFlat["ogType"]) : null;

/* -------------------------------------------------------------------------- */

const setIcon = async (value: null | TPage): Promise<void> => {
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
};

/* -------------------------------------------------------------------------- */

const title = (): string => a.value?.title ?? "";

/* -------------------------------------------------------------------------- */

const toLink = ([href, rel, key]:
  | (ComputedRef<string | undefined> | string)[]
  | (Ref<string> | string)[]): Link<object> => ({ href, key, rel });

/* -------------------------------------------------------------------------- */
/*                                   Arrays                                   */
/* -------------------------------------------------------------------------- */

const link: Link<object>[] = [
  [favicon, "icon", "icon"],
  [ogUrl, "canonical"],
].map(toLink);

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

watch(a, setIcon);

/* -------------------------------------------------------------------------- */
</script>
