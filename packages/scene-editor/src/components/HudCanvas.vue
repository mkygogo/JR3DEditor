<template>
  <div
    class="hud-canvas"
    :class="{ 'edit-mode': editMode, 'preview-mode': !editMode }"
    ref="canvasRef"
    @pointerdown.self="onCanvasClick"
  >
    <!-- 编辑模式网格 -->
    <div v-if="editMode" class="canvas-grid"></div>

    <!-- Widgets -->
    <div
      v-for="widget in widgets"
      :key="widget.id"
      class="widget-wrapper"
      :class="{
        selected: editMode && selectedWidgetId === widget.id,
        locked: widget.locked,
        'edit-active': editMode,
      }"
      :style="getWidgetStyle(widget)"
      @pointerdown.stop="onWidgetPointerDown($event, widget)"
    >
      <WidgetRenderer :widget="widget" />

      <!-- 编辑模式选中手柄 -->
      <template v-if="editMode && selectedWidgetId === widget.id && !widget.locked">
        <div
          v-for="handle in resizeHandles"
          :key="handle"
          class="resize-handle"
          :class="'handle-' + handle"
          @pointerdown.stop="onResizeStart($event, widget, handle)"
        ></div>
      </template>

      <!-- 锁定图标 -->
      <div v-if="editMode && widget.locked" class="lock-badge">🔒</div>
    </div>

    <!-- 编辑模式空画布提示 -->
    <div v-if="editMode && widgets.length === 0" class="empty-hint">
      <p>从右侧面板添加组件</p>
      <p class="hint-sub">或选择一个预设模板快速开始</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useHudStore } from '../stores/hudStore'
import WidgetRenderer from '../widgets/WidgetRenderer.vue'

const hudStore = useHudStore()
const { hudConfig, selectedWidgetId, editMode } = storeToRefs(hudStore)

const canvasRef = ref(null)

const widgets = computed(() => hudConfig.value?.widgets || [])

const resizeHandles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

// ── Drag state ──
let dragState = null // { type: 'move'|'resize', widgetId, startX, startY, startWx, startWy, startWw, startWh, handle }

function getCanvasRect() {
  return canvasRef.value?.getBoundingClientRect()
}

function getWidgetStyle(w) {
  const s = w.style || {}
  return {
    left: w.x + '%',
    top: w.y + '%',
    width: w.width + '%',
    height: w.height + '%',
    opacity: s.opacity ?? 1,
    background: s.background || 'rgba(6,30,60,0.85)',
    border: `${s.borderWidth || 1}px solid ${s.borderColor || 'rgba(0,212,255,0.4)'}`,
    borderRadius: (s.borderRadius || 4) + 'px',
    boxShadow: s.shadow ? '0 0 20px rgba(0,212,255,0.3)' : 'none',
    zIndex: widgets.value.indexOf(w),
  }
}

function onCanvasClick() {
  if (editMode.value) {
    hudStore.clearSelection()
  }
}

function onWidgetPointerDown(e, widget) {
  if (!editMode.value) return
  e.preventDefault()
  hudStore.selectWidget(widget.id)

  if (widget.locked) return

  dragState = {
    type: 'move',
    widgetId: widget.id,
    startX: e.clientX,
    startY: e.clientY,
    startWx: widget.x,
    startWy: widget.y,
    startWw: widget.width,
    startWh: widget.height,
  }
  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
}

function onResizeStart(e, widget, handle) {
  dragState = {
    type: 'resize',
    handle,
    widgetId: widget.id,
    startX: e.clientX,
    startY: e.clientY,
    startWx: widget.x,
    startWy: widget.y,
    startWw: widget.width,
    startWh: widget.height,
  }
  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e) {
  if (!dragState) return
  const rect = getCanvasRect()
  if (!rect) return

  const dx = ((e.clientX - dragState.startX) / rect.width) * 100
  const dy = ((e.clientY - dragState.startY) / rect.height) * 100

  if (dragState.type === 'move') {
    const w = widgets.value.find(w => w.id === dragState.widgetId)
    if (!w) return
    let newX = clamp(dragState.startWx + dx, 0, 100 - w.width)
    let newY = clamp(dragState.startWy + dy, 0, 100 - w.height)
    // 边缘吸附
    newX = snap(newX, [0, 50 - w.width / 2, 100 - w.width], 1.2)
    newY = snap(newY, [0, 50 - w.height / 2, 100 - w.height], 1.2)
    hudStore.updateWidget(dragState.widgetId, { x: r2(newX), y: r2(newY) })
  } else if (dragState.type === 'resize') {
    applyResize(dx, dy)
  }
}

function applyResize(dx, dy) {
  const h = dragState.handle
  let newX = dragState.startWx, newY = dragState.startWy
  let newW = dragState.startWw, newH = dragState.startWh
  const MIN = 3

  if (h.includes('w')) {
    newW = Math.max(MIN, dragState.startWw - dx)
    newX = dragState.startWx + dragState.startWw - newW
    if (newX < 0) { newW += newX; newX = 0 }
  } else if (h.includes('e')) {
    newW = Math.max(MIN, dragState.startWw + dx)
    if (newX + newW > 100) newW = 100 - newX
  }

  if (h.includes('n')) {
    newH = Math.max(MIN, dragState.startWh - dy)
    newY = dragState.startWy + dragState.startWh - newH
    if (newY < 0) { newH += newY; newY = 0 }
  } else if (h.includes('s')) {
    newH = Math.max(MIN, dragState.startWh + dy)
    if (newY + newH > 100) newH = 100 - newY
  }

  hudStore.updateWidget(dragState.widgetId, {
    x: r2(newX), y: r2(newY), width: r2(newW), height: r2(newH)
  })
}

function onPointerUp() {
  dragState = null
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
}

// ── Keyboard shortcuts ──
function onKeyDown(e) {
  if (!editMode.value || !selectedWidgetId.value) return
  const w = widgets.value.find(w => w.id === selectedWidgetId.value)
  if (!w || w.locked) return

  const step = e.shiftKey ? 5 : 1

  switch (e.key) {
    case 'Delete':
    case 'Backspace':
      // Don't delete if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      hudStore.removeWidget(w.id)
      e.preventDefault()
      break
    case 'ArrowLeft':
      hudStore.updateWidget(w.id, { x: r2(Math.max(0, w.x - step)) })
      e.preventDefault()
      break
    case 'ArrowRight':
      hudStore.updateWidget(w.id, { x: r2(Math.min(100 - w.width, w.x + step)) })
      e.preventDefault()
      break
    case 'ArrowUp':
      hudStore.updateWidget(w.id, { y: r2(Math.max(0, w.y - step)) })
      e.preventDefault()
      break
    case 'ArrowDown':
      hudStore.updateWidget(w.id, { y: r2(Math.min(100 - w.height, w.y + step)) })
      e.preventDefault()
      break
    case 'd':
      if (e.ctrlKey || e.metaKey) {
        hudStore.duplicateWidget(w.id)
        e.preventDefault()
      }
      break
  }
}

onMounted(() => { window.addEventListener('keydown', onKeyDown) })
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
})

// ── Helpers ──
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }
function r2(v) { return Math.round(v * 100) / 100 }
function snap(v, targets, threshold) {
  for (const t of targets) { if (Math.abs(v - t) < threshold) return t }
  return v
}
</script>

<style scoped>
.hud-canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 10;
}

.preview-mode {
  pointer-events: none;
}
.preview-mode .widget-wrapper {
  pointer-events: auto;
}

.edit-mode {
  pointer-events: auto;
  cursor: default;
  z-index: 100;
}

/* 编辑网格 */
.canvas-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px);
  background-size: 5% 5%;
  z-index: 0;
}

/* Widget 容器 */
.widget-wrapper {
  position: absolute;
  overflow: hidden;
  transition: box-shadow 0.15s;
}

.edit-active {
  cursor: move;
}

.edit-active > :not(.resize-handle):not(.lock-badge) {
  pointer-events: none;
}

.edit-active:hover {
  outline: 1px dashed rgba(0,102,204,0.6);
  outline-offset: 1px;
}

.widget-wrapper.selected {
  outline: 2px solid #0066cc !important;
  outline-offset: 1px;
  z-index: 9000 !important;
}

.widget-wrapper.locked {
  cursor: not-allowed;
}
.widget-wrapper.locked:hover {
  outline-color: #666;
}

/* 缩放手柄 */
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1px solid #0066cc;
  border-radius: 1px;
  z-index: 9999;
}
.handle-nw { top: -4px; left: -4px; cursor: nw-resize; }
.handle-n  { top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.handle-ne { top: -4px; right: -4px; cursor: ne-resize; }
.handle-e  { top: 50%; right: -4px; transform: translateY(-50%); cursor: e-resize; }
.handle-se { bottom: -4px; right: -4px; cursor: se-resize; }
.handle-s  { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.handle-sw { bottom: -4px; left: -4px; cursor: sw-resize; }
.handle-w  { top: 50%; left: -4px; transform: translateY(-50%); cursor: w-resize; }

.lock-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 12px;
  opacity: 0.5;
  pointer-events: none;
}

.empty-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgba(255,255,255,0.3);
  pointer-events: none;
}
.empty-hint p { margin: 0; font-size: 16px; }
.empty-hint .hint-sub { font-size: 12px; margin-top: 8px; }
</style>
