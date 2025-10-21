<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- Filtros -->
    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div class="d-flex flex-row items-center gap-2 mt-2">
        <v-select
          v-model="selectedDays"
          :items="daysOptions"
          density="compact"
          variant="outlined"
          label="Próximos dias"
          class="flex-shrink-0"
          style="max-width: 200px"
          @update:model-value="fetchData"
        />
        <v-btn
          prepend-icon="mdi-refresh"
          density="comfortable"
          color="primary"
          class="flex-shrink-0 ml-2"
          height="38"
          :loading="loading"
          @click="fetchData"
        >
          Atualizar
        </v-btn>
      </div>
    </v-card>

    <!-- Cards de Resumo (KPIs) -->
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
        <div class="kpi-value" :style="{ color: k.color }">
          {{ k.loading ? '…' : k.value }}
        </div>
      </v-card>
    </div>

    <!-- Tabela com Abas -->
    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div class="px-4 py-3 border-b border-slate-100">
        <div class="d-flex items-center gap-2 text-xs text-slate-500">
          <v-icon icon="mdi-calendar-alert" class="mr-1" />
          <span>Gerenciamento de Validades</span>

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
              @click="fetchData"
            >
              Atualizar
            </v-btn>
          </div>
        </div>
      </div>

      <div class="p-4">
        <!-- Abas -->
        <div class="mb-3">
          <v-chip-group v-model="activeTab" mandatory class="flex-wrap" selected-class="text-white">
            <v-chip value="expired" size="small" color="red" variant="tonal">
              Vencidos ({{ expiredItems.length }})
            </v-chip>
            <v-chip value="expiring" size="small" color="orange" variant="tonal">
              A Vencer ({{ expiringSoonItems.length }})
            </v-chip>
          </v-chip-group>
        </div>

        <!-- Tabela -->
        <div class="overflow-auto">
          <v-data-table
            :headers="headers"
            :items="currentItems"
            item-key="itemId"
            :loading="loading"
            class="min-w-[900px]"
          >
            <template v-slot:item.itemCode="{ item }">
              <span class="text-sm text-slate-700">{{ item.itemCode || '—' }}</span>
            </template>

            <template v-slot:item.currentStock="{ item }">
              <span class="text-sm text-slate-700">{{ formatNumber(item.currentStock) }}</span>
            </template>

            <template v-slot:item.measure="{ item }">
              <span class="text-sm text-slate-700">{{ item.measure || '—' }}</span>
            </template>

            <template v-slot:item.expireDate="{ item }">
              <span class="text-sm text-slate-700">{{ formatDate(item.expireDate) }}</span>
            </template>

            <template v-slot:item.daysUntilExpiry="{ item }">
              <v-chip
                :color="getDaysColor(item.daysUntilExpiry)"
                size="small"
                label
                class="font-medium"
              >
                {{ formatDaysUntilExpiry(item.daysUntilExpiry) }}
              </v-chip>
            </template>

            <template v-slot:item.qrCode="{ item }">
              <span class="text-sm text-slate-700">{{ item.qrCode || '—' }}</span>
            </template>

            <template v-slot:item.lastUpdate="{ item }">
              <span class="text-sm text-slate-700">{{ formatDate(item.lastUpdate) }}</span>
            </template>

            <template v-slot:item.actions="{ item }">
              <div class="d-flex flex-row gap-1">
                <v-tooltip v-if="canDelete" text="Excluir" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      size="small"
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      @click="confirmDelete(item)"
                    />
                  </template>
                </v-tooltip>
                <span v-else class="text-sm text-slate-400">—</span>
              </div>
            </template>
          </v-data-table>
        </div>
      </div>
    </v-card>

    <!-- Dialog de Confirmação de Exclusão -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 bg-red-lighten-5">
          <v-icon icon="mdi-alert" color="error" class="mr-2" />
          Confirmar Exclusão
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="text-body-1 mb-2">Tem certeza que deseja excluir este item?</p>
          <div v-if="itemToDelete" class="mt-4 pa-3 bg-grey-lighten-4 rounded">
            <p class="mb-1">
              <strong>Nome:</strong>
              {{ itemToDelete.name }}
            </p>
            <p class="mb-1">
              <strong>Código:</strong>
              {{ itemToDelete.itemCode || '—' }}
            </p>
            <p class="mb-1">
              <strong>Estoque:</strong>
              {{ formatNumber(itemToDelete.currentStock) }}
            </p>
            <p class="mb-0">
              <strong>Validade:</strong>
              {{ formatDate(itemToDelete.expireDate) }}
            </p>
          </div>
          <v-alert type="warning" variant="tonal" class="mt-4" density="compact">
            Esta ação não pode ser desfeita!
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="deleteDialog = false" :disabled="deleting">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="elevated" @click="deleteItem" :loading="deleting">
            Excluir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar para mensagens -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top"
      vertical
    >
      <div class="d-flex align-center">
        <v-icon :icon="snackbar.icon" class="mr-2" />
        <span>{{ snackbar.message }}</span>
      </div>
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Fechar</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default', middleware: 'auth' });
</script>

<script>
import { usePharmacy } from '~/stores/pharmacy';
import { useAuthStore } from '~/stores/auth';
import { formatDate } from '~/utils';

export default {
  data() {
    return {
      pharmacyStore: null,
      auth: null,
      loading: false,
      lastUpdated: Date.now(),
      selectedDays: 30,
      activeTab: 'expired',
      deleteDialog: false,
      itemToDelete: null,
      deleting: false,
      snackbar: {
        show: false,
        message: '',
        color: 'success',
        icon: 'mdi-check-circle',
        timeout: 3000,
      },
      daysOptions: [
        { title: '7 dias', value: 7 },
        { title: '15 dias', value: 15 },
        { title: '30 dias', value: 30 },
        { title: '60 dias', value: 60 },
        { title: '90 dias', value: 90 },
      ],
      headers: [
        { title: 'Código', key: 'itemCode', sortable: true },
        { title: 'Nome', key: 'name', sortable: true },
        { title: 'Tipo', key: 'itemTypeName', sortable: true },
        { title: 'Estoque', key: 'currentStock', sortable: true },
        { title: 'Unidade', key: 'measure', sortable: true },
        { title: 'Data de Validade', key: 'expireDate', sortable: true },
        { title: 'Dias até Vencer', key: 'daysUntilExpiry', sortable: true },
        { title: 'QR Code', key: 'qrCode', sortable: true },
        { title: 'Seção', key: 'sectionName', sortable: true },
        { title: 'Último Usuário', key: 'lastUserName', sortable: true },
        { title: 'Última Atualização', key: 'lastUpdate', sortable: true },
        { title: 'Ações', key: 'actions', sortable: false, width: 100 },
      ],
      kpis: [
        {
          key: 'expired',
          label: 'Itens Vencidos',
          icon: 'mdi-alert-circle',
          value: 0,
          loading: true,
          color: '#dc3545',
        },
        {
          key: 'expiring',
          label: 'A Vencer',
          icon: 'mdi-clock-alert-outline',
          value: 0,
          loading: true,
          color: '#ff9800',
        },
        {
          key: 'critical',
          label: 'Itens Críticos',
          icon: 'mdi-alert-octagon',
          value: 0,
          loading: true,
          color: '#f44336',
        },
        {
          key: 'totalValue',
          label: 'Valor Total',
          icon: 'mdi-currency-usd',
          value: '—',
          loading: true,
          color: '#4caf50',
        },
      ],
    };
  },
  computed: {
    expiredItems() {
      return this.enrichItemsWithDays(this.pharmacyStore?.expiredItems || []);
    },
    expiringSoonItems() {
      return this.enrichItemsWithDays(this.pharmacyStore?.expiringSoonItems || []);
    },
    currentItems() {
      return this.activeTab === 'expired' ? this.expiredItems : this.expiringSoonItems;
    },
    userRole() {
      return this.auth?.user?.role || 'DEFAULT';
    },
    canDelete() {
      return ['ADMIN', 'MANAGER'].includes(this.userRole);
    },
  },
  created() {
    this.pharmacyStore = usePharmacy();
    this.auth = useAuthStore();
  },
  async mounted() {
    if (this.auth && typeof this.auth.initializeAuth === 'function') {
      try {
        await this.auth.initializeAuth();
      } catch (e) {
        console.warn('initializeAuth failed:', e);
      }
    }
    await this.fetchData();
  },
  methods: {
    formatDate,
    enrichItemsWithDays(items) {
      const now = new Date();
      return items.map((item) => {
        const expireDate = new Date(item.expireDate);
        const diffTime = expireDate - now;
        const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...item, daysUntilExpiry };
      });
    },
    async fetchData() {
      this.loading = true;
      try {
        await this.pharmacyStore.fetchExpiryData(this.selectedDays);
        this.updateKpis();
        this.lastUpdated = Date.now();
      } catch (e) {
        console.error('Error fetching expiry data:', e);
      } finally {
        this.loading = false;
      }
    },
    updateKpis() {
      const summary = this.pharmacyStore?.summary || {};
      const expired = this.expiredItems.length;
      const expiring = this.expiringSoonItems.length;

      this.kpis = this.kpis.map((k) => {
        let value = 0;
        if (k.key === 'expired') value = summary.expiredCount ?? expired;
        else if (k.key === 'expiring') value = summary.expiringSoonCount ?? expiring;
        else if (k.key === 'critical') {
          // Itens críticos são aqueles que vencem em 7 dias ou menos
          const critical = this.expiringSoonItems.filter(
            (item) => item.daysUntilExpiry <= 7,
          ).length;
          value = summary.criticalItems ?? critical;
        } else if (k.key === 'totalValue') {
          value = summary.totalValue
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                summary.totalValue,
              )
            : '—';
        }

        return { ...k, value, loading: false };
      });
    },
    confirmDelete(item) {
      if (!this.canDelete) {
        this.showSnackbar('Você não tem permissão para excluir itens.', 'error');
        return;
      }
      this.itemToDelete = item;
      this.deleteDialog = true;
    },
    async deleteItem() {
      if (!this.itemToDelete) return;

      this.deleting = true;
      try {
        await this.pharmacyStore.deleteItem(this.itemToDelete.itemId);
        this.deleteDialog = false;
        this.itemToDelete = null;
        this.updateKpis();
        this.showSnackbar('Item excluído com sucesso!', 'success');
      } catch (e) {
        console.error('Error deleting item:', e);
        this.showSnackbar('Erro ao excluir item. Verifique suas permissões.', 'error');
      } finally {
        this.deleting = false;
      }
    },
    showSnackbar(message, type = 'success') {
      const config = {
        success: { color: 'success', icon: 'mdi-check-circle' },
        error: { color: 'error', icon: 'mdi-alert-circle' },
        warning: { color: 'warning', icon: 'mdi-alert' },
        info: { color: 'info', icon: 'mdi-information' },
      };

      this.snackbar = {
        show: true,
        message,
        ...config[type],
        timeout: 3000,
      };
    },
    formatDaysUntilExpiry(days) {
      if (days < 0) {
        return `Vencido há ${Math.abs(days)} dias`;
      }
      return `${days} dias`;
    },
    getDaysColor(days) {
      if (days < 0) return 'red';
      if (days <= 7) return 'orange';
      if (days <= 15) return 'yellow';
      return 'blue';
    },
    formatNumber(value) {
      if (value == null) return '—';
      return value.toLocaleString('pt-BR');
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
