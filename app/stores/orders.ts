import { defineStore } from "pinia";
import { ref } from "vue";

export const useOrders = defineStore("orders", () => {
  const orders = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function list() {
    try {
      const res: any = await $api("/orders");
      if (Array.isArray(res)) orders.value = res;
      else if (res?.items) orders.value = res.items;
      else if (res?.data) orders.value = res.data;
      else orders.value = [];
      return orders.value;
    } catch (e) {
      console.error("Failed to list orders:", e);
      return [];
    }
  }

  async function create(payload: Record<string, any>) {
    try {
      return await $api("/orders", {
        method: "POST",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to create order:", e);
      throw e;
    }
  }

  async function update(payload: Record<string, any>) {
    try {
      return await $api(`/orders/${payload.id}` , {
        method: "PUT",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to update order:", e);
      throw e;
    }
  }

  async function remove(payload: Record<string, any>) {
    try {
      return await $api(`/orders/${payload.id}` , {
        method: "DELETE",
        body: payload,
      });
    } catch (e) {
      console.error("Failed to delete order:", e);
      throw e;
    }
  }

  return {
    orders,
    list,
    create,
    update,
    remove,
  };
});
