export default defineNuxtPlugin(() => {
  const auth = useAuthStore();
  const tokenCookie = useCookie<string | null>("token");
  const apiBase = useRuntimeConfig().public.apiBase;

  const api = $fetch.create({
    baseURL: apiBase,
    onRequest({ options }) {
      const t = auth.token || tokenCookie.value;
      if (t) {
        const headers = new Headers(options.headers || {});
        headers.set("Authorization", `Bearer ${t}`);
        if (!headers.has("Accept")) headers.set("Accept", "application/json");
        options.headers = headers;
      }
    },
    onResponseError({ response }) {
      if (response.status === 401 && process.client) {
        try {
          auth.logout();
        } catch {}
      }
    },
  });

  return {
    provide: {
      api,
    },
  };
});
