import { defineStore } from "pinia";
import { ref } from "vue";

export const useStorage = defineStore("storage", () => {
  const items = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function list(payload: Record<string, any> = {}) {
    try {
      const params = new URLSearchParams();
      if (payload.sectionId)
        params.append("sectionId", String(payload.sectionId));
      if (payload.sectionIds?.length) {
        payload.sectionIds.forEach((id: any) =>
          params.append("sectionIds[]", String(id))
        );
      }
      const url = params.toString() ? `/items?${params.toString()}` : "/items";
      const res: any = await $api(url);

      if (Array.isArray(res)) items.value = res;
      else if (res?.items) items.value = res.items;
      else if (res?.data) items.value = res.data;
      else items.value = [];

      return items.value;
    } catch (e) {
      console.error("Failed to list items:", e);
      return [];
    }
  }

  async function getById(id: number | string) {
    try {
      return await $api(`/items/${id}`);
    } catch (e) {
      console.error("Failed to get item by id:", e);
      throw e;
    }
  }

  async function updateItem(id: number | string, payload: Record<string, any>) {
    try {
      return await $api(`/items/${id}`, {
        method: "PUT",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to update item:", e);
      throw e;
    }
  }

  return {
    list,
    items,
    getById,
    updateItem,
  };
});
