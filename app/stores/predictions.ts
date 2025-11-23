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

  async function getByItem(itemId: number): Promise<Prediction> {
    loading.value = true;
    error.value = null;
    try {
      const res: any = await $api(`/stock-prediction/item/${itemId}`, {
        baseURL: 'http://localhost:8000',
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

  return {
    predictions,
    loading,
    error,
    getByItem,
  };
});
