<template>
  <div class="hud-floor-selector">
    <div
      v-for="floor in data.floors"
      :key="floor"
      class="floor-btn"
      :class="{ active: floor === activeFloor }"
      @click="activeFloor = floor"
    >{{ floor }}</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
  styleConfig: { type: Object, default: () => ({}) }
})

const activeFloor = ref(props.data.activeFloor || 'F1')

watch(() => props.data.activeFloor, (v) => {
  if (v) activeFloor.value = v
})
</script>

<style scoped>
.hud-floor-selector {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  background: rgba(0, 20, 50, 0.8);
  border: 1px solid rgba(0, 180, 255, 0.2);
  border-radius: 4px;
}

.floor-btn {
  width: 32px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: rgba(180, 220, 255, 0.6);
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s;
}

.floor-btn:hover {
  color: #e0f0ff;
  background: rgba(0, 80, 160, 0.3);
}

.floor-btn.active {
  color: #00d4ff;
  background: rgba(0, 100, 200, 0.4);
  border: 1px solid rgba(0, 180, 255, 0.4);
  text-shadow: 0 0 6px rgba(0, 180, 255, 0.5);
}
</style>
