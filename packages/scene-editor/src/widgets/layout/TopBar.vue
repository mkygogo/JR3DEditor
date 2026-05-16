<template>
  <div class="hud-topbar">
    <div class="topbar-left">
      <div class="topbar-decoration left-dec"></div>
    </div>
    <div class="topbar-center">
      <div class="topbar-tabs">
        <span
          v-for="(tab, i) in data.tabs"
          :key="i"
          class="topbar-tab"
          :class="{ active: i === data.activeTab }"
        >{{ tab }}</span>
      </div>
      <div class="topbar-title">{{ data.title }}</div>
      <div class="topbar-info" v-if="data.showTime">
        <span class="topbar-time">{{ currentTime }}</span>
      </div>
    </div>
    <div class="topbar-right">
      <div class="topbar-decoration right-dec"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineProps({
  data: { type: Object, required: true },
  styleConfig: { type: Object, default: () => ({}) }
})

const currentTime = ref('')
let timer = null

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.hud-topbar {
  width: 100%;
  height: 72px;
  display: flex;
  align-items: center;
  background: linear-gradient(180deg, rgba(0, 20, 50, 0.95) 0%, rgba(0, 15, 40, 0.75) 100%);
  border-bottom: 1px solid rgba(0, 180, 255, 0.3);
  position: relative;
}

.hud-topbar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.6), transparent);
}

.topbar-left,
.topbar-right {
  width: 120px;
  flex-shrink: 0;
}

.topbar-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.topbar-title {
  font-size: 20px;
  font-weight: 700;
  color: #e0f0ff;
  letter-spacing: 6px;
  text-shadow: 0 0 20px rgba(0, 180, 255, 0.5);
}

.topbar-tabs {
  display: flex;
  gap: 4px;
}

.topbar-tab {
  padding: 3px 16px;
  font-size: 12px;
  color: rgba(180, 220, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
  position: relative;
}

.topbar-tab:hover {
  color: #e0f0ff;
}

.topbar-tab.active {
  color: #00d4ff;
  border-color: rgba(0, 180, 255, 0.4);
  background: rgba(0, 120, 255, 0.15);
  text-shadow: 0 0 8px rgba(0, 180, 255, 0.5);
}

.topbar-info {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.topbar-time {
  font-size: 12px;
  color: rgba(180, 220, 255, 0.6);
  font-family: 'Courier New', monospace;
}

.topbar-decoration {
  height: 2px;
  margin-top: 50px;
  background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.4));
}

.right-dec {
  background: linear-gradient(270deg, transparent, rgba(0, 180, 255, 0.4));
}
</style>
