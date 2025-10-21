import { defineStore } from "pinia";
import { ref } from "vue";

export const useTypeItem = defineStore("typeItem", () => {
  const typeItems = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function list() {
    try {
      const res: any = await $api("/item-types");
      if (Array.isArray(res)) typeItems.value = res;
      else if (res?.typeItems) typeItems.value = res.typeItems;
      else if (res?.data) typeItems.value = res.data;
      else typeItems.value = [];
      return typeItems.value;
    } catch (e) {
      console.error("Failed to list type items:", e);
      return [];
    }
  }

  async function create(payload: Record<string, any>) {
    try {
      return await $api("/item-types", {
        method: "POST",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to create item type:", e);
    }
  }

  async function update(payload: Record<string, any>) {
    try {
      return await $api(`/item-types/${payload.id}`, {
        method: "PUT",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to update item type:", e);
    }
  }

  async function remove(payload: Record<string, any>) {
    try {
      return await $api(`/item-types/disable/${payload.id}`, {
        method: "PATCH",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to delete item type:", e);
    }
  }

  async function disable(payload: Record<string, any>) {
    try {
      return await $api(`/item-types/${payload.id}`, {
        method: "PATCH",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to disable type item:", e);
    }
  }

  async function getById(id: number | string) {
    try {
      return await $api(`/item-types/${id}`);
    } catch (e) {
      console.error("Failed to get item type by id:", e);
    }
  }

  return {
    list,
    create,
    update,
    remove,
    disable,
    getById,
  };
});
