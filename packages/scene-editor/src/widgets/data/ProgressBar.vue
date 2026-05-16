<template>
  <div class="hud-progress-bar">
    <div class="progress-header">
      <span class="progress-label">{{ data.label }}</span>
      <span class="progress-value">{{ data.value }}<small v-if="data.unit"> {{ data.unit }}</small></span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" :style="fillStyle"></div>
    </div>
    <span class="progress-percent">{{ percent }}%</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
  styleConfig: { type: Object, default: () => ({}) }
})

const percent = computed(() => {
  const max = props.data.max || 100
  return Math.min(100, Math.round((props.data.value / max) * 100))
})

const fillStyle = computed(() => {
  const color = props.data.color || '#00d4ff'
  return {
    width: `${percent.value}%`,
    background: `linear-gradient(90deg, ${color}33, ${color})`
  }
})
</script>

<style scoped>
.hud-progress-bar {
  padding: 6px 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.progress-label {
  font-size: 12px;
  color: rgba(180, 220, 255, 0.8);
}

.progress-value {
  font-size: 14px;
  font-weight: 600;
  color: #00d4ff;
  font-family: 'Courier New', monospace;
}

.progress-value small {
  font-size: 10px;
  color: rgba(180, 220, 255, 0.5);
}

.progress-track {
  height: 6px;
  background: rgba(0, 60, 120, 0.3);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s ease;
  box-shadow: 0 0 8px rgba(0, 180, 255, 0.3);
}

.progress-percent {
  font-size: 10px;
  color: rgba(180, 220, 255, 0.5);
  float: right;
  margin-top: 2px;
}
</style>
