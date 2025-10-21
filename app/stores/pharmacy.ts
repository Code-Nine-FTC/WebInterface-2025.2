import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePharmacy = defineStore('pharmacy', () => {
  const summary = ref<any>(null);
  const expiredItems = ref<Array<any>>([]);
  const expiringSoonItems = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function fetchExpiryData(days: number = 30) {
    try {
      const [summaryRes, listsRes] = await Promise.all([
        $api(`/api/pharmacy/items/expiry-summary?days=${days}`).catch((err) => {
          console.error('Error fetching summary:', err);
          return null;
        }),
        $api(`/api/pharmacy/items/expiry-list?days=${days}`).catch((err) => {
          console.error('Error fetching lists:', err);
          return { expired: [], expiringSoon: [] };
        }),
      ]);

      summary.value = summaryRes;

      if (listsRes) {
        const expired = listsRes.expired || listsRes.expiredItems || [];
        const expiringSoon = listsRes.expiringSoon || listsRes.expiringSoonItems || [];

        expiredItems.value = Array.isArray(expired) ? expired : [];
        expiringSoonItems.value = Array.isArray(expiringSoon) ? expiringSoon : [];
      } else {
        expiredItems.value = [];
        expiringSoonItems.value = [];
      }

      return {
        summary: summary.value,
        expiredItems: expiredItems.value,
        expiringSoonItems: expiringSoonItems.value,
      };
    } catch (e) {
      console.error('Failed to fetch expiry data:', e);
      return { summary: null, expiredItems: [], expiringSoonItems: [] };
    }
  }

  async function deleteItem(itemId: number | string) {
    try {
      await $api(`/api/pharmacy/items/${itemId}`, {
        method: 'DELETE',
      });
      expiredItems.value = expiredItems.value.filter((item) => item.id !== itemId);
      expiringSoonItems.value = expiringSoonItems.value.filter((item) => item.id !== itemId);
      return true;
    } catch (e) {
      console.error('Failed to delete item:', e);
      throw e;
    }
  }

  function clearData() {
    summary.value = null;
    expiredItems.value = [];
    expiringSoonItems.value = [];
  }

  return {
    summary,
    expiredItems,
    expiringSoonItems,
    fetchExpiryData,
    deleteItem,
    clearData,
  };
});
