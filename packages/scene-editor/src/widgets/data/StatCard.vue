<template>
  <div class="hud-stat-card">
    <span class="stat-icon">{{ data.icon }}</span>
    <div class="stat-info">
      <span class="stat-value" :style="{ color: data.color || '#00d4ff' }">{{ data.value }}</span>
      <span class="stat-label">{{ data.label }}<small v-if="data.unit"> {{ data.unit }}</small></span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: { type: Object, required: true },
  styleConfig: { type: Object, default: () => ({}) }
})
</script>

<style scoped>
.hud-stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(0, 40, 80, 0.3);
  border: 1px solid rgba(0, 180, 255, 0.12);
  border-radius: 2px;
}

.stat-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  line-height: 1.1;
  text-shadow: 0 0 10px currentColor;
}

.stat-label {
  font-size: 11px;
  color: rgba(180, 220, 255, 0.6);
  margin-top: 2px;
}

.stat-label small {
  color: rgba(180, 220, 255, 0.4);
}
</style>
