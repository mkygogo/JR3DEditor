<template>
  <component v-if="widgetComponent" :is="widgetComponent" :data="widget.data" :style-config="widget.style" />
  <div v-else class="unknown-widget">{{ widget.type }}</div>
</template>

<script setup>
import { computed } from 'vue'
import { WIDGET_TYPES } from './types.js'

// Basic
import TextLabel from './basic/TextLabel.vue'
import ImageWidget from './basic/ImageWidget.vue'
import Container from './basic/Container.vue'
import ButtonWidget from './basic/ButtonWidget.vue'
import Divider from './basic/Divider.vue'
// Data
import ProgressBar from './data/ProgressBar.vue'
import StatCard from './data/StatCard.vue'
import GaugeChart from './data/GaugeChart.vue'
import BarChart from './data/BarChart.vue'
import LineChart from './data/LineChart.vue'
import PieChart from './data/PieChart.vue'
import DataTable from './data/DataTable.vue'
import AlertList from './data/AlertList.vue'

const props = defineProps({
  widget: { type: Object, required: true }
})

const componentMap = {
  [WIDGET_TYPES.TEXT_LABEL]: TextLabel,
  [WIDGET_TYPES.IMAGE]: ImageWidget,
  [WIDGET_TYPES.CONTAINER]: Container,
  [WIDGET_TYPES.BUTTON]: ButtonWidget,
  [WIDGET_TYPES.DIVIDER]: Divider,
  [WIDGET_TYPES.PROGRESS_BAR]: ProgressBar,
  [WIDGET_TYPES.STAT_CARD]: StatCard,
  [WIDGET_TYPES.GAUGE_CHART]: GaugeChart,
  [WIDGET_TYPES.BAR_CHART]: BarChart,
  [WIDGET_TYPES.LINE_CHART]: LineChart,
  [WIDGET_TYPES.PIE_CHART]: PieChart,
  [WIDGET_TYPES.DATA_TABLE]: DataTable,
  [WIDGET_TYPES.ALERT_LIST]: AlertList,
}

const widgetComponent = computed(() => componentMap[props.widget.type] || null)
</script>

<style scoped>
.unknown-widget {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f66;
  font-size: 12px;
}
</style>
