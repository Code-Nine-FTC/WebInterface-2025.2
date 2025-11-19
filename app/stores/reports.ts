import { defineStore } from 'pinia';

export const useReports = defineStore('reports', () => {
  const nuxt = useNuxtApp();
  const $api = nuxt.$api;

  async function generateStockReport(format = 'pdf', sectionId = null) {
    const f = (format || 'pdf').toLowerCase();
    const params = new URLSearchParams();
    if (sectionId) params.append('sectionId', sectionId);
    params.append('format', f === 'excel' ? 'excel' : 'pdf');

    const url = `/reports/stock?${params.toString()}`;

    const blob = await $api(url, { method: 'GET', responseType: 'blob', credentials: 'include' });
    return blob as unknown as Blob;
  }

  async function generateOrdersReport(format = 'pdf') {
    const f = (format || 'pdf').toLowerCase();
    const params = new URLSearchParams();
    params.append('format', f === 'excel' ? 'excel' : 'pdf');
    const url = `/reports/orders?${params.toString()}`;
    const blob = await $api(url, { method: 'GET', responseType: 'blob', credentials: 'include' });
    return blob as unknown as Blob;
  }

  return {
    generateStockReport,
    generateOrdersReport,
  };
});
