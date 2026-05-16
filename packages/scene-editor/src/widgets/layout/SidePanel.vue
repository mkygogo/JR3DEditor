<template>
  <div class="hud-side-panel" :class="data.position">
    <div class="panel-header">
      <div class="header-decoration"></div>
      <span class="header-title">{{ data.title }}</span>
      <div class="header-decoration flip"></div>
    </div>
    <div class="panel-body">
      <slot />
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
.hud-side-panel {
  background: linear-gradient(180deg, rgba(0, 20, 50, 0.88) 0%, rgba(0, 15, 40, 0.75) 100%);
  border: 1px solid rgba(0, 180, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.panel-header {
  height: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background: linear-gradient(90deg, rgba(0, 100, 200, 0.3), rgba(0, 60, 120, 0.15));
  border-bottom: 1px solid rgba(0, 180, 255, 0.15);
}

.header-title {
  font-size: 13px;
  font-weight: 600;
  color: #e0f0ff;
  letter-spacing: 2px;
  white-space: nowrap;
}

.header-decoration {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(0, 180, 255, 0.5), transparent);
}

.header-decoration.flip {
  background: linear-gradient(270deg, rgba(0, 180, 255, 0.5), transparent);
}

.panel-body {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
