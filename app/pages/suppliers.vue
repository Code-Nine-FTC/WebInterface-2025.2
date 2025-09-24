<template>
  <div class="max-w-6xl mx-auto p-6">
    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div>
        <div class="d-flex flex-row items-center gap-3">
          <v-chip variant="elevated" color="red">
            Fornecedores
          </v-chip>
        </div>
      </div>

      <div class="d-flex flex-row items-center gap-2 mt-2">
        <v-text-field
          v-model="search"
          clearable
          density="compact"
          variant="outlined"
          label="Pesquisar"
          placeholder="Buscar por nome, QR, fornecedor, seção, tipo..."
          append-inner-icon="mdi-magnify"
          class="flex-1"
        />
        <v-btn
          icon="mdi-plus"
          density="comfortable"
          color="primary"
          class="flex-shrink-0 ml-2"
          @click="openSidebar"
        />
      </div>
    </v-card>

    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div class="pa-4 border-b">
        <div class="flex items-center justify-between">
          <div class="text-xs text-slate-500">
            Última atualização:
            <v-chip color="green">{{ formatDate(Date.now()) }}</v-chip>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div class="overflow-auto">
          <v-data-table
            :headers="headers"
            :items="filteredData"
            item-key="id"
            :loading="loading"
            class="min-w-[900px]"
          >
            <template v-slot:item.lastUpdate="{ item }">
              <span class="text-sm text-slate-700">{{
                formatDate(item.lastUpdate)
              }}</span>
            </template>

          </v-data-table>
        </div>
      </div>
    </v-card>
    <FormSidebar />
  </div>
</template>

<script setup>
definePageMeta({ layout: "default" });
</script>

<script>
import { useAuthStore } from "~/stores/auth";
import { useSupplier } from "~/stores/supplier";
import { useSidebarStore } from "~/stores/sidebar";
import FormSidebar from "~/components/sidebars/suppliers.vue";

export default {
  name: "Storage",
  layout: "default",
  data() {
    return {
      data: [],
      auth: null,
      loading: false,
      search: "",
      headers: [
        { title: "Nome", key: "name" },
        { title: "E-Mail", key: "email" },
        { title: "Telefone", key: "phoneNumber" },
        { title: "CNPJ", key: "cnpj" },
        { title: "Última Atualização", key: "lastUpdate" },
      ],
      sidebar: null,
    };
  },
  created() {
    this.auth = useAuthStore();
    this.supplier = useSupplier();
    this.sidebar = useSidebarStore();
  },
  async mounted() {
    if (this.auth && typeof this.auth.initializeAuth === "function") {
      try {
        await this.auth.initializeAuth();
      } catch (e) {
        console.warn("initializeAuth falhou:", e);
      }
    }
    await this.fetchData();
  },
  computed: {
    filteredData() {
      const q = (this.search || "").toString().toLowerCase().trim();
      if (!q) return this.data;
      return this.data.filter((item) => {
        return [
          "name",
          "qrCode",
          "supplierName",
          "sectionName",
          "itemTypeName",
          "lastUserName",
          "itemId",
        ].some((key) => {
          const v = item?.[key];
          return (
            v !== undefined &&
            v !== null &&
            v.toString().toLowerCase().includes(q)
          );
        });
      });
    },
    userName() {
      return this.auth?.user?.name || "Usuário";
    },
    userEmail() {
      return this.auth?.user?.email || "—";
    },
    userSections() {
      return this.auth?.user?.sections || [];
    },
    userRole() {
      return this.auth?.user?.role || "DEFAULT";
    },
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        this.data = await this.supplier.list();
        this.loading = false;
      } catch (e) {
        console.error("Error fetching data:", e);
      }
    },
    formatDate(value) {
      if (!value) return "—";
      try {
        const d = new Date(value);
        return d.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return value;
      }
    },
    openSidebar() {
      this.sidebar?.open({ mode: "create" });
    },
  },
};
</script>
