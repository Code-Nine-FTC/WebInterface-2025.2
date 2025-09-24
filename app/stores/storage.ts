import { defineStore } from "pinia";
import { ref } from "vue";
import { useAuthStore } from "~/stores/auth";

export const useStorage = defineStore("storage", () => {
  const items = ref<Array<any>>([]);

  const apiBase = useRuntimeConfig().public.apiBase;
  const cookie = useCookie("token");
  const auth = useAuthStore();

  async function list(payload: Record<string, any> = {}) {
    try {
      const params = new URLSearchParams();
      if (payload.sectionId) {
        params.append("sectionId", String(payload.sectionId));
      }
      if (payload.sectionIds && Array.isArray(payload.sectionIds)) {
        payload.sectionIds.forEach((id: any) =>
          params.append("sectionIds[]", String(id))
        );
      }

      const url = params.toString() ? `/items/?${params.toString()}` : "/items";

      let t: string | null | undefined = null;
      const authTokenAny: any = auth?.token;
      if (authTokenAny) {
        t =
          typeof authTokenAny === "object" && "value" in authTokenAny
            ? authTokenAny.value
            : authTokenAny;
      }
      if (!t) {
        t = cookie?.value ?? null;
      }

      const headers: Record<string, string> = t
        ? { Authorization: `Bearer ${t}` }
        : {};

      const res: any = await $fetch(url, {
        baseURL: apiBase,
        method: "GET",
        headers,
      });

      if (Array.isArray(res)) {
        items.value = res;
      } else if (res && Array.isArray(res.items)) {
        items.value = res.items;
      } else if (res && Array.isArray(res.data)) {
        items.value = res.data;
      } else {
        items.value = [];
      }

      return items.value;
    } catch (e) {
      console.error("Failed to list items:", e);
      return [];
    }
  }

  return {
    list,
    items,
  };
});
