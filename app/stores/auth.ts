import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<any | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const email = ref<string | null>(null);
  const role = ref<string | null>(null);

  const cookie = useCookie("token", {
    path: "/",
    maxAge: 60 * 60 * 12,
    sameSite: "lax",
  });
  const apiBase = useRuntimeConfig().public.apiBase || "http://localhost:8080";

  const isAuthenticated = computed(() => !!(token.value || cookie.value));

  function setTokenFromCookie() {
    token.value = cookie.value || null;
  }

  async function initializeAuth() {
    if ((cookie.value || token.value) && !user.value) {
      console.log("Initializing auth from cookie/token");
      token.value = token.value ?? cookie.value ?? null;
      try {
        await fetchUser();
      } catch (e) {
        console.error("Failed to initialize user from token:", e);
        logout();
      }
    }
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
      cookie.value = res.token;

      user.value = {
        name: res.name,
        email: res.email,
        role: res.role,
        sections: res.sections,
      };

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
    email.value = null;
    role.value = null;
    cookie.value = null;
    return navigateTo("/login");
  }

  return {
    user,
    token,
    loading,
    email,
    role,
    isAuthenticated,
    setTokenFromCookie,
    initializeAuth,
    login,
    fetchUser,
    logout,
  };
});
