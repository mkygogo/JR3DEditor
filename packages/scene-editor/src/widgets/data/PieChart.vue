<template>
  <div class="hud-pie-chart">
    <div class="chart-title" v-if="data.title">{{ data.title }}</div>
    <div class="chart-container" ref="chartRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { PieChart as PieChartComponent } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([PieChartComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps({
  data: { type: Object, required: true },
  styleConfig: { type: Object, default: () => ({}) }
})

const chartRef = ref(null)
let chart = null

const palette = ['#00d4ff', '#00ff88', '#ffaa00', '#ff5577', '#aa77ff', '#77ddff']

function getOption() {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      bottom: 0,
      textStyle: { color: 'rgba(180,220,255,0.6)', fontSize: 10 },
      itemWidth: 8,
      itemHeight: 8
    },
    color: palette,
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: { show: true, color: '#e0f0ff', fontSize: 12 }
      },
      data: props.data.data || []
    }]
  }
}

onMounted(() => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, null, { renderer: 'canvas' })
  chart.setOption(getOption())
})

watch(() => props.data, () => {
  if (chart) chart.setOption(getOption())
}, { deep: true })

onUnmounted(() => {
  if (chart) { chart.dispose(); chart = null }
})
</script>

<style scoped>
.hud-pie-chart {
  padding: 4px 0;
}
.chart-title {
  font-size: 11px;
  color: rgba(180, 220, 255, 0.6);
  margin-bottom: 4px;
}
.chart-container {
  width: 100%;
  height: 140px;
}
</style>
