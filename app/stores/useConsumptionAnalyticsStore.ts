import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useConsumptionAnalyticsStore = defineStore('consumptionAnalytics', () => {
  function formatDateParam(date: string | Date | null): string {
    if (!date) return '';
    if (date instanceof Date) {
      return date.toISOString().split('T')[0] ?? '';
    }
    let cleanDate = date.replace(/"/g, '');
    if (cleanDate.includes('T')) {
      cleanDate = cleanDate.split('T')[0] || '';
    }
    return cleanDate;
  }
  const startDate = ref<string | null>(null);
  const endDate = ref<string | null>(null);
  const metric = ref('quantity');
  const summary = ref<any[]>([]);
  const series = ref<any[]>([]);
  const seriesCategories = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<unknown>(null);
  const { $api } = useNuxtApp();

  async function fetchData() {
    console.log('fetchData chamado com:', {
      startDate: startDate.value,
      endDate: endDate.value,
      limit: 10,
      onlyCompleted: true,
    });
    loading.value = true;
    error.value = null;
    try {
      const res = await $api('/api/analytics/materiais/top', {
        params: {
          startDate: formatDateParam(startDate.value),
          endDate: formatDateParam(endDate.value),
          limit: 10,
          onlyCompleted: true,
        },
      });
      console.log('Dados recebidos de /materiais/top:', res);
      summary.value = Array.isArray(res) ? [...res] : [...(res?.data || [])];
      const seriesRes = await $api('/api/analytics/grupos/demanda-series', {
        params: {
          startDate: formatDateParam(startDate.value),
          endDate: formatDateParam(endDate.value),
          step: 'month',
          onlyCompleted: true,
        },
      });
      console.log('Dados recebidos de /grupos/demanda-series:', seriesRes);
      series.value = Array.isArray(seriesRes?.series) ? [...seriesRes.series] : [];
      seriesCategories.value = Array.isArray(seriesRes?.categories)
        ? [...seriesRes.categories]
        : [];
    } catch (e) {
      error.value = e;
      summary.value = [];
      series.value = [];
    } finally {
      loading.value = false;
    }
  }

  return {
    startDate,
    endDate,
    metric,
    summary,
    series,
    seriesCategories,
    loading,
    error,
    fetchData,
  };
});
