<template>
  <div class="hud-center-popup" v-if="data.visible" :style="popupStyle">
    <div class="popup-header">
      <span class="popup-title">{{ data.title }}</span>
      <span class="popup-close" @click="data.visible = false">✕</span>
    </div>
    <div class="popup-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
  styleConfig: { type: Object, default: () => ({}) }
})

const popupStyle = computed(() => ({
  width: `${props.data.width || 400}px`,
  maxHeight: `${props.data.height || 300}px`
}))
</script>

<style scoped>
.hud-center-popup {
  background: rgba(0, 20, 50, 0.92);
  border: 1px solid rgba(0, 180, 255, 0.35);
  border-radius: 4px;
  box-shadow: 0 0 30px rgba(0, 120, 255, 0.2), inset 0 0 20px rgba(0, 60, 120, 0.1);
  overflow: hidden;
  pointer-events: auto;
}

.popup-header {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: linear-gradient(90deg, rgba(0, 100, 200, 0.35), rgba(0, 60, 120, 0.15));
  border-bottom: 1px solid rgba(0, 180, 255, 0.2);
}

.popup-title {
  font-size: 14px;
  font-weight: 600;
  color: #e0f0ff;
  letter-spacing: 1px;
}

.popup-close {
  color: rgba(180, 220, 255, 0.5);
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s;
}

.popup-close:hover {
  color: #ff6b6b;
}

.popup-body {
  padding: 12px;
  overflow-y: auto;
}
</style>
