import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotification = defineStore('notification', () => {
  const notifications = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function fetchNotifications() {
    try {
      console.log('=== Iniciando fetchNotifications ===');
      let res: any = await $api('/notifications/unacknowledged');
      console.log('=== Resposta da API ===');
      console.log('Tipo da resposta:', typeof res);

      if (typeof res === 'string') {
        console.log('Resposta é string, fazendo parse...');
        res = JSON.parse(res);
      }

      console.log('É array?', Array.isArray(res));
      console.log('Número de notificações:', Array.isArray(res) ? res.length : 'N/A');

      if (Array.isArray(res)) {
        console.log('Resposta é um array, length:', res.length);
        notifications.value = res;
      } else if (res?.items) {
        console.log('Resposta tem items, length:', res.items.length);
        notifications.value = res.items;
      } else if (res?.data) {
        console.log('Resposta tem data, length:', res.data.length);
        notifications.value = res.data;
      } else {
        console.log('Resposta não tem estrutura reconhecida, setando array vazio');
        notifications.value = [];
      }

      console.log('=== Estado final ===');
      console.log('notifications.value.length:', notifications.value.length);
      return notifications.value;
    } catch (e) {
      console.error('=== ERRO ao buscar notificações ===', e);
      notifications.value = [];
      return [];
    }
  }

  async function acknowledge(payload: Record<string, any>) {
    try {
      const res = await $api(`/notifications/${payload.id}/acknowledge`, {
        method: 'PATCH',
        body: payload,
      });
      console.log('Notificação marcada como lida:', res);
      return res;
    } catch (e) {
      console.error('Failed to acknowledge notification', e);
      throw e;
    }
  }

  async function acknowledgeAll(payload: Record<string, any>) {
    try {
      const res = await $api('/notifications/acknowledge-all', {
        method: 'PATCH',
        body: payload,
      });
      console.log('Todas notificações marcadas como lidas:', res);
      return res;
    } catch (e) {
      console.error('Failed to acknowledge all the notification', e);
      throw e;
    }
  }

  return {
    notifications,
    fetchNotifications,
    acknowledge,
    acknowledgeAll,
  };
});
