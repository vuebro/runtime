import type { MarkdownItEnv } from "@mdit-vue/types";
import type { TPage } from "@vuebro/shared";
import type { RouteRecordNameGeneric } from "vue-router";

import { componentPlugin } from "@mdit-vue/plugin-component";
import { frontmatterPlugin } from "@mdit-vue/plugin-frontmatter";
import { sfcPlugin } from "@mdit-vue/plugin-sfc";
import { tocPlugin } from "@mdit-vue/plugin-toc";
import { abbr } from "@mdit/plugin-abbr";
import { alert } from "@mdit/plugin-alert";
import { align } from "@mdit/plugin-align";
import { attrs } from "@mdit/plugin-attrs";
import { demo } from "@mdit/plugin-demo";
import { dl } from "@mdit/plugin-dl";
import { embed } from "@mdit/plugin-embed";
import { figure } from "@mdit/plugin-figure";
import { footnote } from "@mdit/plugin-footnote";
import { icon } from "@mdit/plugin-icon";
import { imgLazyload } from "@mdit/plugin-img-lazyload";
import { imgMark } from "@mdit/plugin-img-mark";
import { imgSize } from "@mdit/plugin-img-size";
import { ins } from "@mdit/plugin-ins";
import { katex } from "@mdit/plugin-katex";
import { mark } from "@mdit/plugin-mark";
import { ruby } from "@mdit/plugin-ruby";
import { spoiler } from "@mdit/plugin-spoiler";
import { stylize } from "@mdit/plugin-stylize";
import { sub } from "@mdit/plugin-sub";
import { sup } from "@mdit/plugin-sup";
import { tab } from "@mdit/plugin-tab";
import { tasklist } from "@mdit/plugin-tasklist";
import { ElementTransform } from "@nolebase/markdown-it-element-transform";
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

let transformNextLinkCloseToken = false;

const { kvNodes, nodes } = $(toRefs(sharedStore));
const md = MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})
  .use(ElementTransform, {
    transform(token) {
      switch (token.type) {
        case "link_close":
          if (transformNextLinkCloseToken) {
            token.tag = "RouterLink";
            transformNextLinkCloseToken = false;
          }
          break;
        case "link_open": {
          const href = token.attrGet("href") ?? "/";
          if (!URL.canParse(href)) {
            token.tag = "RouterLink";
            token.attrSet("to", href);
            token.attrs?.splice(token.attrIndex("href"), 1);
            transformNextLinkCloseToken = true;
          }
          break;
        }
      }
    },
  })
  .use(abbr)
  .use(alert)
  .use(align)
  .use(attrs)
  .use(demo)
  .use(dl)
  .use(figure)
  .use(footnote)
  .use(icon)
  .use(imgLazyload)
  .use(imgMark)
  .use(imgSize)
  .use(ins)
  .use(katex)
  .use(mark)
  .use(ruby)
  .use(spoiler)
  .use(stylize)
  .use(sub)
  .use(sup)
  .use(tab)
  .use(tasklist)
  .use(embed, {
    config: [
      {
        name: "youtube",
        setup: (id: string) =>
          `<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`,
      },
    ],
  })
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
