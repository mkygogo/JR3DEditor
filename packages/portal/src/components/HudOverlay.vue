<template>
  <div v-if="hudConfig && hudConfig.enabled" class="hud-overlay">
    <div
      v-for="widget in widgets"
      :key="widget.id"
      class="widget-wrapper"
      :style="getWidgetStyle(widget)"
    >
      <WidgetRenderer :widget="widget" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import WidgetRenderer from '@widgets/WidgetRenderer.vue'

const props = defineProps({
  hudConfig: { type: Object, default: null }
})

const widgets = computed(() => props.hudConfig?.widgets || [])

function getWidgetStyle(w) {
  const s = w.style || {}
  return {
    left: (w.x ?? 0) + '%',
    top: (w.y ?? 0) + '%',
    width: (w.width ?? 20) + '%',
    height: (w.height ?? 15) + '%',
    opacity: s.opacity ?? 1,
    background: s.background || 'rgba(6,30,60,0.85)',
    border: `${s.borderWidth || 1}px solid ${s.borderColor || 'rgba(0,212,255,0.4)'}`,
    borderRadius: (s.borderRadius || 4) + 'px',
    boxShadow: s.shadow ? '0 0 20px rgba(0,212,255,0.3)' : 'none',
  }
}
</script>

<style scoped>
.hud-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 5;
}

.widget-wrapper {
  position: absolute;
  overflow: hidden;
  pointer-events: auto;
}
</style>
