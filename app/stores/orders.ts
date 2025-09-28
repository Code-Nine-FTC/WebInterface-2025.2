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

  async function create(payload: { withdrawDay: string; itemQuantities: Record<string, number> }) {
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

  async function updateStatus(orderId: string | number, status: string) {
    try {
      return await $api(`/orders/${orderId}/status`, {
        method: "PUT",
        body: { status },
      });
    } catch (e) {
      console.error("Failed to update order status:", e);
      throw e;
    }
  }

  async function approve(orderId: string | number) {
    try {
      return await $api(`/orders/approve/${orderId}`, { method: "PATCH" });
    } catch (e) {
      console.error("Failed to approve order:", e);
      return null;
    }
  }

  async function process(orderId: string | number) {
    try {
      return await $api(`/orders/process/${orderId}`, { method: "PATCH" });
    } catch (e) {
      console.error("Failed to process order:", e);
      return null;
    }
  }

  async function complete(orderId: string | number) {
    try {
      return await $api(`/orders/complete/${orderId}`, { method: "PATCH" });
    } catch (e) {
      console.error("Failed to complete order:", e);
      return null;
    }
  }

  async function cancel(orderId: string | number) {
    try {
      return await $api(`/orders/cancel/${orderId}`, { method: "PATCH" });
    } catch (e) {
      console.error("Failed to cancel order:", e);
      return null;
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

  async function getById(id: string | number) {
    try {
      return await $api(`/orders/${id}`);
    } catch (e) {
      console.error("Failed to get order:", e);
      throw e;
    }
  }

  async function getItemsByOrderId(orderId: string | number) {
    try {
      const res: any = await $api(`/orders/items/${orderId}`);
      if (Array.isArray(res)) return res;
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (res?.items && Array.isArray(res.items)) return res.items;
      return [];
    } catch (e) {
      console.error("Failed to get order items:", e);
      return [];
    }
  }

  return {
    orders,
    list,
    create,
    update,
    updateStatus,
    approve,
    process,
    complete,
    cancel,
    remove,
    getById,
    getItemsByOrderId,
  };
});
