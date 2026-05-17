<template>
  <div class="path-selector">
    <label>{{ label }}</label>
    <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
      <option value="">-- 选择属性 --</option>
      <optgroup v-for="(paths, group) in groupedPaths" :key="group" :label="group">
        <option v-for="p in paths" :key="p.path" :value="p.path">
          {{ p.path }} <span v-if="!p.writable">(只读)</span>
        </option>
      </optgroup>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getGroupedPaths } from '@meteor3d/core'

defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '属性路径' },
  writableOnly: { type: Boolean, default: false }
})
defineEmits(['update:modelValue'])

const groupedPaths = computed(() => getGroupedPaths())
</script>

<style scoped>
.path-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.path-selector label {
  font-size: 12px;
  white-space: nowrap;
  min-width: 60px;
}
.path-selector select {
  flex: 1;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 3px 6px;
  font-size: 12px;
}
</style>
