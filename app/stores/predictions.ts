import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Prediction {
  id: number;
  itemId: number;
  itemName: string;
  predictionMonth: string;
  predictedQuantity: number;
  confidenceScore: number;
  modelVersion: string;
  createdAt: string;
  updatedAt: string;
}

export const usePredictionsStore = defineStore('predictions', () => {
  const { $api } = useNuxtApp();
  const predictions = ref<Prediction[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Gerar previsões para todos os itens
   */
  async function generateAll(): Promise<Prediction[]> {
    loading.value = true;
    error.value = null;
    try {
      const res: any = await $api('/predictions/generate-all', {
        method: 'POST',
      });
      predictions.value = Array.isArray(res) ? res : [];
      return predictions.value;
    } catch (e: any) {
      error.value = e?.message || 'Falha ao gerar previsões';
      console.error('Failed to generate all predictions:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Gerar previsão para um item específico
   */
  async function generateForItem(itemId: number, month?: string): Promise<Prediction> {
    loading.value = true;
    error.value = null;
    try {
      const params = month ? { month } : {};
      const res: any = await $api(`/predictions/generate/${itemId}`, {
        method: 'POST',
        params,
      });
      return res;
    } catch (e: any) {
      error.value = e?.message || 'Falha ao gerar previsão';
      console.error('Failed to generate prediction for item:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Buscar previsão de um item (gera se não existir)
   */
  async function getByItem(itemId: number, month?: string): Promise<Prediction> {
    loading.value = true;
    error.value = null;
    try {
      const params = month ? { month } : {};
      const res: any = await $api(`/predictions/item/${itemId}`, {
        params,
      });
      return res;
    } catch (e: any) {
      error.value = e?.message || 'Falha ao buscar previsão';
      console.error('Failed to get prediction by item:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Histórico de previsões de um item
   */
  async function getHistoryByItem(itemId: number): Promise<Prediction[]> {
    loading.value = true;
    error.value = null;
    try {
      const res: any = await $api(`/predictions/item/${itemId}/history`);
      return Array.isArray(res) ? res : [];
    } catch (e: any) {
      error.value = e?.message || 'Falha ao buscar histórico';
      console.error('Failed to get prediction history:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Buscar todas as previsões de um mês
   */
  async function getByMonth(month: string): Promise<Prediction[]> {
    loading.value = true;
    error.value = null;
    try {
      const res: any = await $api(`/predictions/month/${month}`);
      predictions.value = Array.isArray(res) ? res : [];
      return predictions.value;
    } catch (e: any) {
      error.value = e?.message || 'Falha ao buscar previsões do mês';
      console.error('Failed to get predictions by month:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    predictions,
    loading,
    error,
    generateAll,
    generateForItem,
    getByItem,
    getHistoryByItem,
    getByMonth,
  };
});
