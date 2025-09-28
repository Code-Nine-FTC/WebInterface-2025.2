<template>
  <v-navigation-drawer
    v-model="sidebar.isOpen"
    location="right"
    temporary
    width="600"
  >
    <v-toolbar flat density="comfortable">
      <v-toolbar-title>{{
        isEdit ? "Editar Fornecedor" : "Cadastrar Fornecedor"
      }}</v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" :disabled="loading" @click="closeAndReset" />
    </v-toolbar>

    <v-divider />

    <v-form
      ref="formRef"
      v-model="formValid"
      class="pa-4"
      @submit.prevent="submit"
    >
      <v-row dense>
        <v-col cols="12">
          <v-text-field
            v-model="form.nomeFornecedor"
            label="Nome Fornecedor"
            :rules="[rules.required]"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="form.email"
            label="E-mail"
            :rules="[rules.required, rules.email]"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.cnpj"
            label="CNPJ"
            :rules="[rules.required, rules.cnpj]"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            placeholder="00.000.000/0000-00"
            @input="onCNPJInput"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.telefone"
            label="Telefone"
            :rules="[rules.required, rules.telefone]"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            placeholder="(11) 91234-5678"
            @input="onTelefoneInput"
          />
        </v-col>

        <v-col cols="12">
          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            density="comfortable"
            class="mb-2"
          >
            {{ error }}
          </v-alert>
        </v-col>

        <v-col cols="12" class="d-flex justify-end ga-2 mt-4">
          <v-btn
            type="button"
            variant="text"
            :disabled="loading"
            @click="reset"
          >
            Limpar
          </v-btn>
          <v-btn
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="!formValid"
          >
            {{ isEdit ? "Salvar Alterações" : "Salvar" }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-navigation-drawer>
</template>

<script>
import { useSidebarStore } from "~/stores/sidebar";
import { useSupplier } from "~/stores/supplier";
import { formatCNPJ, formatTelefone } from "~/utils/index";

export default {
  name: "FormSidebar",
  emits: ["created", "updated"],
  data() {
    return {
      sidebar: null,
      supplierStore: null,
      loading: false,
      formValid: true,
      error: null,
      currentId: null,
      form: {
        nomeFornecedor: "",
        cnpj: "",
        email: "",
        telefone: "",
      },
      rules: {
        required: (v) => !!v || v === 0 || "Obrigatório",
        email: (v) =>
          !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "E-mail inválido",
        cnpj: (v) => {
          if (!v) return true;
          const digits = v.replace(/\D/g, "");
          return digits.length === 14 || "CNPJ deve ter 14 dígitos";
        },
        telefone: (v) => {
          if (!v) return true;
          const d = v.replace(/\D/g, "");
          return d.length === 10 || d.length === 11 || "Telefone inválido";
        },
      },
    };
  },
  computed: {
    isEdit() {
      return this.sidebar?.payload?.mode === "edit";
    },
  },
  created() {
    this.sidebar = useSidebarStore();
    this.supplierStore = useSupplier();
    this.prefillIfEdit();
  },
  watch: {
    "sidebar.payload": {
      deep: true,
      handler() {
        this.prefillIfEdit();
      },
    },
    "sidebar.isOpen"(open) {
      if (!open) {
        // Ao fechar, limpa para próxima abertura
        setTimeout(() => this.reset(), 150);
      }
    },
  },
  methods: {
    prefillIfEdit() {
      if (this.isEdit && this.sidebar.payload?.supplier) {
        const s = this.sidebar.payload.supplier;
        this.currentId = s.id;
        this.form.nomeFornecedor =
          s.name || s.nomeFornecedor || s.nomeFantasia || "";
        this.form.cnpj = formatCNPJ(s.cnpj || "");
        this.form.email = s.email || "";
        this.form.telefone = formatTelefone(s.phoneNumber || s.telefone || "");
      } else if (!this.isEdit) {
        this.currentId = null;
        this.reset();
      }
    },
    onCNPJInput() {
      this.form.cnpj = formatCNPJ(this.form.cnpj);
    },
    onTelefoneInput() {
      this.form.telefone = formatTelefone(this.form.telefone);
    },
    reset() {
      this.error = null;
      this.currentId = null;
      this.form = {
        nomeFornecedor: "",
        cnpj: "",
        email: "",
        telefone: "",
      };
      if (this.$refs.formRef) this.$refs.formRef.resetValidation();
    },
    closeAndReset() {
      this.sidebar.close();
      this.reset();
    },
    async submit() {
      this.error = null;
      if (this.$refs.formRef) {
        const ok = await this.$refs.formRef.validate();
        if (!ok.valid) return;
      }
      this.loading = true;
      try {
        const payload = {
          name: this.form.nomeFornecedor,
          email: this.form.email.trim(),
          phoneNumber: this.form.telefone.replace(/\D/g, ""),
          cnpj: this.form.cnpj.replace(/\D/g, ""),
        };
        if (this.isEdit && this.currentId) {
          const updated = await this.supplierStore.update({
            id: this.currentId,
            ...payload,
          });
          this.$emit("updated", updated);
        } else {
          const created = await this.supplierStore.create(payload);
          this.$emit("created", created);
        }
        this.sidebar.close();
        this.reset();
      } catch (e) {
        this.error = this.isEdit
          ? "Falha ao atualizar fornecedor"
          : "Falha ao salvar fornecedor";
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
