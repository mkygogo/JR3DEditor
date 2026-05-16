<template>
  <div class="hud-alert-list">
    <div class="alert-title" v-if="data.title">{{ data.title }}</div>
    <div class="alert-items">
      <div class="alert-item" v-for="(item, i) in data.items" :key="i">
        <span class="alert-label">{{ item.label }}</span>
        <span class="alert-value" :style="{ color: item.color || '#00d4ff' }">{{ item.value }}</span>
      </div>
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
.hud-alert-list {
  padding: 4px 0;
}

.alert-title {
  font-size: 11px;
  color: rgba(180, 220, 255, 0.6);
  margin-bottom: 4px;
}

.alert-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.alert-item {
  display: flex;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(0, 40, 80, 0.3);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 2px;
  flex: 1;
  min-width: 80px;
}

.alert-label {
  font-size: 11px;
  color: rgba(180, 220, 255, 0.5);
}

.alert-value {
  font-size: 12px;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}
</style>
