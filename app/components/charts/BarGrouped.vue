<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ChartDataLabels)

interface Series { name: string; data: number[] }

const props = defineProps<{
  categories: string[]
  series: Series[]
  height?: number
  yLabel?: string
  title?: string
  dataLabelMode?: 'name' | 'value' | 'both'
  showDataLabels?: boolean
}>()

const palette = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e',
  '#06b6d4', '#f43f5e', '#a855f7', '#84cc16', '#eab308', '#0ea5e9'
]

const chartData = computed(() => {
  const labels = props.categories || []
  const datasets = (props.series || []).map((s, i) => ({
    label: s.name || `Série ${i+1}`,
    data: s.data || [],
    backgroundColor: palette[i % palette.length] + 'cc',
    borderColor: palette[i % palette.length],
    borderWidth: 1,
    borderRadius: 6,
    maxBarThickness: 36,
  }))
  return { labels, datasets }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const, labels: { boxWidth: 12 } },
    title: { display: !!props.title, text: props.title || '' },
    tooltip: { mode: 'index' as const, intersect: false },
    datalabels: props.showDataLabels === false ? undefined : {
      anchor: 'end',
      align: 'end',
      offset: 2,
      color: '#111827',
      backgroundColor: 'rgba(255,255,255,0.8)',
      borderRadius: 4,
      padding: { left: 6, right: 6, top: 2, bottom: 2 },
      borderColor: 'rgba(17,24,39,0.15)',
      borderWidth: 1,
      font: { weight: '600', size: 10 },
      formatter: (value: any, ctx: any) => {
        const label = ctx?.dataset?.label ?? ''
        const v = typeof value === 'number' ? value : Number(value) || 0
        switch (props.dataLabelMode || 'name') {
          case 'value': return `${v}`
          case 'both': return `${label} (${v})`
          default: return String(label)
        }
      },
      clamp: true,
      clip: false,
    },
  },
  scales: {
    x: { stacked: false, ticks: { maxRotation: 0, autoSkip: true }, grid: { display: false } },
    y: { beginAtZero: true, title: { display: !!props.yLabel, text: props.yLabel || '' } },
  },
}))

onMounted(() => {
  // no-op; chart reacts via computed
})

watch(() => [props.categories, props.series], () => {}, { deep: true })
</script>

<template>
  <div class="bar-chart" :style="{ height: (height ?? 360) + 'px' }">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.bar-chart { width: 100%; }
</style>
