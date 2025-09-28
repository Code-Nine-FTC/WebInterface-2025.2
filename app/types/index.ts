import type { ofetch } from "ofetch";
type FetchInstance = typeof ofetch;

declare module "#app" {
  interface NuxtApp {
    $api: FetchInstance;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $api: FetchInstance;
  }
}

export {};