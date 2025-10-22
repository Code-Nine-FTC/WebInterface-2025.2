import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useOrders = defineStore('orders', () => {
  const orders = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function list(payload: { sectionId?: number | string } = {}) {
    try {
      const params = new URLSearchParams();
      if (payload.sectionId != null) params.append('sectionId', String(payload.sectionId));
      const url = params.toString() ? `/orders?${params.toString()}` : '/orders';
      const res: any = await $api(url);
      if (Array.isArray(res)) {
        orders.value = res;
      } else if (res && typeof res === 'object') {
        const keys = ['content', 'orders', 'data', 'results', 'items'];
        let found: any[] | null = null;
        for (const k of keys) {
          if (Array.isArray(res[k])) {
            found = res[k];
            break;
          }
        }
        if (found) orders.value = found;
        else if (res.id != null) orders.value = [res];
        else orders.value = [];
      } else {
        orders.value = [];
      }
      return orders.value;
    } catch (e) {
      console.error('Failed to list orders:', e);
      return [];
    }
  }

  async function create(payload: { orderNumber: string; consumerSectionId: number; itemQuantities: Record<string, number>; withdrawDay?: string }) {
    try {
      const res: any = await $api('/orders', {
        method: 'POST',
        body: payload,
      });
      if (res && typeof res === 'object') return res;
      return null;
    } catch (e) {
      console.error('Failed to create order:', e);
      throw e;
    }
  }

  async function update(payload: Record<string, any>) {
    try {
      return await $api(`/orders/${payload.id}`, {
        method: 'PUT',
        body: payload,
      });
    } catch (e) {
      console.error('Failed to update order:', e);
      throw e;
    }
  }

  async function approve(orderId: string | number) {
    try {
      return await $api(`/orders/approve/${orderId}`, { method: 'PATCH' });
    } catch (e) {
      console.error('Failed to approve order:', e);
      return null;
    }
  }

  async function process(orderId: string | number) {
    try {
      return await $api(`/orders/process/${orderId}`, { method: 'PATCH' });
    } catch (e) {
      console.error('Failed to process order:', e);
      return null;
    }
  }

  async function complete(orderId: string | number, withdrawDay?: Date | string) {
    try {
      const dt = withdrawDay
        ? withdrawDay instanceof Date
          ? withdrawDay
          : new Date(withdrawDay)
        : new Date();

      const pad = (n: number) => String(n).padStart(2, '0');
      const y = dt.getFullYear();
      const m = pad(dt.getMonth() + 1);
      const d = pad(dt.getDate());
      const hh = pad(dt.getHours());
      const mm = pad(dt.getMinutes());
      const ss = pad(dt.getSeconds());
      const localDateTime = `${y}-${m}-${d}T${hh}:${mm}:${ss}`;

      return await $api(`/orders/complete/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify(localDateTime),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error('Failed to complete order:', e);
      return null;
    }
  }

  async function cancel(orderId: string | number) {
    try {
      return await $api(`/orders/cancel/${orderId}`, { method: 'PATCH' });
    } catch (e) {
      console.error('Failed to cancel order:', e);
      return null;
    }
  }

  async function remove(payload: Record<string, any>) {
    try {
      return await $api(`/orders/${payload.id}`, {
        method: 'DELETE',
        body: payload,
      });
    } catch (e) {
      console.error('Failed to delete order:', e);
      throw e;
    }
  }

  async function getById(id: string | number) {
    try {
      return await $api(`/orders/${id}`);
    } catch (e) {
      console.error('Failed to get order:', e);
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
      console.error('Failed to get order items:', e);
      return [];
    }
  }

  return {
    orders,
    list,
    create,
    update,
    approve,
    process,
    complete,
    cancel,
    remove,
    getById,
    getItemsByOrderId,
  };
});
