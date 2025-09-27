import { defineStore } from "pinia";
import { ref } from "vue";

export const useUsers = defineStore("users", () => {
  const users = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function list(isActive?: boolean) {
    try {
      const res: any = await $api("/users/", {
        params: {
          isActive,
        },
      });
      if (Array.isArray(res)) users.value = res;
      else if (res?.users) users.value = res.users;
      else if (res?.data) users.value = res.data;
      else users.value = [];
      return users.value;
    } catch (e) {
      console.error("Failed to list users:", e);
      return [];
    }
  }

  async function create(payload: Record<string, any>) {
    try {
      return await $api("/users", {
        method: "POST",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to create user:", e);
    }
  }

  async function update(payload: Record<string, any>) {
    try {
      return await $api(`/users/${payload.id}`, {
        method: "PUT",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to update user:", e);
    }
  }

  async function remove(payload: Record<string, any>) {
    try {
      return await $api(`/users/${payload.id}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to delete user:", e);
    }
  }

  async function disable(payload: Record<string, any>) {
    try {
      return await $api(`/users/switch/${payload.id}`, {
        method: "PATCH",
      });
    } catch (e) {
      console.error("Failed to disable user:", e);
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
