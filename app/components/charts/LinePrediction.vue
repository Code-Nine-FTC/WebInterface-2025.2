<template>
  <div>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  labels: Array,
  consumption: Array,
  stock: Array,
});

const canvas = ref(null);
let chartInstance = null;

onMounted(() => {
  renderChart();
});

watch(
  () => [props.labels, props.consumption, props.stock],
  () => {
    renderChart();
  },
);

function renderChart() {
  if (chartInstance) {
    chartInstance.destroy();
  }
  chartInstance = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: 'Consumo Previsto',
          data: props.consumption,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.1)',
          fill: false,
        },
        {
          label: 'Estoque Previsto',
          data: props.stock,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}
</script>
