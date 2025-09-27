<template>
    <OrderSidebar
      :visible="sidebarVisible"
      :order="selectedOrder"
      :isEdit="isEditOrder"
      :items="items"
      :suppliers="suppliers"
      @close="closeSidebar"
      @save="saveOrder"
    />
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
            :items="orders"
            item-key="id"
            :loading="loading"
            class="min-w-[900px]"
          >
            <template v-slot:item.withdrawDay="{ item }">
              <span class="text-sm text-slate-700">{{ item.withdrawDay?.split('T')[0] }}</span>
            </template>
            <template v-slot:item.createdBy.name="{ item }">
              <span class="text-sm text-slate-700">{{ item.createdBy?.name }}</span>
            </template>
            <template v-slot:item.name="{ item }">
              <span class="text-sm text-slate-700">{{ item.supplier?.name || '-' }}</span>
            </template>
            <template v-slot:item.cnpj="{ item }">
              <span class="text-sm text-slate-700">{{ item.supplier?.cnpj || '-' }}</span>
            </template>
            <template v-slot:item.phoneNumber="{ item }">
              <span class="text-sm text-slate-700">{{ item.supplier?.phoneNumber || '-' }}</span>
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
                      @click="editOrder(item)"
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
                      @click="removeOrder(item)"
                    />
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-data-table>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
definePageMeta({ layout: "default", middleware: "auth" });
</script>

<script>
import { useAuthStore } from "~/stores/auth";
import { useSupplier } from "~/stores/supplier";
import { useItems } from "~/stores/items";
import { useStorage } from "~/stores/storage";
import { useOrders } from "~/stores/orders";
import { formatCNPJ, formatDate } from "~/utils";
import OrderSidebar from "~/components/sidebars/order.vue";

export default {
  data() {
    return {
      auth: null,
      supplierStore: null,
      itemsStore: null,
      storageStore: null,
      suppliersLoading: false,
      itemsLoading: false,
      suppliers: [],
      items: [],
      orders: [],
      ordersStore: null,
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
        { title: "ID", key: "id" },
        { title: "Status", key: "status" },
        { title: "Data de Retirada", key: "withdrawDay" },
        { title: "Criado por", key: "createdBy.name" },
        { title: "Ações", key: "actions", sortable: false, width: 100 },
      ],
      sidebarVisible: false,
      selectedOrder: null,
      isEditOrder: false,
    };
  },
  computed: {
    userRole() {
      return this.auth?.user?.role;
    },
    quickActions() {
      const actions = [];
      const sidebar = useSidebarStore?.();
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
    this.itemsStore = useItems();
    this.storageStore = useStorage();
    this.ordersStore = useOrders();
    await this.fetchAll();
  },
  methods: {
    formatCNPJ,
    formatDate,
    openSidebar() {
      this.selectedOrder = null;
      this.isEditOrder = false;
      this.sidebarVisible = true;
    },
    closeSidebar() {
      this.sidebarVisible = false;
      this.selectedOrder = null;
      this.isEditOrder = false;
    },
    editOrder(order) {
      this.selectedOrder = order;
      this.isEditOrder = true;
      this.sidebarVisible = true;
    },
    formatDateTime(dateStr) {
      if (dateStr && dateStr.length === 10) {
        return dateStr + "T00:00:00";
      }
      return dateStr;
    },
    async saveOrder(order) {
      const items = (Array.isArray(order.items) ? order.items : [order.items])
        .filter(Boolean)
        .map(i => typeof i === 'object' ? i.id : i);
      const itemQuantities = {};
      items.forEach(id => { itemQuantities[id] = 1; });
      const payload = {
        status: order.status,
        withdrawDay: this.formatDateTime(order.withdrawDay),
        itemQuantities,
      };
      console.log('Payload to backend:', payload);
      if (!Object.keys(itemQuantities).length) {
        alert('Selecione pelo menos um item para o pedido!');
        return;
      }
      if (this.isEditOrder) {
        await this.ordersStore.updateStatus(order.id, order.status ?? "PENDING");
      } else {
        await this.ordersStore.create(payload);
      }
      await this.fetchOrders();
      this.closeSidebar();
    },
    async removeOrder(order) {
      await this.ordersStore.remove(order.id);
      await this.fetchOrders();
    },
    async fetchAll() {
      this.suppliersLoading = true;
      this.itemsLoading = true;
      try {
        const [suppliers, items] = await Promise.all([
          this.supplierStore.list().catch(() => []),
          this.itemsStore.list().catch(() => []),
        ]);
        this.suppliers = suppliers;
        this.items = items
          .map(it => ({
            id: it.id ?? it.itemId ?? it._id,
            name: String(
              it.name ||
              it.nome ||
              it.nomeFantasia ||
              it.descricao ||
              (it.id ?? it.itemId ?? it._id)
            )
          }))
          .filter(it => it.id);
        await this.fetchOrders();
        this.updateKpis();
      } finally {
        this.suppliersLoading = false;
        this.itemsLoading = false;
      }
    },
    async fetchOrders() {
  this.orders = await this.ordersStore.list();
    },
    updateKpis() {
      const crit = this.criticalItems.length;
      const map = {
        items: this.items.length,
        crit,
        suppliers: this.suppliers.length - 1,
        sections: this.auth?.user?.sections?.length || 0,
      };
      this.kpis = this.kpis.map((k) => ({
        ...k,
        value: map[k.key] ?? 0,
        loading: false,
      }));
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
