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
              @click="fetchAll"
            >
              Atualizar
            </v-btn>
          </div>
        </div>
      </div>

      <div class="p-4">
        <!-- Filtros por status -->
        <div class="mb-3">
          <v-chip-group v-model="activeStatus" mandatory class="flex-wrap" selected-class="text-white">
            <v-chip value="ALL" size="small" variant="tonal">Todos</v-chip>
            <v-chip value="PENDING" size="small" color="blue" variant="tonal">Pendente</v-chip>
            <v-chip value="APPROVED" size="small" color="green" variant="tonal">Aprovado</v-chip>
            <v-chip value="PROCESSING" size="small" color="indigo" variant="tonal">Processando</v-chip>
            <v-chip value="COMPLETED" size="small" color="purple" variant="tonal">Concluído</v-chip>
            <v-chip value="CANCELLED" size="small" color="red" variant="tonal">Cancelado</v-chip>
          </v-chip-group>
        </div>
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

            <template v-slot:item.withdrawDay="{ item }">
              <span class="text-sm text-slate-700">
                {{ normalizeStatusKey(item.status) === 'COMPLETED' ? formatDate(item.withdrawDay) : '—' }}
              </span>
            </template>

            <template v-slot:item.status="{ item }">
              <v-chip :color="statusColor(item.status)" size="small" label class="text-white font-medium">
                {{ statusLabel(item.status) }}
              </v-chip>
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
  <OrdersFormSidebar @created="handleOrderCreated" @updated="handleOrderUpdated" />
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
import { formatDate } from "~/utils";

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
    activeStatus: 'ALL',
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
        { title: "Código", key: "id", width: 100 },
        { title: "Retirada", key: "withdrawDay" },
        { title: "Status", key: "status", width: 120 },
        { title: "Última atualização", key: "lastUpdate" },
        { title: "Ações", key: "actions", sortable: false, width: 100 },
      ]
    };
  },
  computed: {
    filteredData() {
      const q = (this.search || "").toLowerCase().trim();
      const data = (this.orders || []).map((o) => {
        const itemsCount =
          // valores numéricos diretos
          (typeof o.itemsCount === 'number' ? o.itemsCount :
          typeof o.items_count === 'number' ? o.items_count :
          typeof o.itensCount === 'number' ? o.itensCount : null)
          ??
          // arrays comuns
          (Array.isArray(o.items) ? o.items.length :
          Array.isArray(o.itens) ? o.itens.length :
          Array.isArray(o.itemIds) ? o.itemIds.length : null)
          ??
          // objeto de quantidades (conta itens distintos)
          (o.itemQuantities && typeof o.itemQuantities === 'object' ? Object.keys(o.itemQuantities).length : 0);
        const statusKey = this.normalizeStatusKey(o.status);
        return {
          ...o,
          itemsCount,
          status: o.status || "pendente",
          statusKey,
          lastUpdate: o.updatedAt || o.createdAt || o.lastUpdate,
        };
      });
      const byStatus = this.activeStatus === 'ALL' ? data : data.filter((o) => o.statusKey === this.activeStatus);
      if (!q) return byStatus;
      return byStatus.filter((o) => [
          String(o.id),
          o.status,
          this.statusLabel(o.status),
          o.withdrawDay && new Date(o.withdrawDay).toLocaleDateString("pt-BR")
        ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)));
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
    formatDate,
    normalizeStatusKey(s) {
      const x = String(s || '').toUpperCase();
      if (["PENDENTE"].includes(x)) return 'PENDING';
      if (["APROVADO", "APPROVED"].includes(x)) return 'APPROVED';
      if (["PROCESSANDO", "PROCESSING"].includes(x)) return 'PROCESSING';
      if (["CONCLUIDO", "CONCLUÍDO", "COMPLETED"].includes(x)) return 'COMPLETED';
      if (["CANCELADO", "CANCELLED"].includes(x)) return 'CANCELLED';
      if (["PENDING"].includes(x)) return 'PENDING';
      return 'PENDING';
    },
    statusLabel(s) {
      const key = this.normalizeStatusKey(s);
      const map = { PENDING: "Pendente", APPROVED: "Aprovado", PROCESSING: "Processando", COMPLETED: "Concluído", CANCELLED: "Cancelado" };
      return map[key] || s || "—";
    },
    statusColor(s) {
      const key = this.normalizeStatusKey(s);
      if (key === 'APPROVED' || key === 'COMPLETED') return 'green';
      if (key === 'CANCELLED') return 'red';
      if (key === 'PROCESSING') return 'indigo';
      return 'blue';
    },
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
    async handleOrderCreated() {
      // Após criar, recarrega a listagem do backend (mobile-equivalente)
      await this.fetchAll();
    },
    handleOrderUpdated(p) {
      if (!p?.id) return;
      this.orders = (this.orders || []).map((o) => o.id === p.id ? { ...o, ...p } : o);
      this.lastUpdated = Date.now();
    },
    viewOrder(item) {
      const id = item?.id ?? item
      this.sidebar?.open({ mode: "view", orderId: id });
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
