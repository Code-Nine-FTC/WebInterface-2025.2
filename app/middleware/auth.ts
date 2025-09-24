import { useAuthStore } from "../stores/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const publicPages = ["/login"];

  if (publicPages.includes(to.path)) return;

  const publicPage = (to?.meta as any)?.auth === false;
  if (publicPage) return;

  if (import.meta.server) return;

  const auth = useAuthStore();

  if (!auth.token && !auth.user) {
    try {
      await auth.initializeAuth();
    } catch (e) {
      console.error("Auth initialization failed:", e);
      return navigateTo("/login");
    }
  }

  // Verifica se está autenticado
  if (!auth.isAuthenticated) {
    return navigateTo("/login");
  }
});
