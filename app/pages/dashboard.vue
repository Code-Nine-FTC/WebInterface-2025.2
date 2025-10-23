<template>
  <div class="pa-4 pa-md-6 bg-grey-lighten-4">
    <div class="mb-6">
      <v-card class="elevation-4 rounded-lg filter-card">
        <v-card-text class="pa-5">
          <div class="d-flex flex-wrap align-center gap-3">
            <v-menu
              v-model="menuStartDate"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template #activator="{ props }">
                <v-text-field
                  :model-value="formattedStartDate"
                  label="Data Inicial"
                  prepend-inner-icon="mdi-calendar"
                  readonly
                  v-bind="props"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  class="date-field"
                  color="primary"
                  style="min-width: 220px"
                />
              </template>
              <v-date-picker
                v-model="startDatePicker"
                :max="endDatePicker"
                color="primary"
                locale="pt-BR"
                @update:model-value="menuStartDate = false"
              />
            </v-menu>

            <v-menu
              v-model="menuEndDate"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template #activator="{ props }">
                <v-text-field
                  :model-value="formattedEndDate"
                  label="Data Final"
                  prepend-inner-icon="mdi-calendar"
                  readonly
                  v-bind="props"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  class="date-field"
                  color="primary"
                  style="min-width: 220px"
                />
              </template>
              <v-date-picker
                v-model="endDatePicker"
                :min="startDatePicker"
                color="primary"
                locale="pt-BR"
                @update:model-value="menuEndDate = false"
              />
            </v-menu>

            <v-select
              v-model="step"
              :items="stepOptions"
              item-title="label"
              item-value="value"
              label="Agrupamento"
              prepend-inner-icon="mdi-chart-timeline-variant"
              density="comfortable"
              variant="outlined"
              hide-details
              color="primary"
              class="flex-grow-0"
              style="max-width: 180px"
            />

            <v-switch
              v-model="onlyCompleted"
              label="Apenas concluídos"
              color="primary"
              hide-details
              density="comfortable"
              inset
            />

            <v-btn
              color="primary"
              :loading="loading"
              @click="refreshAll"
              prepend-icon="mdi-refresh"
              class="text-none"
              size="large"
              elevation="2"
            >
              Atualizar
            </v-btn>

            <v-spacer />

            <v-chip-group class="d-flex gap-2">
              <v-chip
                color="primary"
                variant="outlined"
                @click="setLastDays(7)"
                prepend-icon="mdi-numeric-7-circle-outline"
                class="cursor-pointer"
              >
                7 dias
              </v-chip>
              <v-chip
                color="primary"
                variant="outlined"
                @click="setLastDays(30)"
                prepend-icon="mdi-calendar-month"
                class="cursor-pointer"
              >
                30 dias
              </v-chip>
              <v-chip
                color="primary"
                variant="outlined"
                @click="setLastDays(90)"
                prepend-icon="mdi-calendar-range"
                class="cursor-pointer"
              >
                90 dias
              </v-chip>
            </v-chip-group>
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

const menuStartDate = ref(false);
const menuEndDate = ref(false);

const startDatePicker = ref<Date>(startDefault);
const endDatePicker = ref<Date>(today);

const formattedStartDate = computed(() => {
  return new Date(startDatePicker.value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
});

const formattedEndDate = computed(() => {
  return new Date(endDatePicker.value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
});

watch(startDatePicker, (newDate) => {
  if (newDate) {
    startDate.value = fmt(new Date(newDate));
  }
});

watch(endDatePicker, (newDate) => {
  if (newDate) {
    endDate.value = fmt(new Date(newDate));
  }
});

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
  startDatePicker.value = start;
  endDatePicker.value = end;
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

.filter-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08) !important;

  &:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12) !important;
  }
}

.date-field {
  :deep(.v-field) {
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  :deep(.v-field--focused) {
    box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.2);
  }

  :deep(.v-field__prepend-inner) {
    .v-icon {
      color: rgb(var(--v-theme-primary));
    }
  }
}

.cursor-pointer {
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
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

:deep(.v-date-picker) {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
</style>
