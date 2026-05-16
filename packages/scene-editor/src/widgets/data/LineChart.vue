<template>
  <div class="hud-line-chart">
    <div class="chart-title" v-if="data.title">{{ data.title }}</div>
    <div class="chart-container" ref="chartRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart as LineChartComponent } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChartComponent, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  data: { type: Object, required: true },
  styleConfig: { type: Object, default: () => ({}) }
})

const chartRef = ref(null)
let chart = null

function getOption() {
  const color = props.data.color || '#00d4ff'
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 30, right: 10, top: 10, bottom: 24, containLabel: false },
    xAxis: {
      type: 'category',
      data: props.data.categories,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(0,180,255,0.2)' } },
      axisLabel: { color: 'rgba(180,220,255,0.6)', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(0,180,255,0.08)' } },
      axisLabel: { color: 'rgba(180,220,255,0.5)', fontSize: 10 }
    },
    series: (props.data.series || []).map(s => ({
      type: 'line',
      name: s.name,
      data: s.data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { color, width: 2 },
      itemStyle: { color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: `${color}40` },
          { offset: 1, color: `${color}05` }
        ])
      }
    }))
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
.hud-line-chart {
  padding: 4px 0;
}
.chart-title {
  font-size: 11px;
  color: rgba(180, 220, 255, 0.6);
  margin-bottom: 4px;
}
.chart-container {
  width: 100%;
  height: 120px;
}
</style>
