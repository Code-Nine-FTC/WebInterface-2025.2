import { defineStore } from "pinia";
import { ref } from "vue";

export const usePurchaseOrder = defineStore("purchaseOrder", () => {
  const orders = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function list(params = {}) {
    try {
      const res: any = await $api("/purchase-orders/all", { params });
      if (Array.isArray(res)) orders.value = res;
      else if (res?.orders) orders.value = res.orders;
      else if (res?.data) orders.value = res.data;
      else orders.value = [];
      return orders.value;
    } catch (e) {
      console.error("Failed to list purchase orders:", e);
      return [];
    }
  }

  async function create(payload: Record<string, any>) {
    try {
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
      return await $api("/purchase-orders/", {
        method: "POST",
        body,
      });
    } catch (e) {
      console.error("Failed to create purchase order:", e);
    }
  }

  async function update(payload: Record<string, any>) {
    try {
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
        method: "PUT",
        body,
      });
    } catch (e) {
      console.error("Failed to update purchase order:", e);
    }
  }

  async function getById(id: number|string) {
    try {
      const res = await $api(`/purchase-orders/${id}`);
      if (!res) return null;
      return {
        id: res.purchaseOrderId ?? res.id,
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
    } catch (e) {
      console.error("Failed to get purchase order by id:", e);
    }
  }

  async function updateStatus(id: number|string, status: string) {
    try {
      return await $api(`/purchase-orders/${id}/status?status=${status}`, {
        method: "PATCH",
      });
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  }

  async function sendEmail(id: number|string) {
    try {
      return await $api(`/purchase-orders/${id}/send-email`, {
        method: "POST",
      });
    } catch (e) {
      console.error("Failed to send email:", e);
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
