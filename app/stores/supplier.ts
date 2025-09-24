import { useAuthStore } from "~/stores/auth";

export const useSupplier = defineStore("supplier", () => {
  const data = ref<Array<any>>([]);

  const apiBase = useRuntimeConfig().public.apiBase;
  const cookie = useCookie("token");
  const auth = useAuthStore();

  async function list() {
    try {
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

      const res: any = await $fetch("/suppliers", {
        baseURL: apiBase,
        method: "GET",
        headers,
      });

      if (Array.isArray(res)) {
        data.value = res;
      } else if (res && Array.isArray(res.items)) {
        data.value = res.items;
      } else if (res && Array.isArray(res.data)) {
        data.value = res.data;
      } else {
        data.value = [];
      }

      return data.value;
    } catch (e) {
      console.error("Failed to list items:", e);
      return [];
    }
  }

  return {
    list
  }
});