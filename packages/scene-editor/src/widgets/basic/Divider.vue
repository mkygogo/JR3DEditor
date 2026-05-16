<template>
  <div class="divider-widget" :class="data.direction || 'horizontal'">
    <div class="divider-line" :style="lineStyle"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ data: { type: Object, required: true }, styleConfig: Object })
const lineStyle = computed(() => {
  const dir = props.data.direction || 'horizontal'
  const color = props.data.color || 'rgba(0,212,255,0.3)'
  const t = (props.data.thickness || 1) + 'px'
  return dir === 'horizontal'
    ? { width: '100%', height: t, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }
    : { height: '100%', width: t, background: `linear-gradient(180deg, transparent, ${color}, transparent)` }
})
</script>

<style scoped>
.divider-widget {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
