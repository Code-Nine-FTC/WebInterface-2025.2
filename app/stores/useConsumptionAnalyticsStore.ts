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
  const onlyCompleted = ref<boolean>(false);
  const step = ref<'day' | 'week' | 'month'>('month');
  // Ranking por seção
  const summary = ref<any[]>([]);
  // Séries por seção
  const series = ref<any[]>([]);
  const seriesCategories = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<unknown>(null);
  const { $api } = useNuxtApp();

  async function fetchData() {
    console.log('fetchData (seções) chamado com:', {
      startDate: startDate.value,
      endDate: endDate.value,
      onlyCompleted: onlyCompleted.value,
      step: step.value,
    });
    loading.value = true;
    error.value = null;
    try {
      // Ranking por seção consumidora
      const res = await $api('/api/analytics/secoes/consumo', {
        params: {
          startDate: formatDateParam(startDate.value),
          endDate: formatDateParam(endDate.value),
          onlyCompleted: onlyCompleted.value,
          onlyConsumers: true,
          onlyActiveConsumers: true,
        },
      });
      console.log('Dados recebidos de /secoes/consumo:', res);
      const arr = Array.isArray(res) ? res : res?.data || [];
      summary.value = Array.isArray(arr)
        ? arr.map((r: any) => ({
            secaoId: Number(r.secaoId ?? r.sectionId ?? r.id),
            secaoNome: String(
              r.secaoNome ?? r.nome ?? r.title ?? r.name ?? `#${r.secaoId ?? r.id}`,
            ),
            pedidos: Number(r.pedidos ?? r.orders ?? r.count ?? 0),
            quantidade: Number(r.quantidade ?? r.quantity ?? r.sum ?? 0),
          }))
        : [];
      // ordenar por quantidade(desc) depois pedidos(desc)
      summary.value.sort((a, b) => b.quantidade - a.quantidade || b.pedidos - a.pedidos);

      // Séries por seção
      const seriesRes = await $api('/api/analytics/secoes/series', {
        params: {
          startDate: formatDateParam(startDate.value),
          endDate: formatDateParam(endDate.value),
          step: step.value,
          onlyCompleted: onlyCompleted.value,
          onlyConsumers: true,
          onlyActiveConsumers: true,
        },
      });
      console.log('Dados recebidos de /secoes/series:', seriesRes);
      series.value = Array.isArray(seriesRes?.series)
        ? seriesRes.series.map((s: any) => ({
            secaoId: Number(s.secaoId ?? s.sectionId ?? s.id ?? 0),
            name: String(s.nome ?? s.name ?? s.title ?? '-'),
            data: Array.isArray(s.data) ? s.data.map((v: any) => Number(v) || 0) : [],
          }))
        : [];
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
    onlyCompleted,
    step,
    summary,
    series,
    seriesCategories,
    loading,
    error,
    fetchData,
  };
});
