<template>
  <div class="object-picker">
    <label>{{ label }}</label>
    <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
      <option value="">-- 无 --</option>
      <option v-for="obj in objects" :key="obj.uuid" :value="obj.uuid">
        {{ obj.name }} ({{ obj.type }})
      </option>
    </select>
    <button class="pick-btn" title="从场景中拾取" @click="startPick">⊙</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useHudStore } from '../stores/hudStore.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '目标对象' }
})
const emit = defineEmits(['update:modelValue'])

const hudStore = useHudStore()
const objects = ref([])

const refresh = () => { objects.value = hudStore.getAvailableObjects() }
onMounted(refresh)

let picking = false
const startPick = () => {
  picking = true
  const sm = window.editor?.sceneManager
  if (!sm) return
  const handler = ({ object }) => {
    if (object && picking) {
      emit('update:modelValue', object.uuid)
      picking = false
      sm.off('scene-click', handler)
    }
  }
  sm.on('scene-click', handler)
  // auto-cancel after 10s
  setTimeout(() => { picking = false; sm.off('scene-click', handler) }, 10000)
}

// Refresh list when objects change
const onAdded = () => refresh()
const onRemoved = () => refresh()
onMounted(() => {
  window.editor?.sceneManager?.on('object:added', onAdded)
  window.editor?.sceneManager?.on('object:removed', onRemoved)
})
onBeforeUnmount(() => {
  window.editor?.sceneManager?.off('object:added', onAdded)
  window.editor?.sceneManager?.off('object:removed', onRemoved)
})
</script>

<style scoped>
.object-picker {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.object-picker label {
  font-size: 12px;
  white-space: nowrap;
  min-width: 60px;
}
.object-picker select {
  flex: 1;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 3px 6px;
  font-size: 12px;
}
.pick-btn {
  background: #444;
  color: #0df;
  border: 1px solid #555;
  border-radius: 3px;
  cursor: pointer;
  padding: 2px 6px;
  font-size: 14px;
}
.pick-btn:hover { background: #555; }
</style>
