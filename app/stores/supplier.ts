export const useSupplier = defineStore("supplier", () => {
  const data = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function list() {
    try {
      const res: any = await $api("/suppliers");
      if (Array.isArray(res)) data.value = res;
      else if (res?.items) data.value = res.items;
      else if (res?.data) data.value = res.data;
      else data.value = [];
      return data.value;
    } catch (e) {
      console.error("Failed to list suppliers:", e);
      return [];
    }
  }

  async function create(payload: Record<string, any>) {
    try {
      return await $api("/suppliers", {
        method: "POST",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to create supplier:", e);
    }
  }

  async function remove(payload: Record<string, any>) {
    try {
      return await $api(`/suppliers/${payload.id}`, {
        method: "DELETE",
        body: payload
      });
    } catch (e) {
      console.error("Failed to delete supplier:", e);
    }
  }

  async function update(params: Record<string, any>) {
    try {
      return await $api(`/suppliers/${params.id}`, {
        method: "PUT",
        body: params
      });
    } catch (e) {
      console.error("Failed to update supplier:", e);
    }
  }

  return {
    list,
    create,
    remove,
    update
  };
});
