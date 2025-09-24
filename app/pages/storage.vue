<template>
  <div>
    <h1 v-if="userRole === 'ADMIN'">Stock</h1>
    <h1 v-else>Stock - {{ userSectionTitle }}</h1>
    <v-text-field
      v-model="search"
      clearable
      variant="outlined"
      label="Pesquisar"
      placeholder="Buscar por nome, QR, fornecedor, seção, tipo..."
      append-inner-icon="mdi-magnify"
    />

    <v-data-table
      :headers="headers"
      :items="filteredData"
      item-key="itemId"
      :loading="loading"
      class="elevation-1"
    >
      <template v-slot:item.expireDate="{ item }">
        {{ formatDate(item.expireDate) }}
      </template>

      <template v-slot:item.lastUpdate="{ item }">
        {{ formatDate(item.lastUpdate) }}
      </template>
    </v-data-table>
  </div>
</template>

<script setup>
definePageMeta({ layout: "default" });
</script>

<script>
import { useAuthStore } from "~/stores/auth";
import { useStorage } from "~/stores/storage";
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
        { title: "Estoque", key: "currentStock" },
        { title: "Unidade", key: "measure" },
        { title: "Validade", key: "expireDate" },
        { title: "Fornecedor", key: "supplierName" },
        { title: "Seção", key: "sectionName" },
        { title: "Mínimo", key: "minimumStock" },
        { title: "Última atualização", key: "lastUpdate" },
        { title: "QR", key: "qrCode" },
      ],
    };
  },
  created() {
    this.auth = useAuthStore();
    this.storage = useStorage();
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
  },
};
</script>
