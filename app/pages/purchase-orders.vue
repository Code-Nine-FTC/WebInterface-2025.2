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
          placeholder="Buscar por Nº NE, fornecedor, valor, status..."
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
        >
          Cadastrar Ordem de Compra
        </v-btn>
      </div>
    </v-card>

    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div class="px-4 py-3 border-b border-slate-100">
        <div class="d-flex items-center gap-2 text-xs text-slate-500">
          <v-icon icon="mdi-receipt-text-outline" class="mr-1" />
          <span>Ordens de Compra</span>
          <div class="ml-auto flex items-center gap-2">
            <span class="hidden sm:inline text-slate-500">Última atualização:</span>
            <v-chip color="green" size="x-small" variant="tonal" class="font-medium">
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
        <div class="overflow-auto">
          <v-data-table
            :headers="headers"
            :items="filteredData"
            item-key="id"
            :loading="loading"
            class="min-w-[900px]"
          >
            <template v-slot:item.status="{ item }">
              <v-chip :color="statusColor(item.status)" size="small" label class="text-white font-medium">
                {{ statusLabel(item.status) }}
              </v-chip>
            </template>
            <template v-slot:item.emailStatus="{ item }">
              <v-chip :color="emailColor(item.emailStatus)" size="small" label class="text-white font-medium">
                {{ emailLabel(item.emailStatus) }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <div class="d-flex flex-row gap-1">
                <v-tooltip text="Ver/Editar" location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" size="small" icon="mdi-eye" variant="text" color="primary" @click="viewOrder(item)" />
                  </template>
                </v-tooltip>
                <v-tooltip text="Enviar E-mail" location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" size="small" icon="mdi-email" variant="text" color="primary" @click.stop.prevent="sendEmail(item)" />
                  </template>
                </v-tooltip>
                <v-tooltip text="Marcar como Entregue" location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" size="small" icon="mdi-truck-check" variant="text" color="green" @click="markDelivered(item)" :disabled="item.status === 'DELIVERY'" />
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-data-table>
        </div>
      </div>
    </v-card>
    <PurchaseOrderSidebar v-if="sidebar.isOpen" @created="handleOrderCreated" @updated="handleOrderUpdated" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default', middleware: 'auth' });
</script>

<script>
import { useSidebarStore } from '~/stores/sidebar';
import { usePurchaseOrder } from '~/stores/purchaseOrder';
import { defineAsyncComponent } from 'vue';
import { formatDate } from '~/utils';

export default {
  data() {
    return {
      sidebar: null,
      purchaseOrderStore: null,
      search: '',
      loading: false,
      lastUpdated: Date.now(),
      orders: [],
      headers: [
        { title: 'Nº NE', key: 'commitmentNoteNumber', width: 120 },
        { title: 'Órgão Emissor', key: 'issuingBody' },
        { title: 'Ano', key: 'year', width: 80 },
        { title: 'Processo', key: 'processNumber', width: 120 },
        { title: 'Fornecedor', key: 'supplierCompanyName' },
        { title: 'Valor', key: 'totalValue', width: 120 },
        { title: 'Data de Emissão', key: 'issueDate', width: 140 },
        { title: 'Status Entrega', key: 'status', width: 120 },
        { title: 'Status E-mail', key: 'emailStatus', width: 120 },
        { title: 'Ações', key: 'actions', sortable: false, width: 140 },
      ],
    };
  },
  computed: {
    filteredData() {
      const q = (this.search || '').toLowerCase().trim();
      const data = (this.orders || []).map((o) => ({
        ...o,
        supplierCompanyName: o.supplierCompanyName || o.supplierName || '',
        totalValue: o.totalValue || 0,
        // show only the date in a readable format (pt-BR) instead of full datetime
        issueDate: (function(v) {
          if (!v) return '';
          try {
            const dt = new Date(v);
            if (isNaN(dt.getTime())) return String(v);
            return dt.toLocaleDateString('pt-BR');
          } catch (e) { return String(v); }
        })(o.issueDate),
        status: o.status || '',
        emailStatus: o.emailStatus || '',
      }));
      if (!q) return data;
      return data.filter((o) => [
        o.commitmentNoteNumber,
        o.issuingBody,
        o.year,
        o.processNumber,
        o.supplierCompanyName,
        o.totalValue,
        o.issueDate,
        o.status,
        o.emailStatus
      ].some((v) => String(v).toLowerCase().includes(q)));
    },
  },
  async created() {
    this.sidebar = useSidebarStore();
    this.purchaseOrderStore = usePurchaseOrder();
    await this.fetchAll();
  },
  methods: {
    formatDate,
    statusLabel(s) {
      const map = {
        PENDING_DELIVERY: 'Pendente',
        DELIVERY: 'Entregue',
        LATE: 'Atrasado',
        CANCELLED: 'Cancelado',
      };
      return map[s] || s || '—';
    },
    statusColor(s) {
      if (s === 'DELIVERY') return 'green';
      if (s === 'LATE') return 'red';
      if (s === 'CANCELLED') return 'grey';
      return 'blue';
    },
    emailLabel(s) {
      const map = {
        NOT_SENT: 'Não enviado',
        SENT: 'Enviado',
        REMINDER_SENT: 'Lembrete enviado',
      };
      return map[s] || s || '—';
    },
    emailColor(s) {
      if (s === 'SENT') return 'green';
      if (s === 'REMINDER_SENT') return 'orange';
      return 'blue';
    },
    async fetchAll() {
      this.loading = true;
      try {
        const orders = await this.purchaseOrderStore.list();
        this.orders = orders;
        this.lastUpdated = Date.now();
      } finally {
        this.loading = false;
      }
    },
    openSidebar() {
      this.sidebar.open({ mode: 'create' });
    },
    async handleOrderCreated() {
      await this.fetchAll();
    },
    handleOrderUpdated(p) {
      if (!p?.id) return;
      this.orders = (this.orders || []).map((o) => (o.id === p.id ? { ...o, ...p } : o));
      this.lastUpdated = Date.now();
    },
    viewOrder(item) {
      const id = item?.id ?? item;
      this.sidebar.open({ mode: 'edit', orderId: id });
    },
    async sendEmail(item) {
      if (!item?.id) return;
      await this.purchaseOrderStore.sendEmail(item.id);
      await this.fetchAll();
    },
    async markDelivered(item) {
      if (!item?.id) return;
      // backend status enum uses DELIVERY for delivered state
      await this.purchaseOrderStore.updateStatus(item.id, 'DELIVERY');
      await this.fetchAll();
    },
  },
  components: {
    PurchaseOrderSidebar: defineAsyncComponent(() => import('~/components/sidebars/purchaseOrder.vue')),
  },
};
</script>
