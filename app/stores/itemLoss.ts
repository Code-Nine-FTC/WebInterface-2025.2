import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useItemLoss = defineStore('itemLoss', () => {
  const losses = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  /**
   * Registra uma perda de item
   * @param itemId ID do item
   * @param payload { lostQuantity: number, reason: string, recordedById: number }
   */
  async function registerLoss(
    itemId: number,
    payload: { lostQuantity: number; reason: string; recordedById: number },
  ) {
    try {
      const res = await $api(`/items/loss`, {
        method: 'POST',
        body: {
          itemId,
          lostQuantity: payload.lostQuantity,
          reason: payload.reason,
          recordedById: payload.recordedById,
        },
      });
      return res;
    } catch (e: any) {
      console.error('Failed to register loss:', e);
      throw e;
    }
  }

  /**
   * Busca o histórico de perdas de um item
   * @param itemId ID do item
   */
  async function getLossesByItem(itemId: number) {
    try {
      const res: any = await $api(`/items/loss`, {
        method: 'GET',
        params: { itemId },
      });

      if (Array.isArray(res)) losses.value = res;
      else if (res?.losses) losses.value = res.losses;
      else if (res?.data) losses.value = res.data;
      else losses.value = [];

      return losses.value;
    } catch (e) {
      console.error('Failed to get losses by item:', e);
      return [];
    }
  }

  /**
   * Busca o histórico de todas as perdas registradas
   */
  async function getAllLosses() {
    try {
      const res: any = await $api(`/items/loss`, {
        method: 'GET',
      });

      if (Array.isArray(res)) losses.value = res;
      else if (res?.losses) losses.value = res.losses;
      else if (res?.data) losses.value = res.data;
      else losses.value = [];

      return losses.value;
    } catch (e) {
      console.error('Failed to get all losses:', e);
      return [];
    }
  }

  return {
    losses,
    registerLoss,
    getLossesByItem,
    getAllLosses,
  };
});
