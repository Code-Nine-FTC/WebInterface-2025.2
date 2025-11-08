import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSection = defineStore('section', () => {
  const sections = ref<Array<any>>([]);
  const { $api } = useNuxtApp();

  async function list(payload: { sectionType?: string } = {}) {
    try {
      const params = new URLSearchParams();
      if (payload.sectionType) params.append('sectionType', String(payload.sectionType));
      const url = params.toString() ? `/sections?${params.toString()}` : '/sections';
      const res: any = await $api(url);
      if (Array.isArray(res)) sections.value = res;
      else if (res?.sections) sections.value = res.sections;
      else if (res?.data) sections.value = res.data;
      else sections.value = [];
      return sections.value;
    } catch (e) {
      console.error('Failed to list sections:', e);
      return [];
    }
  }

  async function getById(id: number | string) {
    try {
      return await $api(`/sections/${id}`);
    } catch (e) {
      console.error('Failed to get section by id:', e);
      throw e;
    }
  }

  async function listConsumers() {
    try {
      const res: any = await $api('/sections/consumers');
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.sections)) return res.sections;
      return [];
    } catch (e: any) {
      // rethrow 403 to allow fallback on caller
      if (e?.status === 403 || e?.response?.status === 403) throw e;
      console.error('Failed to list consumer sections:', e);
      return [];
    }
  }

  async function create(payload: Record<string, any>) {
    try {
      return await $api('/sections', {
        method: 'POST',
        body: payload,
      });
    } catch (e) {
      console.error('Failed to create section:', e);
      throw e;
    }
  }

  async function update(payload: Record<string, any>) {
    try {
      return await $api(`/sections/${payload.id}`, {
        method: 'PUT',
        body: payload,
      });
    } catch (e) {
      console.error('Failed to update section:', e);
      throw e;
    }
  }

  async function disable(payload: Record<string, any>) {
    try {
      return await $api(`/sections/${payload.id}`, {
        method: 'PATCH',
      });
    } catch (e) {
      console.error('Failed to disable section:', e);
    }
  }

  async function remove(payload: Record<string, any>) {
    try {
      return await $api(`/sections/${payload.id}`, {
        method: 'DELETE',
        body: payload,
      });
    } catch (e) {
      console.error('Failed to remove section:', e);
    }
  }

  return {
    sections,
    list,
    getById,
    listConsumers,
    create,
    update,
    disable,
    remove,
  };
});
