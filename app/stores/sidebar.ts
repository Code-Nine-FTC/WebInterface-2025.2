import { defineStore } from "pinia";
import { ref } from "vue";

export const useSidebarStore = defineStore("sidebar", () => {
  const isOpen = ref(false);
  const payload = ref<any>(null);

  function open(data?: any) {
    payload.value = data ?? null;
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
    payload.value = null;
  }

  function toggle() {
    isOpen.value = !isOpen.value;
  }

  return { isOpen, payload, open, close, toggle };
});
