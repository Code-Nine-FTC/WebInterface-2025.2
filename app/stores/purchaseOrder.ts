import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const usePurchaseOrder = defineStore('purchaseOrder', () => {
  const orders = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function list(params = {}) {
    try {
      const res: any = await $api('/purchase-orders/all', { params });
      if (Array.isArray(res)) orders.value = res;
      else if (res?.orders) orders.value = res.orders;
      else if (res?.data) orders.value = res.data;
      else orders.value = [];
      return orders.value;
    } catch (e) {
      return [];
    }
  }

  async function create(payload: Record<string, any>) {
    const auth = useAuthStore();
    const tokenCookie = useCookie<string | null>('token');
    const token = auth.token || tokenCookie.value;

    const body = {
      commitmentNoteNumber: payload.commitmentNoteNumber,
      issuingBody: payload.issuingBody,
      year: payload.year,
      processNumber: payload.processNumber,
      totalValue: payload.totalValue,
      issueDate: payload.issueDate,
      status: payload.status,
      emailStatus: payload.emailStatus,
      supplierCompanyId: payload.supplierCompanyId,
      orderId: payload.orderId,
    };

    return await $api('/purchase-orders/', {
      method: 'POST',
      body,
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });
  }

  async function update(payload: Record<string, any>) {
    const auth = useAuthStore();
    const tokenCookie = useCookie<string | null>('token');
    const token = auth.token || tokenCookie.value;

    const body = {
      commitmentNoteNumber: payload.commitmentNoteNumber,
      issuingBody: payload.issuingBody,
      year: payload.year,
      processNumber: payload.processNumber,
      totalValue: payload.totalValue,
      issueDate: payload.issueDate,
      status: payload.status,
      emailStatus: payload.emailStatus,
      supplierCompanyId: payload.supplierCompanyId,
      orderId: payload.orderId,
    };

    return await $api(`/purchase-orders/${payload.id}`, {
      method: 'PUT',
      body,
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });
  }

  async function getById(id: number | string) {
    const res = await $api(`/purchase-orders/${id}`);
    if (!res) return null;
    return {
      id: res.id,
      commitmentNoteNumber: res.commitmentNoteNumber,
      issuingBody: res.issuingBody,
      year: res.year,
      processNumber: res.processNumber,
      totalValue: res.totalValue,
      issueDate: res.issueDate,
      status: res.status,
      emailStatus: res.emailStatus,
      supplierCompanyId: res.supplierCompanyId,
      supplierCompanyName: res.supplierCompanyName,
      supplierCompanyEmail: res.supplierCompanyEmail,
      orderId: res.orderId,
      orderStatus: res.orderStatus,
      createdAt: res.createdAt,
      lastUpdate: res.lastUpdate,
      senderId: res.senderId,
      senderName: res.senderName,
      createdById: res.createdById,
      createdByName: res.createdByName,
      lastUserId: res.lastUserId,
      lastUserName: res.lastUserName,
    };
  }

  async function updateStatus(id: number | string, status: string) {
    return await $api(`/purchase-orders/${id}/status?status=${status}`, {
      method: 'PATCH',
    });
  }

  async function sendEmail(id: number | string, files?: File[]) {
    const auth = useAuthStore();
    const tokenCookie = useCookie<string | null>('token');
    const token = auth.token || tokenCookie.value;

    if (!token) {
      throw new Error('Token de autenticação não encontrado. Faça login novamente.');
    }

    if (files && files.length > 0) {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      return await $api(`/purchase-orders/${id}/send-email`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } else {
      return await $api(`/purchase-orders/${id}/send-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  return {
    list,
    create,
    update,
    getById,
    updateStatus,
    sendEmail,
    orders,
  };
});
