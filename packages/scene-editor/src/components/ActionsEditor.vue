<template>
  <div class="actions-editor" v-if="widget">
    <h4>交互动作</h4>

    <div v-for="(action, idx) in localActions" :key="action.id || idx" class="action-item">
      <div class="action-row">
        <label>触发</label>
        <select v-model="action.trigger" @change="onUpdate">
          <option value="click">点击</option>
          <option value="hover">悬停</option>
          <option value="value-change">值变化</option>
        </select>
      </div>
      <div class="action-row">
        <label>动作</label>
        <select v-model="action.type" @change="onUpdate">
          <option value="highlight-object">高亮对象</option>
          <option value="camera-focus">相机聚焦</option>
          <option value="toggle-visible">切换可见</option>
          <option value="set-property">设置属性</option>
        </select>
      </div>
      <div class="action-row">
        <label>目标</label>
        <select v-model="action.target.mode" @change="onUpdate">
          <option value="bound-object">绑定对象</option>
          <option value="context-selected">当前选中对象</option>
          <option value="object-id">指定对象</option>
        </select>
      </div>
      <ObjectPicker
        v-if="action.target.mode === 'object-id'"
        v-model="action.target.objectId"
        label="对象"
        @update:modelValue="onUpdate"
      />
      <div v-if="action.type === 'set-property'" class="action-row">
        <PathSelector v-model="action.payload.path" label="属性" @update:modelValue="onUpdate" />
      </div>
      <div v-if="action.type === 'set-property'" class="action-row">
        <label>值</label>
        <input type="text" v-model="action.payload.value" @change="onUpdate" />
      </div>
      <button class="remove-btn" @click="removeAction(idx)">✕</button>
    </div>

    <button class="add-btn" @click="addAction">+ 添加动作</button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useHudStore } from '../stores/hudStore.js'
import { createDefaultAction } from '@meteor3d/core'
import ObjectPicker from './ObjectPicker.vue'
import PathSelector from './PathSelector.vue'

const hudStore = useHudStore()

const props = defineProps({
  widget: { type: Object, default: null }
})

const localActions = ref([])

watch(() => props.widget, (w) => {
  if (!w) return
  localActions.value = (w.actions || []).map(a => {
    const cloned = JSON.parse(JSON.stringify(a))
    if (!cloned.target) cloned.target = { mode: 'bound-object', objectId: null }
    // 向后兼容：旧版本默认使用 context-selected，现统一落到绑定对象
    if (cloned.target.mode === 'context-selected' && !cloned.target.objectId) {
      cloned.target.mode = 'bound-object'
    }
    return cloned
  })
}, { immediate: true, deep: false })

function onUpdate() {
  if (!props.widget) return
  hudStore.updateWidgetActions(props.widget.id, localActions.value)
}

function addAction() {
  localActions.value.push(createDefaultAction())
  onUpdate()
}

function removeAction(idx) {
  localActions.value.splice(idx, 1)
  onUpdate()
}
</script>

<style scoped>
.actions-editor { padding: 8px 0; }
.actions-editor h4 { margin: 0 0 8px; font-size: 13px; color: #0df; }
.action-item {
  position: relative; background: #2a2a2a; border: 1px solid #444;
  border-radius: 4px; padding: 8px; margin-bottom: 6px;
}
.action-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.action-row label { font-size: 11px; min-width: 40px; }
.action-row select, .action-row input {
  flex: 1; background: #333; color: #fff; border: 1px solid #555;
  border-radius: 3px; padding: 2px 5px; font-size: 11px;
}
.add-btn { background: #0a5; color: #fff; border: none; border-radius: 3px; cursor: pointer; padding: 4px 10px; font-size: 12px; }
.remove-btn {
  position: absolute; top: 4px; right: 4px; background: transparent;
  color: #f55; border: none; cursor: pointer; font-size: 14px;
}
</style>
