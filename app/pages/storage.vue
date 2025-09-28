<template>
  <div class="max-w-6xl mx-auto p-6">
    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div>
        <div class="d-flex flex-row items-center gap-3">
          <v-chip v-if="userRole === 'ADMIN'" variant="elevated" color="purple">
            Stock Geral
          </v-chip>
          <v-chip v-else variant="elevated" color="primary">
            {{ userSectionTitle }}
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
          v-if="false"
          prepend-icon="mdi-plus"
          density="comfortable"
          color="primary"
          class="flex-shrink-0 ml-2"
          height="38"
          @click="openSidebar"
        >Cadastrar</v-btn>
        <v-btn
          prepend-icon="mdi-arrow-right"
          density="comfortable"
          color="secondary"
          class="flex-shrink-0 ml-2"
          height="38"
          @click="goToTypeItems"
        >Tipos de Item</v-btn>
      </div>
    </v-card>

    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div class="px-4 py-3 border-b border-slate-100">
        <div class="d-flex items-center gap-2 text-xs text-slate-500">
          <v-icon icon="mdi-warehouse" class="mr-1" />
          <span> Estoque </span>

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
              {{ formatDate(Date.now()) }}
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
            item-key="itemId"
            :loading="loading"
            class="min-w-[900px]"
          >
            <template v-slot:item.expireDate="{ item }">
              <span class="text-sm text-slate-700">{{
                formatDate(item.expireDate)
              }}</span>
            </template>

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
import { useStorage } from "~/stores/storage";
import FormSidebar from "~/components/sidebar.exemple.vue";
import { useSidebarStore } from "~/stores/sidebar";

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
        { title: "Tipo", key: "itemTypeName" },
        { title: "Estoque", key: "currentStock" },
        { title: "Unidade", key: "measure" },
        { title: "Validade", key: "expireDate" },
        { title: "Fornecedor", key: "supplierName" },
        { title: "Seção", key: "sectionName" },
        { title: "Stock Mínimo", key: "minimumStock" },
        { title: "Última atualização", key: "lastUpdate" },
        // { title: "QR", key: "qrCode" },
      ],
      sidebar: null,
    };
  },
  created() {
    this.auth = useAuthStore();
    this.storage = useStorage();
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
    userSectionTitle() {
      const sections = this.auth?.user?.sections || [];
      return sections.length > 0 ? sections[0].title : "None";
    },
    userRole() {
      return this.auth?.user?.role || "DEFAULT";
    },
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        if (this.userRole === "ADMIN") {
          this.data = await this.storage.list();
        } else {
          const sectionId = this.userSections.length
            ? this.userSections[0].id
            : null;
          this.data = await this.storage.list(sectionId ? { sectionId } : {});
        }
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
    goToTypeItems() {
      this.$router.push({ path: '/typeitems' });
    },
  },
};
</script>
