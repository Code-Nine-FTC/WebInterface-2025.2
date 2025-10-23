<template>
  <div class="pa-4 pa-md-6 bg-grey-lighten-4">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold text-grey-darken-3 mb-4">Dashboard de Análises</h1>

      <v-card class="elevation-2">
        <v-card-text class="pa-4">
          <div class="d-flex flex-wrap align-center gap-3">
            <v-text-field
              v-model="startDate"
              type="date"
              label="Data Inicial"
              density="comfortable"
              variant="outlined"
              hide-details
              :max="endDate"
              class="flex-grow-0"
              style="max-width: 180px"
            />

            <v-text-field
              v-model="endDate"
              type="date"
              label="Data Final"
              density="comfortable"
              variant="outlined"
              hide-details
              :min="startDate"
              class="flex-grow-0"
              style="max-width: 180px"
            />

            <v-select
              v-model="step"
              :items="stepOptions"
              item-title="label"
              item-value="value"
              label="Agrupamento"
              density="comfortable"
              variant="outlined"
              hide-details
              class="flex-grow-0"
              style="max-width: 150px"
            />

            <v-switch
              v-model="onlyCompleted"
              label="Apenas concluídos"
              color="primary"
              hide-details
              density="comfortable"
            />

            <v-btn
              color="primary"
              :loading="loading"
              @click="refreshAll"
              prepend-icon="mdi-refresh"
              class="text-none"
            >
              Atualizar
            </v-btn>

            <v-spacer />

            <div class="d-flex gap-2">
              <v-btn
                variant="outlined"
                color="primary"
                size="small"
                @click="setLastDays(30)"
                class="text-none"
              >
                30 dias
              </v-btn>
              <v-btn
                variant="outlined"
                color="primary"
                size="small"
                @click="setLastDays(90)"
                class="text-none"
              >
                90 dias
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <div class="grid-container">
      <v-card class="elevation-2 grid-item-full">
        <v-card-title class="d-flex justify-space-between align-center bg-gradient px-4 py-3">
          <span class="text-subtitle-1 font-weight-bold">Top Materiais Mais Solicitados</span>
          <v-text-field
            v-model.number="limitTop"
            type="number"
            label="Top"
            density="compact"
            variant="outlined"
            hide-details
            :min="5"
            :max="20"
            style="max-width: 80px"
          />
        </v-card-title>
        <v-card-text class="pa-0">
          <v-progress-linear v-if="analyticsStore.loadingTop" indeterminate color="primary" />
          <v-alert v-else-if="analyticsStore.errorTop" type="error" variant="tonal" class="ma-4">
            Erro ao carregar dados
          </v-alert>
          <v-alert
            v-else-if="!analyticsStore.topMateriais.length"
            type="info"
            variant="tonal"
            class="ma-4"
          >
            Sem dados para o período selecionado
          </v-alert>
          <v-table v-else density="comfortable" class="custom-table">
            <thead>
              <tr>
                <th class="text-left font-weight-bold">Material</th>
                <th class="text-left font-weight-bold">Grupo</th>
                <th class="text-right font-weight-bold">Pedidos</th>
                <th class="text-right font-weight-bold">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in analyticsStore.topMateriais" :key="idx" class="hover-row">
                <td class="text-primary font-weight-medium">{{ row.name }}</td>
                <td class="text-grey-darken-1">{{ row.group || '-' }}</td>
                <td class="text-right">{{ row.pedidos }}</td>
                <td class="text-right font-weight-bold text-primary">{{ row.quantidade }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>

      <v-card class="elevation-2">
        <v-card-title class="bg-gradient px-4 py-3">
          <span class="text-subtitle-1 font-weight-bold">Demanda por Grupo</span>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-progress-linear v-if="analyticsStore.loadingGrupo" indeterminate color="primary" />
          <v-alert v-else-if="analyticsStore.errorGrupo" type="error" variant="tonal" class="ma-4">
            Erro ao carregar dados
          </v-alert>
          <v-alert
            v-else-if="!analyticsStore.demandaPorGrupo.length"
            type="info"
            variant="tonal"
            class="ma-4"
          >
            Sem dados para o período selecionado
          </v-alert>
          <div v-else class="table-container">
            <v-table density="comfortable" class="custom-table">
              <thead>
                <tr>
                  <th class="text-left font-weight-bold">Grupo</th>
                  <th class="text-right font-weight-bold">Pedidos</th>
                  <th class="text-right font-weight-bold">Qtd</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in analyticsStore.demandaPorGrupo"
                  :key="idx"
                  class="hover-row"
                >
                  <td class="text-primary font-weight-medium">{{ row.group }}</td>
                  <td class="text-right">{{ row.pedidos }}</td>
                  <td class="text-right font-weight-bold text-primary">{{ row.quantidade }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="elevation-2">
        <v-card-title class="bg-gradient px-4 py-3">
          <span class="text-subtitle-1 font-weight-bold">Consumo por Seção</span>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-progress-linear v-if="consumptionStore.loading" indeterminate color="primary" />
          <v-alert v-else-if="consumptionStore.error" type="error" variant="tonal" class="ma-4">
            Erro ao carregar dados
          </v-alert>
          <v-alert
            v-else-if="!consumptionStore.summary.length"
            type="info"
            variant="tonal"
            class="ma-4"
          >
            Sem dados para o período selecionado
          </v-alert>
          <div v-else class="table-container">
            <v-table density="comfortable" class="custom-table">
              <thead>
                <tr>
                  <th class="text-left font-weight-bold">Seção</th>
                  <th class="text-right font-weight-bold">Pedidos</th>
                  <th class="text-right font-weight-bold">Qtd</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in consumptionStore.summary.slice(0, 10)"
                  :key="idx"
                  class="hover-row"
                >
                  <td class="text-primary font-weight-medium">{{ row.secaoNome }}</td>
                  <td class="text-right">{{ row.pedidos }}</td>
                  <td class="text-right font-weight-bold text-primary">{{ row.quantidade }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="elevation-2 grid-item-full">
        <v-card-title class="bg-gradient px-4 py-3">
          <span class="text-subtitle-1 font-weight-bold">Evolução da Demanda por Grupo</span>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-progress-linear v-if="analyticsStore.loadingSeries" indeterminate color="primary" />
          <v-alert v-else-if="analyticsStore.errorSeries" type="error" variant="tonal">
            Erro ao carregar dados
          </v-alert>
          <v-alert
            v-else-if="!analyticsStore.demandaSeries.categories.length"
            type="info"
            variant="tonal"
          >
            Sem dados para o período selecionado
          </v-alert>
          <ChartsBarGrouped
            v-else
            :categories="analyticsStore.demandaSeries.categories"
            :series="analyticsStore.demandaSeries.series"
            :height="300"
            y-label="Quantidade"
            :title="`Demanda por grupo (${stepLabel})`"
            :show-data-labels="false"
          />
        </v-card-text>
      </v-card>

      <v-card class="elevation-2">
        <v-card-title class="bg-gradient px-4 py-3">
          <span class="text-subtitle-1 font-weight-bold">Ranking de Consumo</span>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-progress-linear v-if="consumptionStore.loading" indeterminate color="primary" />
          <v-alert v-else-if="consumptionStore.error" type="error" variant="tonal">
            Erro ao carregar dados
          </v-alert>
          <v-alert v-else-if="!barCategories.length" type="info" variant="tonal">
            Sem dados para o período selecionado
          </v-alert>
          <ChartsBarGrouped
            v-else
            :categories="barCategories"
            :series="barSeries"
            :height="280"
            y-label="Quantidade"
            title="Consumo por seção"
            :show-data-labels="true"
            data-label-mode="value"
          />
        </v-card-text>
      </v-card>

      <v-card class="elevation-2">
        <v-card-title class="bg-gradient px-4 py-3">
          <span class="text-subtitle-1 font-weight-bold">Evolução por Seção</span>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-progress-linear v-if="consumptionStore.loading" indeterminate color="primary" />
          <v-alert v-else-if="consumptionStore.error" type="error" variant="tonal">
            Erro ao carregar dados
          </v-alert>
          <v-alert v-else-if="!seriesCategories.length" type="info" variant="tonal">
            Sem dados para o período selecionado
          </v-alert>
          <ChartsBarGrouped
            v-else
            :categories="seriesCategories"
            :series="seriesData"
            :height="280"
            y-label="Quantidade"
            :title="`Consumo por seção (${stepLabel})`"
            :show-data-labels="false"
          />
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAnalytics } from '@/stores/analytics';
import { useConsumptionAnalyticsStore } from '@/stores/useConsumptionAnalyticsStore';
import ChartsBarGrouped from '@/components/charts/BarGrouped.vue';

definePageMeta({ layout: 'default', middleware: 'auth' });

const analyticsStore = useAnalytics();
const consumptionStore = useConsumptionAnalyticsStore();

const stepOptions = [
  { label: 'Dia', value: 'day' },
  { label: 'Semana', value: 'week' },
  { label: 'Mês', value: 'month' },
];

const today = new Date();
const startDefault = new Date(today);
startDefault.setDate(startDefault.getDate() - 30);

function fmt(d: Date): string {
  return d.toISOString().split('T')[0] || '';
}

const startDate = ref<string>(fmt(startDefault));
const endDate = ref<string>(fmt(today));
const onlyCompleted = ref<boolean>(true);
const step = ref<'day' | 'week' | 'month'>('month');
const limitTop = ref<number>(10);
const loading = ref<boolean>(false);

const stepLabel = computed(() => {
  switch (step.value) {
    case 'day':
      return 'dia';
    case 'week':
      return 'semana';
    default:
      return 'mês';
  }
});

const barCategories = computed(() => (consumptionStore.summary || []).map((s) => s.secaoNome));
const barSeries = computed(() => {
  const sum = consumptionStore.summary || [];
  return [
    { name: 'Quantidade', data: sum.map((s: any) => Number(s.quantidade) || 0) },
    { name: 'Pedidos', data: sum.map((s: any) => Number(s.pedidos) || 0) },
  ];
});

const seriesCategories = computed(() => consumptionStore.seriesCategories as string[]);
const seriesData = computed(() =>
  (consumptionStore.series || []).map((s: any) => ({ name: s.name, data: s.data })),
);

function setLastDays(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  startDate.value = fmt(start);
  endDate.value = fmt(end);
  refreshAll();
}

async function refreshAll() {
  if (!startDate.value || !endDate.value) return;

  loading.value = true;

  consumptionStore.startDate = startDate.value;
  consumptionStore.endDate = endDate.value;
  consumptionStore.onlyCompleted = onlyCompleted.value;
  consumptionStore.step = step.value;

  try {
    await Promise.all([
      analyticsStore.fetchTop({
        startDate: startDate.value,
        endDate: endDate.value,
        onlyCompleted: onlyCompleted.value,
        limit: limitTop.value,
      }),
      analyticsStore.fetchDemandaGrupo({
        startDate: startDate.value,
        endDate: endDate.value,
        onlyCompleted: onlyCompleted.value,
        step: step.value,
      }),
      analyticsStore.fetchDemandaSeries({
        startDate: startDate.value,
        endDate: endDate.value,
        onlyCompleted: onlyCompleted.value,
        step: step.value,
      }),
      consumptionStore.fetchData(),
    ]);
  } finally {
    loading.value = false;
  }
}

// Watch para atualizar quando limitTop mudar
watch(limitTop, () => {
  if (startDate.value && endDate.value) {
    analyticsStore.fetchTop({
      startDate: startDate.value,
      endDate: endDate.value,
      onlyCompleted: onlyCompleted.value,
      limit: limitTop.value,
    });
  }
});

onMounted(() => {
  refreshAll();
});
</script>

<style lang="scss" scoped>
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.25rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.grid-item-full {
  grid-column: 1 / -1;
}

.bg-gradient {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-bottom: 2px solid #f0f0f0;
}

.custom-table {
  max-height: 400px;
  overflow-y: auto;

  :deep(thead th) {
    position: sticky;
    top: 0;
    z-index: 10;
    background: linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%) !important;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  :deep(tbody tr.hover-row) {
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.04);
    }
  }
}

.table-container {
  max-height: 300px;
  overflow-y: auto;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-3 {
  gap: 0.75rem;
}
</style>
