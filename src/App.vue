<template lang="pug">
router-view(v-slot="{ Component }")
  component(:is="Component", :id="nodes[0]?.id")
</template>
<script setup lang="ts">
import type { TPage } from "@vuebro/shared";

import { useHead } from "@unhead/vue";
import { sharedStore } from "@vuebro/shared";
import { computed, toRef } from "vue";
import { useRoute } from "vue-router";

const kvNodes = $toRef(sharedStore, "kvNodes"),
  nodes = toRef(sharedStore, "nodes"),
  route = useRoute();
const input = computed(() => kvNodes[route.name as keyof TPage]?.frontmatter);

useHead(input, { mode: "client" });
</script>
