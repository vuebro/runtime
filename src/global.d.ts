import type { App } from "vue";
declare global {
  interface Window {
    app: App;
  }
  declare const __APP_VERSION__: string;
}
