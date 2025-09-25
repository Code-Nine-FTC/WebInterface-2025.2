<template>
  <div class="max-w-6xl mx-auto p-6">
    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div>
        <div class="d-flex flex-row items-center gap-3">
          <v-chip variant="elevated" color="red"> Fornecedores </v-chip>
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
      <div class="px-4 py-3 border-b border-slate-100">
        <div class="d-flex items-center gap-2 text-xs text-slate-500">
          <v-icon icon="mdi-account-multiple" class="mr-1" />
          <span> Fornecedores </span>

          <div class="ml-auto flex items-center gap-2">
            <span class="hidden sm:inline text-slate-500">
              Última atualização:
            </span>
            <v-chip
              color="green"
              size="x-small"
              variant="tonal"
              class="font-medium"
            >
              {{ formatDate(lastUpdated) }}
            </v-chip>
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              :loading="loading"
              @click="fetchData"
            >
              Atualizar
            </v-btn>
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

            <template v-slot:item.cnpj="{ item }">
              <span class="text-sm text-slate-700">{{
                formatCNPJ(item.cnpj)
              }}</span>
            </template>
            <template v-slot:item.phoneNumber="{ item }">
              <span class="text-sm text-slate-700">{{
                formatTelefone(item.phoneNumber)
              }}</span>
            </template>

            <template v-slot:item.actions="{ item }">
              <div class="d-flex flex-row gap-1">
                <v-tooltip text="Editar" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      size="small"
                      icon="mdi-pencil"
                      variant="text"
                      color="primary"
                      @click="editSupplier(item)"
                    />
                  </template>
                </v-tooltip>

                <v-tooltip text="Remover" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      size="small"
                      icon="mdi-delete"
                      variant="text"
                      color="red"
                      @click="removeSupplier(item)"
                    />
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-data-table>
        </div>
      </div>
    </v-card>

    <FormSidebar
      @created="handleSupplierCreated"
      @updated="handleSupplierUpdated"
    />
  </div>
</template>

<script setup>
definePageMeta({ layout: "default", middleware: "auth" });
</script>

<script>
import { useAuthStore } from "~/stores/auth";
import { useSupplier } from "~/stores/supplier";
import { useSidebarStore } from "~/stores/sidebar";
import FormSidebar from "~/components/sidebars/suppliers.vue";
import { formatCNPJ, formatTelefone, formatDate } from "~/utils/index";

export default {
  name: "Suppliers",
  layout: "default",
  data() {
    return {
      data: [],
      auth: null,
      loading: false,
      search: "",
      lastUpdated: Date.now(),
      headers: [
        { title: "Nome", key: "name" },
        { title: "E-Mail", key: "email" },
        { title: "Telefone", key: "phoneNumber" },
        { title: "CNPJ", key: "cnpj" },
        { title: "Última Atualização", key: "lastUpdate" },
        { title: "Ações", key: "actions", sortable: false },
      ],
      sidebar: null,
      supplier: null,
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
      } catch {}
    }
    await this.fetchData();
  },
  computed: {
    filteredData() {
      const q = (this.search || "").toLowerCase().trim();
      if (!q) return this.data;
      return this.data.filter((item) =>
        ["nomeFantasia", "razaoSocial", "email", "telefone", "cnpj"].some(
          (k) => {
            const v = item?.[k];
            return v && v.toString().toLowerCase().includes(q);
          }
        )
      );
    },
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        this.data = await this.supplier.list();
        this.lastUpdated = Date.now();
      } catch (e) {
        console.error("Error fetching suppliers:", e);
      } finally {
        this.loading = false;
      }
    },
    openSidebar() {
      this.sidebar?.open({ mode: "create" });
    },
    handleSupplierCreated() {
      this.fetchData();
    },
    editSupplier(item) {
      this.sidebar?.open({ mode: "edit", supplier: item });
    },
    handleSupplierUpdated() {
      this.fetchData();
    },
    async removeSupplier(item) {
      if (!item?.id) return;
      const ok = confirm("Tem certeza que deseja remover este fornecedor?");
      if (!ok) return;
      try {
        await this.supplier.remove({ id: item.id });
        this.data = this.data.filter((s) => s.id !== item.id);
      } catch (e) {
        console.error("Erro ao remover fornecedor:", e);
        this.fetchData();
      }
    },
  },
};
</script>
