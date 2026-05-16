<template>
  <div class="hud-tab-nav">
    <span
      v-for="(tab, i) in data.tabs"
      :key="i"
      class="nav-tab"
      :class="{ active: i === activeIndex }"
      @click="activeIndex = i"
    >{{ tab }}</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
  styleConfig: { type: Object, default: () => ({}) }
})

const activeIndex = ref(props.data.activeTab ?? 0)

watch(() => props.data.activeTab, (v) => {
  if (v !== undefined) activeIndex.value = v
})
</script>

<style scoped>
.hud-tab-nav {
  display: flex;
  gap: 2px;
}

.nav-tab {
  padding: 5px 18px;
  font-size: 12px;
  color: rgba(180, 220, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(0, 180, 255, 0.1);
  background: rgba(0, 30, 60, 0.4);
  position: relative;
}

.nav-tab:hover {
  color: #e0f0ff;
  background: rgba(0, 60, 120, 0.3);
}

.nav-tab.active {
  color: #00d4ff;
  background: rgba(0, 80, 160, 0.3);
  border-color: rgba(0, 180, 255, 0.4);
  text-shadow: 0 0 8px rgba(0, 180, 255, 0.5);
}

.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 20%;
  right: 20%;
  height: 2px;
  background: #00d4ff;
  box-shadow: 0 0 6px #00d4ff;
}
</style>
