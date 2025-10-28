import type { TPage } from "@vuebro/shared";

import loadModule from "@vuebro/loader-sfc";
import uid from "uuid-random";
import { defineAsyncComponent, ref } from "vue";

interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: PromiseLike<T> | T) => void;
}

const pause = ref(true),
  promises = new Map<string, PromiseWithResolvers<unknown>>(),
  promiseWithResolvers = <T>() => {
    let resolve!: PromiseWithResolvers<T>["resolve"];
    let reject!: PromiseWithResolvers<T>["reject"];
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, reject, resolve };
  },
  scroll = ref(true);

const module = ({ id = uid() }) => {
    promises.set(id, promiseWithResolvers());
    return defineAsyncComponent(async () =>
      loadModule(`./pages/${id}.vue`, {
        scriptOptions: { inlineTemplate: true },
      }),
    );
  },
  resolve = ({ id } = {} as TPage) => {
    if (id) promises.get(id)?.resolve(undefined);
  };

export { module, pause, promises, resolve, scroll };
