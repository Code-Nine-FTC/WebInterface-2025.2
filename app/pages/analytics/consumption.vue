<template>
  <div class="analytics-consumption space-y-8">
    <!-- Filtros -->
    <v-card class="pa-5 mb-4" elevation="2">
      <div class="d-flex align-center gap-4 mb-3">
        <v-icon icon="mdi-filter" class="mr-2" />
        <span class="text-subtitle-2 font-semibold">Filtros</span>
      </div>
      <div class="d-flex flex-wrap gap-4">
        <v-menu
          v-model="menuStart"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template #activator="{ props }">
            <v-text-field
              v-model="startDateFormatted"
              label="Data Inicial"
              readonly
              v-bind="props"
              class="mr-2"
            />
          </template>
          <v-date-picker
            v-model="startDate"
            @input="menuStart = false"
            locale="pt-BR"
            :max="endDate"
          />
        </v-menu>
        <v-menu
          v-model="menuEnd"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template #activator="{ props }">
            <v-text-field
              v-model="endDateFormatted"
              label="Data Final"
              readonly
              v-bind="props"
              class="mr-2"
            />
          </template>
          <v-date-picker
            v-model="endDate"
            @input="menuEnd = false"
            locale="pt-BR"
            :min="startDate"
          />
        </v-menu>
        <v-btn color="primary" class="ml-4" @click="onFetchClick" :loading="loading">Buscar</v-btn>
      </div>
    </v-card>

    <!-- Lista Ranqueada -->
    <v-card class="pa-5 mb-4" elevation="2">
      <div class="d-flex align-center mb-4">
        <v-icon icon="mdi-format-list-numbered" class="mr-2" />
        <span class="text-subtitle-2 font-semibold">Materiais Mais Consumidos</span>
      </div>
      <v-table density="comfortable" class="table-flat">
        <thead>
          <tr>
            <th class="text-left">Material</th>
            <th class="text-left">Quantidade</th>
            <th class="text-left">Pedidos</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in summary" :key="item.materialId">
            <td>{{ item.nome }}</td>
            <td>{{ item.quantidade ?? '-' }}</td>
            <td>{{ item.pedidos ?? '-' }}</td>
          </tr>
        </tbody>
      </v-table>
      <div
        v-if="!summary.length && !loading"
        class="py-4 text-center text-caption text-medium-emphasis"
      >
        Nenhum dado encontrado
      </div>
    </v-card>

    <!-- Gráfico de Quantidade -->
    <v-card class="pa-5 mb-4" elevation="2">
      <div class="d-flex align-center mb-4">
        <v-icon icon="mdi-chart-bar" class="mr-2" />
        <span class="text-subtitle-2 font-semibold">Ranking por Quantidade</span>
      </div>
      <client-only>
        <component
          :is="ApexChart"
          :key="chartKey + '-' + fetchTick"
          type="bar"
          height="350"
          :options="chartOptionsQuantidade"
          :series="chartSeriesQuantidade"
        />
      </client-only>
    </v-card>
    <!-- Gráfico de Pedidos -->
    <v-card class="pa-5 mb-4" elevation="2">
      <div class="d-flex align-center mb-4">
        <v-icon icon="mdi-chart-bar" class="mr-2" />
        <span class="text-subtitle-2 font-semibold">Ranking por Pedidos</span>
      </div>
      <client-only>
        <component
          :is="ApexChart"
          :key="'temporal-' + JSON.stringify(categoriesBR) + '-' + fetchTick"
          type="line"
          height="350"
          :options="chartOptionsTemporal"
          :series="chartSeriesTemporal"
        />
      </client-only>
    </v-card>

    <!-- Gráfico de Série Temporal (Quantidade por Dia) -->
    <v-card class="pa-5 mb-4" elevation="2">
      <div class="d-flex align-center mb-4">
        <v-icon icon="mdi-chart-timeline-variant" class="mr-2" />
        <span class="text-subtitle-2 font-semibold">Quantidade de Produtos por Dia</span>
      </div>
      <client-only>
        <component
          :is="ApexChart"
          :key="'temporal-' + fetchTick"
          type="line"
          height="350"
          :options="chartOptionsTemporal"
          :series="chartSeriesTemporal"
        />
      </client-only>
    </v-card>
  </div>
</template>

<script setup>
import { computed, watch, ref, onMounted, shallowRef, markRaw } from 'vue';
const menuStart = ref(false);
const menuEnd = ref(false);
const startDateFormatted = computed(() =>
  startDate.value ? new Date(startDate.value).toLocaleDateString('pt-BR') : '',
);
const endDateFormatted = computed(() =>
  endDate.value ? new Date(endDate.value).toLocaleDateString('pt-BR') : '',
);
import { useConsumptionAnalyticsStore } from '~/stores/useConsumptionAnalyticsStore';
import { storeToRefs } from 'pinia';
const store = useConsumptionAnalyticsStore();
const { summary, series, seriesCategories, loading, startDate, endDate } = storeToRefs(store);
const fetchData = store.fetchData;
const ApexChart = shallowRef(null);
const chartKey = computed(() => JSON.stringify(summary.value));
const fetchTick = ref(0);
let temporalInstance = null;

async function onFetchClick() {
  try {
    await fetchData();
    // increment tick to force remount of charts
    fetchTick.value++;
    console.log('onFetchClick: fetchData completed, summary:', summary.value);
    console.log('temporal series:', series.value);
    console.log('temporal categories:', seriesCategories.value);
    try {
      if (Array.isArray(series.value) && series.value.length > 0) {
        console.log('sample series raw:', JSON.stringify(series.value[0]));
      }
    } catch (e) {
      console.debug('sample series stringify failed', e);
    }
  } catch (e) {
    console.error('onFetchClick error', e);
  }
}

import { onBeforeUnmount } from 'vue';
onBeforeUnmount(() => {
  try {
    if (temporalInstance) temporalInstance.dispose();
  } catch (e) {}
});

onMounted(async () => {
  const mod = await import('vue3-apexcharts');
  ApexChart.value = markRaw(mod.default);
  fetchData();
});

definePageMeta({ layout: 'default', middleware: 'auth' });

const chartOptionsQuantidade = computed(() => ({
  chart: { id: 'top-materials-quantidade' },
  xaxis: {
    categories: Array.isArray(summary.value) ? summary.value.map((s) => s.nome) : [],
  },
  yaxis: {
    title: { text: 'Quantidade' },
  },
  stroke: { curve: 'smooth' },
  dataLabels: { enabled: false },
  plotOptions: {
    bar: { distributed: true },
  },
  colors: Array.isArray(summary.value)
    ? summary.value.map((s, i) => {
        const palette = [
          '#008FFB',
          '#00E396',
          '#FEB019',
          '#FF4560',
          '#775DD0',
          '#3F51B5',
          '#546E7A',
          '#D4526E',
        ];
        return palette[i % palette.length];
      })
    : [],
}));

const chartSeriesQuantidade = computed(() => [
  {
    name: 'Quantidade',
    data: Array.isArray(summary.value) ? summary.value.map((s) => s.quantidade) : [],
  },
]);

const chartOptionsPedidos = computed(() => ({
  chart: { id: 'top-materials-pedidos' },
  xaxis: {
    categories: Array.isArray(summary.value) ? summary.value.map((s) => s.nome) : [],
  },
  stroke: { curve: 'smooth' },
  dataLabels: { enabled: false },
  plotOptions: {
    bar: { distributed: true },
  },
  colors: Array.isArray(summary.value)
    ? summary.value.map((s, i) => {
        const palette = [
          '#008FFB',
          '#00E396',
          '#FEB019',
          '#FF4560',
          '#775DD0',
          '#3F51B5',
          '#546E7A',
          '#D4526E',
        ];
        return palette[i % palette.length];
      })
    : [],
  tooltip: {
    y: {
      formatter: function (val) {
        return Math.round(val);
      },
    },
  },
}));

const chartSeriesPedidos = computed(() => [
  {
    name: 'Pedidos',
    data: Array.isArray(summary.value) ? summary.value.map((s) => s.pedidos) : [],
  },
]);

// helpers
function toYmd(s) {
  const v = String(s ?? '').trim();
  return v; // já vem correto do backend
}
function ymdToBR(ymd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return String(ymd);
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

// categorias prontas (texto, dd/MM/yyyy)
const categoriesBR = computed(() => {
  const catsYMD = Array.isArray(seriesCategories.value)
    ? seriesCategories.value.map(toYmd).filter(Boolean)
    : [];
  return catsYMD.map(ymdToBR);
});

// ✅ eixo por CATEGORIA, rótulo como texto (sem abreviação)
const chartOptionsTemporal = computed(() => ({
  chart: { id: 'temporal-quantidade' },
  xaxis: {
    type: 'category',
    categories: categoriesBR.value, // "03/10/2025", "21/10/2025"
    title: { text: 'Data' },
    labels: {
      rotate: -45,
      rotateAlways: true,
      hideOverlappingLabels: false,
      trim: false,
      formatter: (val) => String(val), // já formatado
    },
    tickPlacement: 'on',
  },
  yaxis: { title: { text: 'Quantidade' } },
  stroke: { curve: 'smooth' },
  dataLabels: { enabled: false },
  markers: { size: 5 },
  tooltip: {
    shared: true,
    x: {
      // usa exatamente a categoria mostrada no eixo
      formatter: (_val, { dataPointIndex, w }) =>
        String(w.globals.categoryLabels?.[dataPointIndex] ?? ''),
    },
    y: { formatter: (v) => (v == null ? '-' : Math.round(v)) },
  },
  colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#3F51B5', '#546E7A', '#D4526E'],
}));

const chartSeriesTemporal = computed(() => {
  if (!Array.isArray(series.value) || !Array.isArray(seriesCategories.value)) return [];
  const len = categoriesBR.value.length;

  return series.value.map((grupo) => {
    const vals = Array.isArray(grupo.data) ? grupo.data.slice(0, len) : [];
    const data = Array.from({ length: len }, (_, i) => {
      const v = vals[i];
      return v === 0 || v == null ? null : v; // <-- 👈 0 vira null (não desenha)
    });
    return { name: grupo.nome || `Grupo ${grupo.grupoId}`, data };
  });
});
</script>

<style scoped>
.analytics-consumption {
  max-width: 100%;
  margin: 0 auto;
}
.table-flat :deep(thead tr) {
  background: #fafafa;
}
.table-flat :deep(th) {
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.table-flat :deep(td) {
  font-size: 0.78rem;
  vertical-align: middle;
}
</style>
