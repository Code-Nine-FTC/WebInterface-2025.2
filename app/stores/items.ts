import { defineStore } from "pinia";
import { ref } from "vue";

export const useItems = defineStore("items", () => {
  const items = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function list() {
    try {
      const res: any = await $api("/items");
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

  async function create(payload: Record<string, any>) {
    try {
      return await $api("/items", {
        method: "POST",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to create item:", e);
    }
  }

  async function update(payload: Record<string, any>) {
    try {
      return await $api(`/items/${payload.id}`, {
        method: "PUT",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to update item:", e);
    }
  }

  async function remove(payload: Record<string, any>) {
    try {
      return await $api(`/items/${payload.id}`, {
        method: "DELETE",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to delete item:", e);
    }
  }

  async function disable(payload: Record<string, any>) {
    try {
      return await $api(`/items/${payload.id}`, {
        method: "PATCH",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to disable item:", e);
    }
  }

  return {
    list,
    create,
    update,
    remove,
    disable,
  };
});
