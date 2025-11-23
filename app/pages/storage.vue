<template>
  <div class="max-w-6xl mx-auto p-6">
    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div>
        <div class="d-flex flex-row items-center gap-3">
          <v-chip v-if="userRole === 'ADMIN'" variant="elevated" color="purple">Stock Geral</v-chip>
          <v-chip v-else variant="elevated" color="primary">
            {{ userSectionTitle }}
          </v-chip>
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
          >
            Cadastrar
          </v-btn>
          <v-btn
            v-if="userRole === 'ADMIN' || userRole === 'MANAGER'"
            prepend-icon="mdi-history"
            density="comfortable"
            color="warning"
            class="flex-shrink-0 ml-2"
            height="38"
            @click="openHistoryDialog"
          >
            Histórico de Perdas
          </v-btn>
          <v-btn
            prepend-icon="mdi-arrow-right"
            density="comfortable"
            color="secondary"
            class="flex-shrink-0 ml-2"
            height="38"
            @click="goToTypeItems"
          >
            Tipos de Item
          </v-btn>
        </div>
      </div>
    </v-card>

    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div class="px-4 py-3 border-b border-slate-100">
        <div class="d-flex items-center gap-2 text-xs text-slate-500">
          <v-icon icon="mdi-warehouse" class="mr-1" />
          <span>Estoque</span>

          <div class="ml-auto flex items-center gap-2">
            <span class="hidden sm:inline text-slate-500">Última atualização:</span>
            <v-chip color="green" size="x-small" variant="tonal" class="font-medium">
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
            <v-menu v-model="reportMenuOpen" :close-on-content-click="false" offset-y>
              <template #activator="{ props }">
                <v-btn v-bind="props" size="x-small" variant="text" color="primary" class="ml-2">
                  <v-icon class="mr-2">mdi-file-download</v-icon>
                  Gerar Relatório
                </v-btn>
              </template>

              <v-card style="min-width: 240px">
                <v-card-text>
                  <div class="mb-3">
                    <label class="text-xs text-slate-500">Formato</label>
                    <v-select v-model="reportFormat" :items="['pdf', 'excel']" dense />
                  </div>

                  <div class="mb-3">
                    <label class="text-xs text-slate-500">Seção</label>
                    <v-select
                      v-model="reportSectionId"
                      :items="reportSections"
                      item-title="title"
                      item-value="id"
                      dense
                    />
                  </div>

                  <div class="d-flex justify-end gap-2">
                    <v-btn size="small" variant="text" @click="reportFormat = 'pdf'">PDF</v-btn>
                    <v-btn
                      size="small"
                      color="primary"
                      @click="
                        () => {
                          onGenerateReport();
                          reportMenuOpen = false;
                        }
                      "
                    >
                      Gerar
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-menu>
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
                      @click="editItem(item)"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip text="Lotes" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      size="small"
                      icon="mdi-view-list"
                      variant="text"
                      color="indigo"
                      @click="openLots(item)"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip
                  v-if="userRole === 'ADMIN' || userRole === 'MANAGER'"
                  text="Registrar Perda"
                  location="top"
                >
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      size="small"
                      icon="mdi-alert-circle"
                      variant="text"
                      color="error"
                      @click="registerLoss(item)"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip text="Previsão" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      size="small"
                      icon="mdi-chart-line"
                      variant="text"
                      color="success"
                      @click="openPredictionModal(item)"
                    />
                  </template>
                </v-tooltip>
              </div>
            </template>
            <template v-slot:item.expireDate="{ item }">
              <span class="text-sm text-slate-700">{{ formatDate(item.expireDate) }}</span>
            </template>

            <template v-slot:item.lastUpdate="{ item }">
              <span class="text-sm text-slate-700">{{ formatDate(item.lastUpdate) }}</span>
            </template>
          </v-data-table>
        </div>
      </div>
    </v-card>
    <StorageItemSidebar @updated="onItemUpdated" />
    <LossSidebar @loss-registered="onLossRegistered" />

    <!-- Modal de Previsão -->
    <v-dialog v-model="predictionDialog" max-width="700">
      <v-card>
        <v-toolbar flat density="comfortable" color="primary">
          <v-toolbar-title class="text-white">
            <v-icon class="mr-2">mdi-chart-line</v-icon>
            Previsão de Consumo e Estoque
          </v-toolbar-title>
          <v-spacer />
          <v-btn icon="mdi-close" color="white" @click="predictionDialog = false" />
        </v-toolbar>
        <v-card-text>
          <div v-if="predictionLoading" class="py-8 flex justify-center">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <div v-else-if="predictionError" class="text-red-500 py-4 text-center">
            {{ predictionError }}
          </div>
          <div v-else-if="predictionData && predictionData.length">
            <LinePrediction
              :labels="predictionLabels"
              :consumption="predictionConsumption"
              :stock="predictionStock"
            />
          </div>
          <div v-else class="text-slate-500 py-4 text-center">Nenhuma previsão encontrada.</div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog de Histórico de Perdas -->
    <v-dialog v-model="historyDialog" max-width="1200">
      <v-card>
        <v-toolbar flat density="comfortable" color="warning">
          <v-toolbar-title class="text-white">
            <v-icon class="mr-2">mdi-history</v-icon>
            Histórico de Perdas
          </v-toolbar-title>
          <v-spacer />
          <v-btn icon="mdi-close" color="white" @click="historyDialog = false" />
        </v-toolbar>

        <v-card-text class="pa-4">
          <!-- Campo de busca -->
          <v-text-field
            v-model="historySearch"
            clearable
            density="compact"
            variant="outlined"
            label="Pesquisar"
            placeholder="Buscar por item, usuário, motivo..."
            append-inner-icon="mdi-magnify"
            class="mb-4"
          />

          <!-- Tabela de histórico -->
          <v-data-table
            :headers="historyHeaders"
            :items="filteredHistoryData"
            :loading="historyLoading"
            item-key="id"
            class="elevation-1"
            :items-per-page="10"
          >
            <template v-slot:item.createDate="{ item }">
              <span class="text-sm">{{ formatDate(item.createDate) }}</span>
            </template>

            <template v-slot:item.lostQuantity="{ item }">
              <v-chip size="small" color="error" variant="tonal">
                {{ item.lostQuantity }}
              </v-chip>
            </template>

            <template v-slot:item.reason="{ item }">
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <span
                    v-bind="props"
                    class="text-sm text-slate-700"
                    style="
                      max-width: 300px;
                      display: block;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    "
                  >
                    {{ item.reason }}
                  </span>
                </template>
                <span>{{ item.reason }}</span>
              </v-tooltip>
            </template>

            <template v-slot:loading>
              <v-skeleton-loader type="table-row@5" />
            </template>

            <template v-slot:no-data>
              <div class="text-center py-8">
                <v-icon size="64" color="grey">mdi-history</v-icon>
                <p class="text-slate-500 mt-2">Nenhuma perda registrada</p>
              </div>
            </template>
          </v-data-table>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" color="primary" :loading="historyLoading" @click="loadHistoryData">
            <v-icon class="mr-2">mdi-refresh</v-icon>
            Atualizar
          </v-btn>
          <v-btn variant="text" @click="historyDialog = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' });
</script>

<script>
import { useAuthStore } from '~/stores/auth';
import { useStorage } from '~/stores/storage';
import { useReports } from '~/stores/reports';
import StorageItemSidebar from '~/components/sidebars/storage-item.vue';
import LossSidebar from '~/components/sidebars/loss.vue';
import { useSidebarStore } from '~/stores/sidebar';
import { useSection } from '~/stores/section';
import { useItemLoss } from '~/stores/itemLoss';

import { usePredictionsStore } from '~/stores/predictions';
import LinePrediction from '~/components/charts/LinePrediction.vue';

export default {
  name: 'Storage',
  layout: 'default',
  data() {
    return {
      data: [],
      auth: null,
      loading: false,
      search: '',
      headers: [
        { title: 'Nome', key: 'name' },
        { title: 'Tipo', key: 'itemTypeName' },
        { title: 'Estoque', key: 'currentStock' },
        { title: 'Unidade', key: 'measure' },
        { title: 'Validade', key: 'expireDate' },
        { title: 'Último usuário', key: 'lastUserName' },
        { title: 'Seção', key: 'sectionName' },
        { title: 'Stock Mínimo', key: 'minimumStock' },
        { title: 'Última atualização', key: 'lastUpdate' },
        { title: 'Ações', key: 'actions', sortable: false, width: 110 },
        // { title: "QR", key: "qrCode" },
      ],
      reportFormat: 'pdf',
      reportSectionId: null,
      generatingReport: false,
      reportMenuOpen: false,
      sidebar: null,
      historyDialog: false,
      historyData: [],
      historyLoading: false,
      historySearch: '',
      historyHeaders: [
        { title: 'Item', key: 'itemName', sortable: true },
        { title: 'Quantidade', key: 'lostQuantity', sortable: true, align: 'center' },
        { title: 'Motivo', key: 'reason', sortable: false },
        { title: 'Data/Hora', key: 'createDate', sortable: true },
        { title: 'Usuário', key: 'recordedByName', sortable: true },
      ],
      predictionDialog: false,
      predictionLoading: false,
      predictionError: null,
      predictionData: [],
      predictionLabels: [],
      predictionConsumption: [],
      predictionStock: [],
      predictionItem: null,
    };
  },
  created() {
    this.auth = useAuthStore();
    this.storage = useStorage();
    this.sidebar = useSidebarStore();
    this.reports = useReports();
    this.sectionStore = useSection();
    this.itemLossStore = useItemLoss();

    // Não instanciar o store aqui!
  },
  async mounted() {
    if (this.auth && typeof this.auth.initializeAuth === 'function') {
      try {
        await this.auth.initializeAuth();
      } catch (e) {
        console.warn('initializeAuth falhou:', e);
      }
    }
    await this.fetchData();
    // load all sections for report selection (admins should see all)
    try {
      await this.sectionStore.list();
    } catch (e) {
      // ignore errors (permissions) — we'll fall back to userSections
    }
  },
  computed: {
    filteredData() {
      const q = (this.search || '').toString().toLowerCase().trim();
      if (!q) return this.data;
      return this.data.filter((item) => {
        return [
          'name',
          'qrCode',
          'supplierName',
          'sectionName',
          'itemTypeName',
          'lastUserName',
          'itemId',
        ].some((key) => {
          const v = item?.[key];
          return v !== undefined && v !== null && v.toString().toLowerCase().includes(q);
        });
      });
    },
    filteredHistoryData() {
      const q = (this.historySearch || '').toString().toLowerCase().trim();
      if (!q) return this.historyData;
      return this.historyData.filter((item) => {
        return ['itemName', 'reason', 'recordedByName'].some((key) => {
          const v = item?.[key];
          return v !== undefined && v !== null && v.toString().toLowerCase().includes(q);
        });
      });
    },
    userName() {
      return this.auth?.user?.name || 'Usuário';
    },
    userEmail() {
      return this.auth?.user?.email || '—';
    },
    userSections() {
      return this.auth?.user?.sections || [];
    },
    userSectionTitle() {
      const sections = this.auth?.user?.sections || [];
      return sections.length > 0 ? sections[0].title : 'None';
    },
    userRole() {
      return this.auth?.user?.role || 'DEFAULT';
    },
    reportSections() {
      // prefer showing all sections (for admin) otherwise show user's sections
      const all =
        this.sectionStore && Array.isArray(this.sectionStore.sections)
          ? this.sectionStore.sections.map((s) => ({ title: s.title, id: s.id }))
          : [];
      const user = (this.userSections || []).map((s) => ({ title: s.title, id: s.id }));
      const combined = all.length ? all : user;
      // add an option for "Todas"
      return [{ title: 'Todas', id: null }, ...combined];
    },
  },
  methods: {
    async openPredictionModal(item) {
      this.predictionDialog = true;
      this.predictionLoading = true;
      this.predictionError = null;
      this.predictionData = [];
      this.predictionLabels = [];
      this.predictionConsumption = [];
      this.predictionStock = [];
      this.predictionItem = item;
      try {
        // Instanciar o store localmente, dentro do método
        const predictionsStore = usePredictionsStore();
        const res = await predictionsStore.getByItem(item.itemId || item.id);
        // Garantir array e campos corretos
        const arr = Array.isArray(res) ? res : [res];
        this.predictionData = arr;
        this.predictionLabels = arr.map(
          (p) =>
            `${String(p.prediction_month || p.predictionMonth).padStart(2, '0')}/${p.prediction_year || p.predictionYear}`,
        );
        this.predictionConsumption = arr.map(
          (p) => p.predicted_consumption ?? p.predictedConsumption ?? 0,
        );
        this.predictionStock = arr.map((p) => p.predicted_stock ?? p.predictedStock ?? 0);
      } catch (e) {
        this.predictionError = 'Erro ao buscar previsão.';
      } finally {
        this.predictionLoading = false;
      }
    },
    onItemUpdated() {
      this.fetchData();
    },
    onLossRegistered() {
      this.fetchData();
    },
    async fetchData() {
      this.loading = true;
      try {
        if (this.userRole === 'ADMIN') {
          this.data = await this.storage.list();
        } else {
          const sectionId = this.userSections.length ? this.userSections[0].id : null;
          this.data = await this.storage.list(sectionId ? { sectionId } : {});
        }
        this.loading = false;
      } catch (e) {
        console.error('Error fetching data:', e);
      }
    },
    async openHistoryDialog() {
      this.historyDialog = true;
      await this.loadHistoryData();
    },
    async loadHistoryData() {
      this.historyLoading = true;
      try {
        const losses = await this.itemLossStore.getAllLosses();
        this.historyData = losses || [];
      } catch (e) {
        console.error('Error fetching loss history:', e);
        this.historyData = [];
      } finally {
        this.historyLoading = false;
      }
    },
    async onGenerateReport() {
      // determine sectionId: if not selected and user is not ADMIN, use user's first section
      let sectionId = this.reportSectionId;
      if (!sectionId && this.userRole !== 'ADMIN') {
        sectionId = this.userSections.length ? this.userSections[0].id : null;
      }
      this.generatingReport = true;
      try {
        await this.generateReport(this.reportFormat, sectionId);
      } catch (e) {
        console.error('Erro ao gerar relatório', e);
        // optionally show notification
      } finally {
        this.generatingReport = false;
      }
    },

    async generateReport(format, sectionId) {
      const f = (format || 'pdf').toLowerCase();
      // use reports store to fetch the blob
      const blob = await this.reports.generateStockReport(f, sectionId);
      const ext = f === 'excel' ? 'xlsx' : 'pdf';
      const secPart = sectionId ? `-${sectionId}` : '-all';
      const filename = `stock-report${secPart}.${ext}`;
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    },
    formatDate(value) {
      if (!value) return '—';
      try {
        const d = new Date(value);
        return d.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return value;
      }
    },
    openSidebar() {
      this.sidebar?.open({ mode: 'edit-item' });
    },
    editItem(item) {
      const raw = item?.raw ?? item;
      const id = raw?.itemId ?? raw?.id;
      if (!id) return;
      this.sidebar?.open({ mode: 'edit-item', itemId: id });
    },
    openLots(item) {
      const raw = item?.raw ?? item;
      const id = raw?.itemId ?? raw?.id;
      if (!id) return;
      this.$router.push({ path: `/items/${id}`, query: { tab: 'lotes' } });
    },
    registerLoss(item) {
      const raw = item?.raw ?? item;
      if (!raw) return;
      this.sidebar?.open({ mode: 'loss', item: raw });
    },
    goToTypeItems() {
      this.$router.push({ path: '/typeitems' });
    },
  },
};
</script>
