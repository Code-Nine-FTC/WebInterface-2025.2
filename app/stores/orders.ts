import { defineStore } from "pinia";
import { ref } from "vue";

export const useOrders = defineStore("orders", () => {
  const orders = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function list(params?: Record<string, any>) {
    try {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      const res: any = await $api(`/orders${query}`);
      if (Array.isArray(res)) orders.value = res;
      else if (res?.orders) orders.value = res.orders;
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
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      return await $api(`/orders/${id}/status`, {
        method: "PATCH",
        body: { status },
      });
    } catch (e) {
      console.error("Failed to update order status:", e);
    }
  }

  async function getById(id: number) {
    try {
      return await $api(`/orders/${id}`);
    } catch (e) {
      console.error("Failed to get order by id:", e);
    }
  }

  async function remove(id: number) {
    try {
      return await $api(`/orders/${id}` , {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Failed to delete order:", e);
    }
  }

  return {
    orders,
    list,
    create,
    updateStatus,
    getById,
    remove,
  };
});
