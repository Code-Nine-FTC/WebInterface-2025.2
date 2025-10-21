import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotification = defineStore('notification', () => {
  const notifications = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function fetchNotifications() {
    try {
      const res: any = await $api('/notifications/unacknowledged');
      if (Array.isArray(res)) notifications.value = res;
      else if (res?.items) notifications.value = res.items;
      else if (res?.data) notifications.value = res.data;
      else notifications.value = [];
      return notifications.value;
    } catch (e) {
      console.error('Failed to list notifications:', e);
      return [];
    }
  }

  async function acknowledge(payload: Record<string, any>) {
    try {
      return await $api(`/notifications/${payload.id}/acknowledge`, {
        method: 'PATCH',
        body: payload,
      });
    } catch (e) {
      console.error('Failed to acknowledge notification', e);
    }
  }

  async function acknowledgeAll(payload: Record<string, any>) {
    try {
      return await $api('/notifications/acknowledge-all', {
        method: 'PATCH',
        body: payload,
      });
    } catch (e) {
      console.error('Failed to acknowledge all the notification', e);
    }
  }

  return {
    notifications,
    fetchNotifications,
    acknowledge,
    acknowledgeAll,
  };
});
