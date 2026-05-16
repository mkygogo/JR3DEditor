<template>
  <div class="hud-toolbar" v-if="editMode">
    <div class="toolbar-group">
      <button
        class="tb-btn active"
        @click="hudStore.toggleEditMode(false)"
        title="退出编辑，预览效果"
      >👁️ 预览</button>
    </div>
    <div class="toolbar-sep"></div>
    <div class="toolbar-group" v-if="selectedWidget">
      <button class="tb-btn" @click="align('left')" title="左对齐">⬅</button>
      <button class="tb-btn" @click="align('center-h')" title="水平居中">⬌</button>
      <button class="tb-btn" @click="align('right')" title="右对齐">➡</button>
      <button class="tb-btn" @click="align('top')" title="上对齐">⬆</button>
      <button class="tb-btn" @click="align('center-v')" title="垂直居中">⬍</button>
      <button class="tb-btn" @click="align('bottom')" title="下对齐">⬇</button>
    </div>
    <div class="toolbar-sep" v-if="selectedWidget"></div>
    <div class="toolbar-group" v-if="selectedWidget">
      <button class="tb-btn" @click="hudStore.bringToFront(selectedWidget.id)" title="置顶">⤴</button>
      <button class="tb-btn" @click="hudStore.sendToBack(selectedWidget.id)" title="置底">⤵</button>
      <button class="tb-btn" @click="hudStore.toggleLock(selectedWidget.id)" title="锁定/解锁">
        {{ selectedWidget.locked ? '🔓' : '🔒' }}
      </button>
      <button class="tb-btn" @click="hudStore.duplicateWidget(selectedWidget.id)" title="复制">📋</button>
      <button class="tb-btn danger" @click="hudStore.removeWidget(selectedWidget.id)" title="删除">🗑️</button>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useHudStore } from '../stores/hudStore'

const hudStore = useHudStore()
const { editMode, selectedWidget } = storeToRefs(hudStore)

function align(dir) {
  const w = selectedWidget.value
  if (!w) return
  switch (dir) {
    case 'left': hudStore.updateWidget(w.id, { x: 0 }); break
    case 'right': hudStore.updateWidget(w.id, { x: 100 - w.width }); break
    case 'center-h': hudStore.updateWidget(w.id, { x: (100 - w.width) / 2 }); break
    case 'top': hudStore.updateWidget(w.id, { y: 0 }); break
    case 'bottom': hudStore.updateWidget(w.id, { y: 100 - w.height }); break
    case 'center-v': hudStore.updateWidget(w.id, { y: (100 - w.height) / 2 }); break
  }
}
</script>

<style scoped>
.hud-toolbar {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(26,26,26,0.95);
  border: 1px solid #444;
  border-radius: 6px;
  padding: 4px 8px;
  z-index: 9100;
  backdrop-filter: blur(8px);
}

.toolbar-group {
  display: flex;
  gap: 2px;
}

.toolbar-sep {
  width: 1px;
  height: 20px;
  background: #444;
  margin: 0 4px;
}

.tb-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #ccc;
  padding: 3px 6px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}
.tb-btn:hover {
  background: #333;
  border-color: #555;
  color: #fff;
}
.tb-btn.active {
  background: #0066cc;
  color: #fff;
}
.tb-btn.danger:hover {
  background: #cc3333;
}
</style>
