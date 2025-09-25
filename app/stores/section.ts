import { defineStore } from "pinia";
import { ref } from "vue";

export const useSection = defineStore("section", () => {
  const sections = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function list() {
    try {
      const res: any = await $api("/sections");
      if (Array.isArray(res)) sections.value = res;
      else if (res?.sections) sections.value = res.sections;
      else if (res?.data) sections.value = res.data;
      else sections.value = [];
      return sections.value;
    } catch (e) {
      console.error("Failed to list sections:", e);
      return [];
    }
  }

  async function create(payload: Record<string, any>) {
    try {
      return await $api("/sections", {
        method: "POST",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to create section:", e);
    }
  }

  async function update(payload: Record<string, any>) {
    try {
      return await $api(`/sections/${payload.id}`, {
        method: "PUT",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to update section:", e);
    }
  }

  async function disable(payload: Record<string, any>) {
    try {
      return await $api(`/sections/${payload.id}`, {
        method: "PATCH",
      });
    } catch (e) {
      console.error("Failed to disable section:", e);
    }
  }

  async function remove(payload: Record<string, any>) {
    try {
      return await $api(`/sections/${payload.id}`, {
        method: "DELETE",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to remove section:", e);
    }
  }

  return {
    sections,
    list,
    create,
    update,
    disable,
    remove,
  };
});
