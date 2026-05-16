<template>
  <div class="hud-gauge-chart">
    <div class="gauge-label">{{ data.label }}</div>
    <div class="gauge-container" ref="chartRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { GaugeChart as GaugeChartComponent } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([GaugeChartComponent, CanvasRenderer])

const props = defineProps({
  data: { type: Object, required: true },
  styleConfig: { type: Object, default: () => ({}) }
})

const chartRef = ref(null)
let chart = null

function getOption() {
  const color = props.data.color || '#00d4ff'
  return {
    series: [{
      type: 'gauge',
      startAngle: 220,
      endAngle: -40,
      radius: '90%',
      min: props.data.min ?? 0,
      max: props.data.max ?? 100,
      progress: {
        show: true,
        width: 10,
        itemStyle: { color }
      },
      axisLine: {
        lineStyle: {
          width: 10,
          color: [[1, 'rgba(0, 60, 120, 0.3)']]
        }
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      anchor: { show: false },
      title: { show: false },
      detail: {
        fontSize: 18,
        fontWeight: 700,
        fontFamily: 'Courier New',
        color,
        offsetCenter: [0, '10%'],
        formatter: `{value}${props.data.unit || ''}`
      },
      data: [{ value: props.data.value }]
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
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
.hud-gauge-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-label {
  font-size: 11px;
  color: rgba(180, 220, 255, 0.6);
  margin-bottom: 2px;
}

.gauge-container {
  width: 100px;
  height: 90px;
}
</style>
