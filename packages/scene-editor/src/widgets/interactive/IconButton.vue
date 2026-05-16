<template>
  <div class="hud-icon-button" :title="data.label">
    <span class="btn-icon">{{ data.icon }}</span>
  </div>
</template>

<script setup>
defineProps({
  data: { type: Object, required: true },
  styleConfig: { type: Object, default: () => ({}) }
})
</script>

<style scoped>
.hud-icon-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 30, 60, 0.6);
  border: 1px solid rgba(0, 180, 255, 0.2);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.hud-icon-button:hover {
  background: rgba(0, 80, 160, 0.4);
  border-color: rgba(0, 180, 255, 0.5);
  box-shadow: 0 0 8px rgba(0, 180, 255, 0.2);
}

.btn-icon {
  font-size: 18px;
}
</style>
