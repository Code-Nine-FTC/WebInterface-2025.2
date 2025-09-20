import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<any | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);

  const cookie = useCookie("token");
  const apiBase = useRuntimeConfig().public.apiBase || "";

  const isAuthenticated = computed(() => !!(token.value || cookie.value));

  function setTokenFromCookie() {
    token.value = cookie.value || null;
  }

  async function login(payload: Record<string, any>) {
    loading.value = true;
    try {
      const res: any = await $fetch("/login", {
        baseURL: apiBase,
        method: "POST",
        body: payload,
      });
      token.value = res.token;
      user.value = res.user ?? null;
      cookie.value = res.token;
      return res;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUser() {
    const t = token.value || cookie.value;
    if (!t) return null;
    try {
      const u: any = await $fetch("/auth/me", {
        baseURL: apiBase,
        headers: { Authorization: `Bearer ${t}` },
      });
      user.value = u;
      token.value = t;
      return u;
    } catch (e) {
      logout();
      throw e;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    cookie.value = null;
    return navigateTo("/login");
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    setTokenFromCookie,
    login,
    fetchUser,
    logout,
  };
});
