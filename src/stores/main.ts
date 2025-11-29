import type { MarkdownItEnv } from "@mdit-vue/types";
import type { TPage } from "@vuebro/shared";
import type { RouteRecordNameGeneric } from "vue-router";

import mermaid from "@datatraccorporation/markdown-it-mermaid";
import { componentPlugin } from "@mdit-vue/plugin-component";
import { frontmatterPlugin } from "@mdit-vue/plugin-frontmatter";
import { sfcPlugin } from "@mdit-vue/plugin-sfc";
import { tocPlugin } from "@mdit-vue/plugin-toc";
import loadModule from "@vuebro/loader-sfc";
import { fetching, sharedStore } from "@vuebro/shared";
import MarkdownIt from "markdown-it";
import abbreviation from "markdown-it-abbr";
import deflist from "markdown-it-deflist";
import { full as emoji } from "markdown-it-emoji";
import footnote from "markdown-it-footnote";
import insert from "markdown-it-ins";
import mark from "markdown-it-mark";
import subscript from "markdown-it-sub";
import superscript from "markdown-it-sup";
import taskLists from "markdown-it-task-lists";
import { computed, defineAsyncComponent, reactive, toRefs } from "vue";

interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: PromiseLike<T> | T) => void;
}

const { kvNodes, nodes } = $(toRefs(sharedStore));
const md = MarkdownIt({ html: true })
  .use(mermaid)
  .use(abbreviation)
  .use(deflist)
  .use(emoji)
  .use(footnote)
  .use(insert)
  .use(mark)
  .use(subscript)
  .use(superscript)
  .use(taskLists)
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
      mainStore.these.filter(({ enabled }) => enabled),
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
      mainStore.that === undefined || mainStore.that.parent?.flat
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
