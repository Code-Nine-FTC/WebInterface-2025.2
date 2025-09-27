<template>
  <v-navigation-drawer
    :model-value="visible"
    location="right"
    temporary
    width="600"
    class="order-sidebar"
  >
    <v-toolbar flat density="comfortable">
      <v-toolbar-title>{{ isEdit ? "Editar Pedido" : "Cadastrar Pedido" }}</v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" @click="close" />
    </v-toolbar>
    <v-divider />
    <v-form ref="form" class="pa-4" @submit.prevent="handleSubmit">
      <v-row dense>
        <v-col cols="12">
          <v-select
            v-model="form.status"
            :items="statusOptions"
            label="Status"
            required
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="form.withdrawDay"
            label="Data de Retirada"
            type="date"
            required
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="form.items"
            :items="items"
            item-title="name"
            item-value="id"
            label="Itens"
            multiple
            chips
            required
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="form.suppliers"
            :items="suppliers"
            item-title="name"
            item-value="id"
            label="Fornecedores"
            multiple
            chips
            required
          />
        </v-col>
        <v-col cols="12" class="d-flex justify-end ga-2 mt-4">
          <v-btn text @click="reset">Limpar</v-btn>
          <v-btn color="primary" @click="handleSubmit">
            {{ isEdit ? "Salvar" : "Criar" }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-navigation-drawer>
</template>

<script>
export default {
  props: {
    visible: Boolean,
    order: Object,
    isEdit: Boolean,
    items: {
      type: Array,
      default: () => [],
    },
    suppliers: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["close", "save", "update:visible"],
  data() {
    return {
      form: {
        status: "PENDING",
        withdrawDay: "",
        items: [],
        suppliers: [],
      },
      statusOptions: ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"],
    };
  },
  watch: {
    order: {
      handler(val) {
        if (val) {
          this.form = {
            status: val.status || "PENDING",
            withdrawDay: val.withdrawDay || "",
            items: val.items ? val.items.map(i => i.id) : [],
            suppliers: val.suppliers ? val.suppliers.map(s => s.id) : [],
          };
        } else {
          this.form = {
            status: "PENDING",
            withdrawDay: "",
            items: [],
            suppliers: [],
          };
        }
      },
      immediate: true,
    },
  },
  methods: {
    close() {
      this.$emit("close");
      this.$emit("update:visible", false);
    },
    reset() {
      this.form = {
        status: "PENDING",
        withdrawDay: "",
        items: [],
        suppliers: [],
      };
    },
    handleSubmit() {
      this.$emit("save", { ...this.form });
      this.close();
    },
    onUpdateVisible(val) {
      this.$emit("update:visible", val);
    },
  },
};
</script>

<style scoped>
.order-sidebar {
  z-index: 9999;
}
</style>
