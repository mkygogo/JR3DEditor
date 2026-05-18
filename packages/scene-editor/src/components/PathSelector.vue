<template>
  <div class="path-selector">
    <label>{{ label }}</label>
    <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
      <option value="">-- 选择属性 --</option>
      <optgroup v-for="group in visibleGroups" :key="group.group" :label="group.group">
        <option v-for="path in group.paths" :key="path" :value="path">
          {{ getPathLabel(path) }}
        </option>
      </optgroup>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ALLOWED_PATHS, getGroupedPaths } from '@meteor3d/core'
import { useEditorStore } from '../stores/editorStore'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '属性路径' },
  writableOnly: { type: Boolean, default: false }
})
defineEmits(['update:modelValue'])

const editorStore = useEditorStore()
const { selectedObject } = storeToRefs(editorStore)

const pathLabels = {
  name: '对象名称 name',
  visible: '是否可见 visible',
  type: '对象类型 type',
  position: '位置 position',
  'position.x': '位置 X position.x',
  'position.y': '位置 Y position.y',
  'position.z': '位置 Z position.z',
  rotation: '旋转 rotation',
  'rotation.x': '旋转 X rotation.x',
  'rotation.y': '旋转 Y rotation.y',
  'rotation.z': '旋转 Z rotation.z',
  scale: '缩放 scale',
  'scale.x': '缩放 X scale.x',
  'scale.y': '缩放 Y scale.y',
  'scale.z': '缩放 Z scale.z',
}

const customProperties = computed(() => selectedObject.value?.userData?.customProperties || [])

const visibleGroups = computed(() => {
  return getGroupedPaths(customProperties.value)
    .map(group => ({
      ...group,
      paths: group.paths.filter(path => !props.writableOnly || ALLOWED_PATHS[path]?.writable)
    }))
    .filter(group => group.paths.length > 0)
})

function getPathLabel(path) {
  const custom = customProperties.value.find(item => `custom.${item.key}` === path)
  if (custom) return `${custom.label || custom.key} ${path}`
  const suffix = ALLOWED_PATHS[path]?.writable ? '' : ' (只读)'
  return `${pathLabels[path] || path}${suffix}`
}
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
