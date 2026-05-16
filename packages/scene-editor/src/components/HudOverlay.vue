<template>
  <div class="hud-overlay" v-if="hudConfig?.enabled">
    <!-- 顶部标题栏区域 -->
    <div class="hud-zone hud-top" v-if="topWidgets.length">
      <WidgetRenderer
        v-for="widget in topWidgets"
        :key="widget.id"
        :widget="widget"
      />
    </div>

    <!-- 左侧面板区域 -->
    <div class="hud-zone hud-left" v-if="leftWidgets.length">
      <WidgetRenderer
        v-for="widget in leftWidgets"
        :key="widget.id"
        :widget="widget"
      />
    </div>

    <!-- 右侧面板区域 -->
    <div class="hud-zone hud-right" v-if="rightWidgets.length">
      <WidgetRenderer
        v-for="widget in rightWidgets"
        :key="widget.id"
        :widget="widget"
      />
    </div>

    <!-- 中央弹出区域 -->
    <div class="hud-zone hud-center" v-if="centerWidgets.length">
      <WidgetRenderer
        v-for="widget in centerWidgets"
        :key="widget.id"
        :widget="widget"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ZONES } from '../widgets/types.js'
import WidgetRenderer from '../widgets/WidgetRenderer.vue'

const props = defineProps({
  hudConfig: {
    type: Object,
    default: null
  }
})

const widgets = computed(() => props.hudConfig?.widgets || [])

const topWidgets = computed(() =>
  widgets.value.filter(w => w.zone === ZONES.TOP_BAR)
)
const leftWidgets = computed(() =>
  widgets.value.filter(w => w.zone === ZONES.LEFT_PANEL)
)
const rightWidgets = computed(() =>
  widgets.value.filter(w => w.zone === ZONES.RIGHT_PANEL)
)
const centerWidgets = computed(() =>
  widgets.value.filter(w => w.zone === ZONES.CENTER_POPUP)
)
</script>

<style scoped>
.hud-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 320px 1fr 320px;
  grid-template-areas:
    "top top top"
    "left center right";
  gap: 0;
  overflow: hidden;
}

.hud-zone {
  pointer-events: auto;
}

/* ── 顶部区域 ── */
.hud-top {
  grid-area: top;
  display: flex;
  justify-content: center;
  z-index: 110;
}

/* ── 左侧面板 ── */
.hud-left {
  grid-area: left;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  overflow-y: auto;
  scrollbar-width: none;
}
.hud-left::-webkit-scrollbar {
  display: none;
}

/* ── 右侧面板 ── */
.hud-right {
  grid-area: right;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  overflow-y: auto;
  scrollbar-width: none;
}
.hud-right::-webkit-scrollbar {
  display: none;
}

/* ── 中央弹出区 ── */
.hud-center {
  grid-area: center;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.hud-center > * {
  pointer-events: auto;
}
</style>
