<template>
  <div class="pa-4 pa-sm-6">
    <div class="d-flex flex-wrap align-center gap-3 mb-4">
      <v-text-field
        v-model="startDate"
        type="date"
        label="Início"
        density="comfortable"
        :max="endDate || undefined"
        hide-details
        style="max-width: 200px"
      />
      <v-text-field
        v-model="endDate"
        type="date"
        label="Fim"
        density="comfortable"
        :min="startDate || undefined"
        hide-details
        style="max-width: 200px"
      />
      <v-select
        v-model="step"
        :items="steps"
        item-title="label"
        item-value="value"
        label="Bucket"
        density="comfortable"
        hide-details
        style="max-width: 160px"
      />
      <v-switch
        v-model="onlyCompleted"
        color="primary"
        hide-details
        :label="`Somente pedidos concluídos`"
      />
      <v-btn :loading="loading" color="primary" @click="refresh">Atualizar</v-btn>
      <v-spacer />
      <v-btn variant="text" @click="setLastDays(30)" :disabled="loading">Últimos 30 dias</v-btn>
      <v-btn variant="text" @click="setLastDays(90)" :disabled="loading">Últimos 90 dias</v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      Ocorreu um erro ao carregar os dados de consumo.
    </v-alert>

    <v-card variant="flat" :loading="loading">
      <v-card-title class="text-subtitle-1">Consumo por seção (ranking)</v-card-title>
      <v-card-text>
        <component
          :is="BarGrouped"
          v-if="barCategories.length"
          :categories="barCategories"
          :series="barSeries"
          :height="420"
          y-label="Quantidade"
          title="Consumo por seção"
          data-label-mode="value"
          :show-data-labels="true"
        />
        <div v-else class="text-medium-emphasis">Sem dados no período selecionado.</div>
      </v-card-text>
    </v-card>

    <v-card class="mt-6" variant="flat" :loading="loading">
      <v-card-title class="text-subtitle-1">Séries por seção (temporal)</v-card-title>
      <v-card-text>
        <component
          :is="BarGrouped"
          v-if="seriesCategories.length && seriesData.length"
          :categories="seriesCategories"
          :series="seriesData"
          :height="420"
          y-label="Quantidade"
          :title="`Consumo por seção por ${stepLabel}`"
          data-label-mode="value"
          :show-data-labels="false"
        />
        <div v-else class="text-medium-emphasis">Sem dados para séries no período selecionado.</div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import BarGrouped from '~/components/charts/BarGrouped.vue';
import { useConsumptionAnalyticsStore } from '~/stores/useConsumptionAnalyticsStore';

definePageMeta({ layout: 'default', middleware: 'auth' });

const store = useConsumptionAnalyticsStore();

const startDate = computed({
  get: () => store.startDate,
  set: (v: any) => (store.startDate = v),
}) as unknown as any;
const endDate = computed({
  get: () => store.endDate,
  set: (v: any) => (store.endDate = v),
}) as unknown as any;
const onlyCompleted = computed({
  get: () => store.onlyCompleted,
  set: (v: boolean) => (store.onlyCompleted = v),
});
const step = computed({
  get: () => store.step,
  set: (v: 'day' | 'week' | 'month') => (store.step = v),
});

const steps = [
  { label: 'Dia', value: 'day' },
  { label: 'Semana', value: 'week' },
  { label: 'Mês', value: 'month' },
] as const;

const loading = computed(() => store.loading);
const error = computed(() => store.error);

const barCategories = computed(() => (store.summary || []).map((s) => s.secaoNome));
const barSeries = computed(() => {
  const sum = store.summary || [];
  return [
    { name: 'Quantidade', data: sum.map((s: any) => Number(s.quantidade) || 0) },
    { name: 'Pedidos', data: sum.map((s: any) => Number(s.pedidos) || 0) },
  ];
});

const seriesCategories = computed(() => store.seriesCategories as string[]);
const seriesData = computed(() =>
  (store.series || []).map((s: any) => ({ name: s.name, data: s.data })),
);

const stepLabel = computed(() => {
  switch (store.step) {
    case 'day':
      return 'dia';
    case 'week':
      return 'semana';
    default:
      return 'mês';
  }
});

function format(d: Date) {
  return d.toISOString().split('T')[0];
}

function setLastDays(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  store.startDate = format(start);
  store.endDate = format(end);
  refresh();
}

function refresh() {
  store.fetchData();
}

onMounted(() => {
  if (!store.startDate || !store.endDate) {
    setLastDays(30);
  } else {
    refresh();
  }
});
</script>

<style scoped>
.gap-3 {
  gap: 12px;
}
</style>
