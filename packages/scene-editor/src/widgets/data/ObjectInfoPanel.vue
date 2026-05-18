<template>
  <div class="object-info-panel">
    <div class="panel-title" v-if="data.title">{{ data.title }}</div>
    <div v-if="fields.length" class="field-list">
      <div v-for="(field, index) in fields" :key="index" class="field-row">
        <span class="field-label">{{ field.label }}</span>
        <span class="field-value">{{ formatValue(field.value) }}</span>
      </div>
    </div>
    <div v-else class="empty-text">{{ data.emptyText || '暂无对象数据' }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
  styleConfig: { type: Object, default: () => ({}) }
})

const fields = computed(() => Array.isArray(props.data.fields) ? props.data.fields : [])

function formatValue(value) {
  if (value === undefined || value === null || value === '') return '-'
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2)
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'object') {
    const parts = ['x', 'y', 'z']
      .filter(key => value[key] !== undefined)
      .map(key => `${key}: ${Number(value[key]).toFixed(2)}`)
    return parts.length ? parts.join('  ') : JSON.stringify(value)
  }
  return String(value)
}
</script>

<style scoped>
.object-info-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  box-sizing: border-box;
  color: rgba(220, 240, 255, 0.92);
}
.panel-title {
  color: #00d4ff;
  font-size: 14px;
  font-weight: 600;
  padding-bottom: 8px;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.22);
}
.field-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: auto;
}
.field-row {
  display: grid;
  grid-template-columns: minmax(56px, 0.42fr) 1fr;
  gap: 8px;
  align-items: center;
  min-height: 24px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(120, 190, 255, 0.08);
}
.field-label {
  color: rgba(180, 220, 255, 0.58);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.field-value {
  color: #fff;
  font-size: 13px;
  text-align: right;
  overflow-wrap: anywhere;
}
.empty-text {
  margin: auto;
  color: rgba(180, 220, 255, 0.5);
  font-size: 12px;
}
</style>
