import { useAuthStore } from "../stores/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const publicPage = (to?.meta as any)?.auth === false;
  if (publicPage) return;

  const auth = useAuthStore();
  const cookie = useCookie("token");

  if (!auth.token) auth.setTokenFromCookie();

  if (auth.token || cookie.value) return;

  try {
    await auth.fetchUser();
    if (auth.token || cookie.value) return;
  } catch (e) {
    console.error(e);
  }

  return navigateTo("/login");
});
