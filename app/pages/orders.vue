<template>
  <div class="max-w-6xl mx-auto p-6">
    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
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
          prepend-icon="mdi-plus"
          density="comfortable"
          color="primary"
          class="flex-shrink-0 ml-2"
          height="38"
          @click="openSidebar"
          >Cadastrar</v-btn
        >
      </div>
    </v-card>

    <div class="kpi-grid my-6">
      <v-card
        v-for="k in kpis"
        :key="k.key"
        class="kpi-card pa-4 d-flex flex-column justify-space-between"
        elevation="2"
      >
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption text-medium-emphasis font-medium">
            {{ k.label }}
          </span>
          <v-icon :icon="k.icon" size="20" class="text-medium-emphasis" />
        </div>
        <div class="kpi-value">
          {{ k.loading ? "…" : k.value }}
        </div>
      </v-card>
    </div>

  <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div class="px-4 py-3 border-b border-slate-100">
        <div class="d-flex items-center gap-2 text-xs text-slate-500">
          <v-icon icon="mdi-account-multiple" class="mr-1" />
          <span> Pedidos </span>

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
                <v-tooltip text="Ver" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      size="small"
                      icon="mdi-eye"
                      variant="text"
                      color="primary"
                      @click="viewOrder(item)"
                    />
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-data-table>
        </div>
      </div>
    </v-card>
    <OrdersFormSidebar @created="handleOrderCreated" />
  </div>
</template>

<script setup>
definePageMeta({ layout: "default", middleware: "auth" });
</script>

<script>
import { useAuthStore } from "~/stores/auth";
import { useSupplier } from "~/stores/supplier";
import { useStorage } from "~/stores/storage";
import { useSidebarStore } from "~/stores/sidebar";
import { useOrders } from "~/stores/orders";
import OrdersFormSidebar from "~/components/sidebars/orders.vue";
import { formatCNPJ, formatDate, formatTelefone } from "~/utils";

export default {
  data() {
    return {
      auth: null,
      supplierStore: null,
      storageStore: null,
      sidebar: null,
  suppliersLoading: false,
      itemsLoading: false,
      suppliers: [],
      items: [],
      search: "",
      loading: false,
      lastUpdated: Date.now(),
  orders: [],
      kpis: [
        {
          key: "items",
          label: "Itens",
          icon: "mdi-package-variant",
          value: 0,
          loading: true,
        },
        {
          key: "crit",
          label: "Críticos",
          icon: "mdi-alert-circle",
          value: 0,
          loading: true,
        },
        {
          key: "suppliers",
          label: "Fornecedores",
          icon: "mdi-domain",
          value: 0,
          loading: true,
        },
        {
          key: "sections",
          label: "Seções",
          icon: "mdi-view-grid",
          value: 0,
          loading: true,
        },
      ],
      headers: [
        { title: "Pedido", key: "id", width: 100 },
        { title: "Fornecedor", key: "supplierName" },
        { title: "Itens", key: "itemsCount" },
        { title: "Última atualização", key: "lastUpdate" },
        { title: "Ações", key: "actions", sortable: false, width: 100 },
      ]
    };
  },
  computed: {
    filteredData() {
      const q = (this.search || "").toLowerCase().trim();
      const data = (this.orders || []).map((o) => ({
        ...o,
        supplierName: o.supplierName || o.supplier?.name || o.supplier?.nomeFantasia || o.supplierId,
        itemsCount: o.itemsCount ?? o.items?.length ?? 0,
      }));
      if (!q) return data;
      return data.filter((o) => [String(o.id), o.supplierName].some((v) => String(v).toLowerCase().includes(q)));
    },
    userRole() {
      return this.auth?.user?.role;
    },
    lastSuppliers() {
      return [...this.suppliers]
        .map((s) => ({
          ...s,
          name: s.name || s.nomeFantasia || s.razaoSocial || "#" + s.id,
          lastUpdate: s.lastUpdate || s.updatedAt || s.createdAt || null,
        }))
        .sort(
          (a, b) =>
            new Date(b.lastUpdate || 0).getTime() -
            new Date(a.lastUpdate || 0).getTime()
        )
        .slice(0, 5);
    },
    criticalItems() {
      return (this.items || [])
        .filter((it) => {
          const qtd = it.currentStock ?? it.qtd;
          const min = it.minimumStock ?? it.min;
          return qtd != null && min != null && qtd <= min;
        })
        .slice(0, 8);
    },
  },
  async created() {
    this.auth = useAuthStore();
    this.supplierStore = useSupplier();
    this.storageStore = useStorage();
    this.sidebar = useSidebarStore();
    this.ordersStore = useOrders();
    await this.fetchAll();
  },
  methods: {
    formatCNPJ,
    formatDate,
    formatTelefone,
    async fetchAll() {
      this.loading = true;
      this.suppliersLoading = true;
      this.itemsLoading = true;
      try {
        const [suppliers, items, orders] = await Promise.all([
          this.supplierStore.list().catch(() => []),
          this.storageStore.list().catch(() => []),
          this.ordersStore.list().catch(() => []),
        ]);
        this.suppliers = suppliers;
        this.items = items;
        this.orders = orders;
        this.updateKpis();
        this.lastUpdated = Date.now();
      } finally {
        this.suppliersLoading = false;
        this.itemsLoading = false;
        this.loading = false;
      }
    },
    updateKpis() {
      const crit = this.criticalItems.length;
      const map = {
        items: this.items.length,
        crit,
        suppliers: this.suppliers.length - 1, // Exclui "Usuario de Migração"
        sections: this.auth?.user?.sections?.length || 0,
      };
      this.kpis = this.kpis.map((k) => ({
        ...k,
        value: map[k.key] ?? 0,
        loading: false,
      }));
    },
    openSidebar() {
      this.sidebar?.open({ mode: "create" });
    },
    handleOrderCreated(order) {
      // insere no topo e atualiza lastUpdated
      this.orders = [order, ...this.orders];
      this.lastUpdated = Date.now();
    },
    viewOrder(item) {
      // Placeholder até termos detalhes do pedido
      console.log("Ver pedido", item);
    },
  },
};
</script>

<style scoped>
.kpi-card {
  min-height: 110px;
  position: relative;
}

.kpi-value {
  font-size: 1.9rem;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.kpi-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}
</style>
