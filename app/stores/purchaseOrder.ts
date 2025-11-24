import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';

export const usePurchaseOrder = defineStore('purchaseOrder', () => {
  const purchaseOrders = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function list(params = {}) {
    try {
      const res: any = await $api('/purchase-orders/all', { params });
      if (Array.isArray(res)) purchaseOrders.value = res;
      else if (res?.orders) purchaseOrders.value = res.orders;
      else if (res?.data) purchaseOrders.value = res.data;
      else purchaseOrders.value = [];
      return purchaseOrders.value;
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
      supplierCompanyId: payload.supplierCompanyId,
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
      supplierCompanyId: payload.supplierCompanyId,
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
    try {
      const res = await $api(`/purchase-orders/${id}`);
      if (!res) return null;
      return {
        id: res.purchaseOrderId ?? res.id,
        purchaseOrderNumber: res.purchaseOrderNumber,
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
        createdAt: res.createdAt,
        lastUpdate: res.lastUpdate,
        senderId: res.senderId,
        senderName: res.senderName,
        createdById: res.createdById,
        createdByName: res.createdByName,
        lastUserId: res.lastUserId,
        lastUserName: res.lastUserName,
      };
    } catch (e) {
      console.error('Failed to get purchase order by id:', e);
      return null;
    }
  }

  async function updateStatus(id: number | string, status: string) {
    try {
      return await $api(`/purchase-orders/${id}/status?status=${status}`, {
        method: 'PATCH',
      });
    } catch (e) {
      console.error('Failed to update status:', e);
      throw e;
    }
  }

  async function sendEmail(id: number | string, files?: File[]) {
    try {
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
    } catch (e) {
      console.error('Failed to send email:', e);
      throw e;
    }
  }

  return {
    list,
    create,
    update,
    getById,
    updateStatus,
    sendEmail,
    purchaseOrders,
  };
});
