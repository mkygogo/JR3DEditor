<template>
  <div class="widget-palette">
    <div v-for="(cat, key) in WIDGET_CATEGORIES" :key="key" class="palette-category">
      <div class="cat-label">{{ cat.label }}</div>
      <div class="cat-items">
        <div
          v-for="t in cat.types"
          :key="t"
          class="palette-item"
          draggable="true"
          @dragstart="onDragStart($event, t)"
          @dblclick="onAdd(t)"
          :title="WIDGET_META[t].label + ' (双击添加)'"
        >
          <span class="item-icon">{{ WIDGET_META[t].icon }}</span>
          <span class="item-label">{{ WIDGET_META[t].label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { WIDGET_CATEGORIES, WIDGET_META, createWidget } from '../widgets/types.js'
import { useHudStore } from '../stores/hudStore'

const hudStore = useHudStore()

function onAdd(type) {
  const w = createWidget(type, {
    x: 20 + Math.random() * 30,
    y: 20 + Math.random() * 30,
  })
  hudStore.addWidget(w)
}

function onDragStart(e, type) {
  e.dataTransfer.setData('widget-type', type)
  e.dataTransfer.effectAllowed = 'copy'
}
</script>

<style scoped>
.widget-palette {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cat-label {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.cat-items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: #2a2a2a;
  border: 1px solid #333;
  border-radius: 4px;
  cursor: grab;
  user-select: none;
  transition: border-color 0.15s, background 0.15s;
}

.palette-item:hover {
  border-color: #0066cc;
  background: #333;
}

.palette-item:active {
  cursor: grabbing;
}

.item-icon { font-size: 14px; }
.item-label { font-size: 11px; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
