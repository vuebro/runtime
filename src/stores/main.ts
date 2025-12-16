import type { MarkdownItEnv } from "@mdit-vue/types";
import type { TPage } from "@vuebro/shared";
import type { RouteRecordNameGeneric } from "vue-router";

import mermaid from "@datatraccorporation/markdown-it-mermaid";
import { componentPlugin } from "@mdit-vue/plugin-component";
import { frontmatterPlugin } from "@mdit-vue/plugin-frontmatter";
import { sfcPlugin } from "@mdit-vue/plugin-sfc";
import { tocPlugin } from "@mdit-vue/plugin-toc";
import { abbr } from "@mdit/plugin-abbr";
import { dl } from "@mdit/plugin-dl";
import { footnote } from "@mdit/plugin-footnote";
import { icon } from "@mdit/plugin-icon";
import { ins } from "@mdit/plugin-ins";
import { katex } from "@mdit/plugin-katex";
import { mark } from "@mdit/plugin-mark";
import { sub } from "@mdit/plugin-sub";
import { sup } from "@mdit/plugin-sup";
import { tasklist } from "@mdit/plugin-tasklist";
import loadModule from "@vuebro/loader-sfc";
import { fetching, sharedStore } from "@vuebro/shared";
import MarkdownIt from "markdown-it";
import pluginMdc from "markdown-it-mdc";
import { computed, defineAsyncComponent, reactive, toRefs } from "vue";

interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: PromiseLike<T> | T) => void;
}

const { kvNodes, nodes } = $(toRefs(sharedStore));
const md = MarkdownIt({ html: true })
  .use(katex)
  .use(mermaid)
  .use(abbr)
  .use(dl)
  .use(icon)
  .use(footnote)
  .use(ins)
  .use(mark)
  .use(sub)
  .use(sup)
  .use(tasklist)
  .use(pluginMdc)
  .use(frontmatterPlugin)
  .use(tocPlugin)
  .use(componentPlugin)
  .use(sfcPlugin);

export const promiseWithResolvers = <T>() => {
    let resolve!: PromiseWithResolvers<T>["resolve"];
    let reject!: PromiseWithResolvers<T>["reject"];
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, reject, resolve };
  },
  mainStore = reactive({
    $these: computed((): TPage[] =>
      mainStore.these.filter(({ frontmatter: { hidden } }) => !hidden),
    ),
    intersecting: new Map<string, boolean | undefined>(),
    promises: new Map<string, PromiseWithResolvers<unknown>>(),
    root: promiseWithResolvers(),
    routeName: undefined as RouteRecordNameGeneric,
    scrollLock: false,
    that: computed((): TPage | undefined =>
      mainStore.routeName === nodes[0]?.id
        ? nodes[0]?.$children[0]
        : kvNodes[mainStore.routeName as keyof object],
    ),
    these: computed((): TPage[] =>
      mainStore.that === undefined ||
      mainStore.that.parent?.frontmatter["joint"]
        ? (mainStore.that?.siblings ?? [])
        : [mainStore.that],
    ),
  }),
  module = (id: string) =>
    defineAsyncComponent(async () => {
      const env: MarkdownItEnv = {};
      md.render((await fetching(`./docs/${id}.md`)) ?? "", env);
      return loadModule(
        `${env.sfcBlocks?.template?.content ?? ""}
${env.sfcBlocks?.script?.content ?? ""}
${env.sfcBlocks?.scriptSetup?.content ?? ""}
${env.sfcBlocks?.styles.map(({ content }) => content).join("\n") ?? ""}
`,
        { scriptOptions: { inlineTemplate: true } },
      );
    });
