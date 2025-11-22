<template>
  <div class="max-w-7xl mx-auto p-6">
    <!-- Header -->
    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <div class="d-flex flex-column flex-md-row gap-3 align-center">
        <v-icon icon="mdi-brain" size="large" color="primary" class="mr-2" />
        <div class="flex-1">
          <h1 class="text-h5 font-weight-bold">Previsões de Consumo - IA</h1>
          <p class="text-caption text-slate-600 mt-1">
            Sistema de Inteligência Artificial para prever consumo futuro de itens do estoque
          </p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <v-btn
            prepend-icon="mdi-refresh"
            color="primary"
            variant="tonal"
            :loading="loading"
            @click="generateAllPredictions"
          >
            Gerar Todas
          </v-btn>
          <v-btn
            prepend-icon="mdi-calendar-month"
            color="secondary"
            variant="outlined"
            @click="showMonthDialog = true"
          >
            Por Mês
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- Filters -->
    <v-card class="bg-white rounded-lg shadow-md pa-4 mb-6">
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="search"
            clearable
            density="compact"
            variant="outlined"
            label="Pesquisar item"
            placeholder="Digite o nome do item..."
            prepend-inner-icon="mdi-magnify"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filterMonth"
            :items="monthOptions"
            density="compact"
            variant="outlined"
            label="Filtrar por mês"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="confidenceFilter"
            :items="confidenceOptions"
            density="compact"
            variant="outlined"
            label="Confiança mínima"
            clearable
            hide-details
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- Stats Cards -->
    <v-row dense class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 bg-blue-50">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-blue-800">Total de Previsões</div>
              <div class="text-h5 font-weight-bold text-blue-900">
                {{ filteredPredictions.length }}
              </div>
            </div>
            <v-icon icon="mdi-chart-line" size="x-large" color="blue" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 bg-green-50">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-green-800">Alta Confiança</div>
              <div class="text-h5 font-weight-bold text-green-900">{{ highConfidenceCount }}</div>
            </div>
            <v-icon icon="mdi-check-circle" size="x-large" color="green" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 bg-orange-50">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-orange-800">Média Confiança</div>
              <div class="text-h5 font-weight-bold text-orange-900">
                {{ mediumConfidenceCount }}
              </div>
            </div>
            <v-icon icon="mdi-alert-circle" size="x-large" color="orange" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 bg-purple-50">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-purple-800">Confiança Média</div>
              <div class="text-h5 font-weight-bold text-purple-900">{{ averageConfidence }}%</div>
            </div>
            <v-icon icon="mdi-percent" size="x-large" color="purple" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Predictions Table -->
    <v-card class="bg-white rounded-lg shadow-md">
      <div class="px-4 py-3 border-b border-slate-100">
        <div class="d-flex items-center gap-2 text-xs text-slate-500">
          <v-icon icon="mdi-table" size="small" class="mr-1" />
          <span>Previsões Geradas</span>
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
              @click="refreshCurrentView"
            >
              Atualizar
            </v-btn>
          </div>
        </div>
      </div>

      <v-alert v-if="error" type="error" variant="tonal" class="ma-4">
        {{ error }}
      </v-alert>

      <div class="p-4">
        <v-data-table
          :headers="headers"
          :items="filteredPredictions"
          :loading="loading"
          item-key="id"
          class="elevation-0"
        >
          <template v-slot:item.itemName="{ item }">
            <div class="font-weight-medium">{{ item.itemName }}</div>
            <div class="text-caption text-slate-500">ID: {{ item.itemId }}</div>
          </template>

          <template v-slot:item.predictionMonth="{ item }">
            <v-chip size="small" color="primary" variant="tonal">
              {{ formatMonth(item.predictionMonth) }}
            </v-chip>
          </template>

          <template v-slot:item.predictedQuantity="{ item }">
            <div class="font-weight-bold text-primary">
              {{ formatQuantity(item.predictedQuantity) }}
            </div>
          </template>

          <template v-slot:item.confidenceScore="{ item }">
            <div class="d-flex align-center gap-2">
              <v-progress-linear
                :model-value="item.confidenceScore * 100"
                :color="getConfidenceColor(item.confidenceScore)"
                height="8"
                rounded
                class="flex-1"
              />
              <span
                class="text-caption font-weight-medium"
                :class="`text-${getConfidenceColor(item.confidenceScore)}`"
              >
                {{ (item.confidenceScore * 100).toFixed(1) }}%
              </span>
            </div>
          </template>

          <template v-slot:item.modelVersion="{ item }">
            <v-chip size="x-small" variant="outlined">
              {{ item.modelVersion }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="d-flex gap-1">
              <v-tooltip text="Ver Histórico" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="small"
                    icon="mdi-history"
                    variant="text"
                    color="primary"
                    @click="viewHistory(item)"
                  />
                </template>
              </v-tooltip>
              <v-tooltip text="Regerar Previsão" location="top">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    size="small"
                    icon="mdi-refresh"
                    variant="text"
                    color="secondary"
                    @click="regeneratePrediction(item)"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <!-- Month Selection Dialog -->
    <v-dialog v-model="showMonthDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center gap-2">
          <v-icon icon="mdi-calendar-month" />
          Previsões por Mês
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="selectedMonth"
            type="month"
            label="Selecione o mês"
            variant="outlined"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showMonthDialog = false">Cancelar</v-btn>
          <v-btn color="primary" @click="loadByMonth">Buscar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- History Dialog -->
    <v-dialog v-model="showHistoryDialog" max-width="800">
      <v-card>
        <v-card-title class="d-flex align-center gap-2">
          <v-icon icon="mdi-history" />
          Histórico de Previsões - {{ selectedItem?.itemName }}
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="historyHeaders"
            :items="historyData"
            :loading="loadingHistory"
            item-key="id"
            density="compact"
          >
            <template v-slot:item.predictionMonth="{ item }">
              {{ formatMonth(item.predictionMonth) }}
            </template>
            <template v-slot:item.predictedQuantity="{ item }">
              <span class="font-weight-bold">{{ formatQuantity(item.predictedQuantity) }}</span>
            </template>
            <template v-slot:item.confidenceScore="{ item }">
              <v-chip :color="getConfidenceColor(item.confidenceScore)" size="small">
                {{ (item.confidenceScore * 100).toFixed(1) }}%
              </v-chip>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showHistoryDialog = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default', middleware: 'auth' });
</script>

<script>
import { usePredictionsStore } from '~/stores/predictions';
import { formatDate } from '~/utils';

export default {
  data() {
    return {
      predictionsStore: null,
      search: '',
      filterMonth: null,
      confidenceFilter: null,
      loading: false,
      error: null,
      lastUpdated: Date.now(),
      predictions: [],
      showMonthDialog: false,
      showHistoryDialog: false,
      selectedMonth: this.getNextMonth(),
      selectedItem: null,
      historyData: [],
      loadingHistory: false,
      headers: [
        { title: 'Item', key: 'itemName', width: 250 },
        { title: 'Mês', key: 'predictionMonth', width: 130 },
        { title: 'Qtd. Prevista', key: 'predictedQuantity', width: 140 },
        { title: 'Confiança', key: 'confidenceScore', width: 200 },
        { title: 'Modelo', key: 'modelVersion', width: 150 },
        { title: 'Ações', key: 'actions', sortable: false, width: 120 },
      ],
      historyHeaders: [
        { title: 'Mês', key: 'predictionMonth' },
        { title: 'Qtd. Prevista', key: 'predictedQuantity' },
        { title: 'Confiança', key: 'confidenceScore' },
        { title: 'Modelo', key: 'modelVersion' },
        { title: 'Criado em', key: 'createdAt' },
      ],
      confidenceOptions: [
        { value: 0.9, title: 'Alta (>90%)' },
        { value: 0.8, title: 'Boa (>80%)' },
        { value: 0.7, title: 'Média (>70%)' },
      ],
    };
  },
  computed: {
    filteredPredictions() {
      let data = this.predictions || [];

      // Filter by search
      if (this.search) {
        const q = this.search.toLowerCase().trim();
        data = data.filter(
          (p) => p.itemName?.toLowerCase().includes(q) || String(p.itemId).includes(q),
        );
      }

      // Filter by month
      if (this.filterMonth) {
        data = data.filter((p) => p.predictionMonth?.startsWith(this.filterMonth));
      }

      // Filter by confidence
      if (this.confidenceFilter) {
        data = data.filter((p) => p.confidenceScore >= this.confidenceFilter);
      }

      return data;
    },
    highConfidenceCount() {
      return this.filteredPredictions.filter((p) => p.confidenceScore >= 0.85).length;
    },
    mediumConfidenceCount() {
      return this.filteredPredictions.filter(
        (p) => p.confidenceScore >= 0.7 && p.confidenceScore < 0.85,
      ).length;
    },
    averageConfidence() {
      if (!this.filteredPredictions.length) return 0;
      const sum = this.filteredPredictions.reduce((acc, p) => acc + p.confidenceScore, 0);
      return ((sum / this.filteredPredictions.length) * 100).toFixed(1);
    },
    monthOptions() {
      const months = new Set(
        this.predictions.map((p) => p.predictionMonth?.slice(0, 7)).filter(Boolean),
      );
      return Array.from(months).sort().reverse();
    },
  },
  created() {
    this.predictionsStore = usePredictionsStore();
  },
  mounted() {
    // Load initial data if available
    this.predictions = this.predictionsStore.predictions || [];
  },
  methods: {
    formatDate,
    getNextMonth() {
      const now = new Date();
      now.setMonth(now.getMonth() + 1);
      return now.toISOString().slice(0, 7);
    },
    formatMonth(dateStr) {
      if (!dateStr) return '—';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      } catch {
        return dateStr;
      }
    },
    formatQuantity(qty) {
      if (qty == null) return '—';
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(qty);
    },
    getConfidenceColor(score) {
      if (score >= 0.85) return 'green';
      if (score >= 0.7) return 'orange';
      return 'red';
    },
    async generateAllPredictions() {
      this.loading = true;
      this.error = null;
      try {
        const result = await this.predictionsStore.generateAll();
        this.predictions = result;
        this.lastUpdated = Date.now();
      } catch (e) {
        this.error = 'Falha ao gerar previsões. Verifique suas permissões ou tente novamente.';
      } finally {
        this.loading = false;
      }
    },
    async loadByMonth() {
      if (!this.selectedMonth) return;
      this.loading = true;
      this.error = null;
      this.showMonthDialog = false;
      try {
        const monthDate = this.selectedMonth + '-01';
        const result = await this.predictionsStore.getByMonth(monthDate);
        this.predictions = result;
        this.lastUpdated = Date.now();
      } catch (e) {
        this.error = 'Falha ao buscar previsões do mês selecionado.';
      } finally {
        this.loading = false;
      }
    },
    async viewHistory(item) {
      this.selectedItem = item;
      this.showHistoryDialog = true;
      this.loadingHistory = true;
      try {
        this.historyData = await this.predictionsStore.getHistoryByItem(item.itemId);
      } catch (e) {
        this.historyData = [];
      } finally {
        this.loadingHistory = false;
      }
    },
    async regeneratePrediction(item) {
      this.loading = true;
      this.error = null;
      try {
        await this.predictionsStore.generateForItem(item.itemId, item.predictionMonth);
        await this.refreshCurrentView();
      } catch (e) {
        this.error = 'Falha ao regerar previsão.';
      } finally {
        this.loading = false;
      }
    },
    async refreshCurrentView() {
      // Refresh based on current filter
      if (this.filterMonth) {
        const monthDate = this.filterMonth + '-01';
        this.predictions = await this.predictionsStore.getByMonth(monthDate);
      } else {
        // If no month filter, just update timestamp (user needs to generate manually)
        this.lastUpdated = Date.now();
      }
    },
  },
};
</script>

<style scoped>
.bg-blue-50 {
  background-color: #eff6ff;
}
.text-blue-800 {
  color: #1e40af;
}
.text-blue-900 {
  color: #1e3a8a;
}
.bg-green-50 {
  background-color: #f0fdf4;
}
.text-green-800 {
  color: #166534;
}
.text-green-900 {
  color: #14532d;
}
.bg-orange-50 {
  background-color: #fff7ed;
}
.text-orange-800 {
  color: #9a3412;
}
.text-orange-900 {
  color: #7c2d12;
}
.bg-purple-50 {
  background-color: #faf5ff;
}
.text-purple-800 {
  color: #6b21a8;
}
.text-purple-900 {
  color: #581c87;
}
</style>
