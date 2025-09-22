<template>
  <div class="container">
    <v-img :width="200" :max-height="300" src="~/assets/icons/logo.svg" />
    <v-sheet class="mx-auto" width="300">
      <v-form fast-fail @submit.prevent="handleSubmit" class="bg-form">
        <v-text-field
          variant="solo-filled"
          v-model="email"
          :rules="emailRules"
          label="Email"
          required
        ></v-text-field>

        <v-text-field
          variant="solo-filled"
          v-model="password"
          :rules="passwordRules"
          type="password"
          label="Senha"
          required
        ></v-text-field>

        <v-btn class="mt-2" type="submit" :loading="loading" block
          >Entrar</v-btn
        >

        <v-alert v-if="error" type="error" class="mt-3">{{ error }}</v-alert>
      </v-form>
    </v-sheet>
  </div>
</template>

<script setup>
definePageMeta({ layout: "auth", auth: false });
</script>

<script>
import { useAuthStore } from "~/stores/auth";

export default {
  name: "LoginPage",
  data() {
    return {
      password: "",
      email: "",
      error: null,
      loading: false,
      passwordRules: [
        (value) =>
          (value && value.length >= 6) ||
          "A senha deve ter no mínimo 6 caracteres.",
        (value) =>
          (value && /[A-Za-z]/.test(value)) ||
          "A senha deve conter pelo menos uma letra.",
        (value) =>
          (value && /[0-9]/.test(value)) ||
          "A senha deve conter pelo menos um número.",
      ],
      emailRules: [
        (value) => (value && value.length > 0) || "O email é obrigatório.",
        (value) =>
          (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) ||
          "Informe um email válido (ex.: usuario@dominio.com).",
      ],
    };
  },
  created() {
    this.auth = useAuthStore();
  },
  computed: {
    isAuthenticated() {
      return this.auth?.loading ?? false;
    },
  },
  methods: {
    async handleSubmit() {
      this.error = null;
      const emailValid = this.emailRules.every((r) => r(this.email) === true);
      const passValid = this.passwordRules.every(
        (r) => r(this.password) === true
      );
      if (!emailValid || !passValid) {
        this.error = "Por favor corrija os campos destacados.";
        return;
      }

      try {
        this.loading = true;
        await this.auth.login({ email: this.email, password: this.password });
        this.$router.push("/home");
      } catch (err) {
        this.error =
          err?.data?.message ||
          err?.message ||
          "Falha ao efetuar login. Verifique suas credenciais.";
        console.error("Login failed", err);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
.bg-form {
  background-color: var(--color-primary) !important;
  padding: 20px;
}
</style>