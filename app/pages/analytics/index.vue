<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAnalytics } from '@/stores/analytics';
import ChartsBarGrouped from '@/components/charts/BarGrouped.vue';

type DateISO = string;

const analytics = useAnalytics();
const tab = ref<'top' | 'grupos'>('top');

const today = new Date();
const startDefault = new Date(today);
startDefault.setDate(startDefault.getDate() - 90);

function fmt(d: Date): DateISO {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const startDate = ref<DateISO>(fmt(startDefault));
const endDate = ref<DateISO>(fmt(today));
const onlyCompleted = ref<boolean>(true);
const limitTop = ref<number>(10);
const step = ref<'month' | 'week' | 'day'>('month');
const groupId = ref<number | string | null>(null);
const sectionId = ref<number | string | null>(null);

const validRange = computed(() => !!startDate.value && !!endDate.value);

function currentFilters() {
  return {
    startDate: startDate.value,
    endDate: endDate.value,
    onlyCompleted: onlyCompleted.value,
    limit: tab.value === 'top' ? limitTop.value : undefined,
    step: tab.value === 'grupos' ? step.value : undefined,
    groupId: groupId.value ?? undefined,
    sectionId: sectionId.value ?? undefined,
  };
}

async function refresh() {
  if (!validRange.value) return;
  if (tab.value === 'top') {
    await analytics.fetchTop(currentFilters());
  } else {
    await Promise.all([
      analytics.fetchDemandaGrupo(currentFilters()),
      analytics.fetchDemandaSeries(currentFilters()),
    ]);
    // drawChart() // update after fetch
  }
}

watch([startDate, endDate, onlyCompleted, step, groupId, sectionId, limitTop, tab], () => {
  refresh();
});

onMounted(() => {
  refresh();
});

const yMetric = ref<'pedidos' | 'quantidade'>('pedidos');
const canvasEl = ref<HTMLCanvasElement | null>(null);

function drawChart() {
  const el = canvasEl.value;
  if (!el) return;
  const ctx = el.getContext('2d');
  if (!ctx) return;
  const cats = analytics.demandaSeries.categories;
  const series = analytics.demandaSeries.series;
  const width = el.width;
  const height = el.height;
  ctx.clearRect(0, 0, width, height);

  if (!cats.length || !series.length) {
    ctx.fillStyle = '#666';
    ctx.font = '14px sans-serif';
    ctx.fillText('Sem dados para o período escolhido.', 16, 24);
    return;
  }

  // map metric if server returns combined series; assume series already match metric
  const padding = 40;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const groupCount = cats.length;
  const seriesCount = series.length;
  const groupGap = 16;
  const barGap = 6;
  const groupWidth = (chartW - groupGap * (groupCount - 1)) / groupCount;
  const barWidth = (groupWidth - barGap * (seriesCount - 1)) / seriesCount;

  // max value
  let maxVal = 0;
  for (const s of series)
    for (const v of s.data) if (typeof v === 'number' && v > maxVal) maxVal = v;
  if (maxVal <= 0) maxVal = 1;

  // axes
  ctx.strokeStyle = '#999';
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + chartH);
  ctx.lineTo(padding + chartW, padding + chartH);
  ctx.stroke();

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e'];
  series.forEach((s, si) => {
    ctx.fillStyle = colors[si % colors.length];
    s.data.forEach((v, gi) => {
      const h = Math.round((v / maxVal) * (chartH - 1));
      const x = padding + gi * (groupWidth + groupGap) + si * (barWidth + barGap);
      const y = padding + chartH - h;
      ctx.fillRect(x, y, barWidth, h);
    });
  });

  // x labels
  ctx.fillStyle = '#222';
  ctx.font = '10px sans-serif';
  cats.forEach((c, gi) => {
    const x = padding + gi * (groupWidth + groupGap) + groupWidth / 2;
    ctx.fillText(String(c), x - 12, padding + chartH + 12);
  });
}

watch(
  [() => analytics.demandaSeries.categories, () => analytics.demandaSeries.series, yMetric],
  () => {
    requestAnimationFrame(drawChart);
  },
  { deep: true },
);
</script>

<template>
  <div class="analytics-page">
    <h1 class="page-title">Análises</h1>
    <div class="actions-inline mb-2">
      <NuxtLink to="/analytics-consumption" class="btn btn-primary">Ver consumo por seção</NuxtLink>
    </div>

    <!-- Filtros -->
    <div class="filters">
      <div class="filter">
        <label>Data inicial</label>
        <input v-model="startDate" type="date" class="input" />
      </div>
      <div class="filter">
        <label>Data final</label>
        <input v-model="endDate" type="date" class="input" />
      </div>
      <div class="filter">
        <label>Apenas concluídos</label>
        <div class="checkbox-row">
          <input v-model="onlyCompleted" type="checkbox" />
          <span>Pedidos efetivados</span>
        </div>
      </div>
      <div class="filter" v-if="tab === 'top'">
        <label>Top N</label>
        <input v-model.number="limitTop" type="number" min="1" step="1" class="input" />
      </div>
      <div class="filter" v-if="tab === 'grupos'">
        <label>Passo</label>
        <select v-model="step" class="select">
          <option value="month">Mês</option>
          <option value="week">Semana</option>
          <option value="day">Dia</option>
        </select>
      </div>
      <div class="filter actions">
        <button @click="refresh" class="btn btn-primary" :disabled="!validRange">Atualizar</button>
      </div>
    </div>

    <!-- Abas -->
    <div class="tabs">
      <button @click="tab = 'top'" :class="['tab', tab === 'top' ? 'active' : '']">
        Top materiais
      </button>
      <button @click="tab = 'grupos'" :class="['tab', tab === 'grupos' ? 'active' : '']">
        Demanda por grupo
      </button>
    </div>

    <!-- Top materiais -->
    <div v-if="tab === 'top'" class="panel">
      <div v-if="analytics.loadingTop" class="state">Carregando...</div>
      <div v-else-if="analytics.errorTop" class="state error">{{ analytics.errorTop }}</div>
      <div v-else-if="!analytics.topMateriais.length" class="state empty">
        Sem dados para o período escolhido.
      </div>
      <div v-else class="table-card">
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Grupo</th>
                <th class="text-right">Pedidos</th>
                <th class="text-right">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in analytics.topMateriais" :key="row.id ?? idx">
                <td>{{ row.name }}</td>
                <td>{{ row.group ?? '-' }}</td>
                <td class="text-right">{{ row.pedidos }}</td>
                <td class="text-right">{{ row.quantidade }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Demanda por grupo -->
    <div v-else class="panel">
      <div class="controls-inline">
        <label>Eixo Y</label>
        <select v-model="yMetric" class="select small">
          <option value="pedidos">Pedidos</option>
          <option value="quantidade">Quantidade</option>
        </select>
      </div>

      <div class="section">
        <h3>Resumo por grupo</h3>
        <div v-if="analytics.loadingGrupo" class="state">Carregando...</div>
        <div v-else-if="analytics.errorGrupo" class="state error">{{ analytics.errorGrupo }}</div>
        <div v-else-if="!analytics.demandaPorGrupo.length" class="state empty">
          Sem dados para o período escolhido.
        </div>
        <div v-else class="table-card">
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th class="text-right">Pedidos</th>
                  <th class="text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in analytics.demandaPorGrupo" :key="row.groupId ?? idx">
                  <td>{{ row.group }}</td>
                  <td class="text-right">{{ row.pedidos }}</td>
                  <td class="text-right">{{ row.quantidade }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Séries ao longo do tempo</h3>
        <div v-if="analytics.loadingSeries" class="state">Carregando...</div>
        <div v-else-if="analytics.errorSeries" class="state error">{{ analytics.errorSeries }}</div>
        <div v-else class="chart-card">
          <ChartsBarGrouped
            :categories="analytics.demandaSeries.categories"
            :series="analytics.demandaSeries.series"
            :height="360"
            :y-label="yMetric === 'pedidos' ? 'Pedidos' : 'Quantidade'"
            :title="`Demanda por grupo (${step})`"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.analytics-page {
  padding: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
}

.filters {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
  margin-bottom: 12px;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.filter label {
  display: block;
  font-size: 12px;
  color: #555;
  margin-bottom: 4px;
}

.input,
.select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
}

.select.small {
  width: auto;
}

.checkbox-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.actions {
  justify-self: end;
}

.btn {
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background: #2563eb; /* blue-600 */
  color: #fff;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #e5e7eb;
  margin: 8px 0 16px;
}

.tab {
  padding: 8px 12px;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tab.active {
  color: #111827;
  border-bottom-color: #2563eb; /* blue-600 */
}

.panel {
  display: grid;
  gap: 12px;
}

.state {
  color: #4b5563;
  font-size: 14px;
}
.state.error {
  color: #dc2626;
}
.state.empty {
  color: #6b7280;
}

.table-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

.table thead th {
  background: #f9fafb;
  color: #374151;
  text-align: left;
  font-weight: 600;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
}

.table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.table tbody tr:hover td {
  background: #f8fafc;
}

.text-right {
  text-align: right;
}

.controls-inline {
  display: flex;
  gap: 8px;
  align-items: center;
}

.section {
  display: grid;
  gap: 10px;
}
.section h3 {
  font-weight: 600;
  font-size: 15px;
}
</style>
