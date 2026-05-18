<template>
  <div class="data-binding-editor" v-if="widget">
    <h4>数据绑定</h4>

    <!-- Mode -->
    <div class="field-row">
      <label>绑定模式</label>
      <select v-model="binding.mode" @change="onUpdate">
        <option value="static">静态</option>
        <option value="context-selected">跟随选中</option>
        <option value="object-id">指定对象</option>
      </select>
    </div>

    <!-- Object picker for object-id mode -->
    <ObjectPicker
      v-if="binding.mode === 'object-id'"
      v-model="binding.source.objectId"
      label="绑定对象"
      @update:modelValue="onUpdate"
    />

    <!-- Auto custom fields toggle (ObjectInfoPanel only) -->
    <div v-if="widget.type === 'object-info-panel' && binding.mode !== 'static'" class="field-row">
      <label>自动展示自定义属性</label>
      <input type="checkbox" v-model="autoCustomFields" @change="onAutoFieldsToggle" />
    </div>

    <!-- Mappings -->
    <div class="mappings-section">
      <div class="section-header">
        <span>属性映射 ({{ binding.mappings?.length || 0 }})</span>
        <button class="add-btn" @click="addMapping">+</button>
      </div>

      <div v-for="(m, idx) in binding.mappings" :key="m.id || idx" class="mapping-item">
        <div class="mapping-row">
          <PathSelector v-model="m.objectPath" label="源" @update:modelValue="onUpdate" />
        </div>
        <div class="mapping-row">
          <label>目标字段</label>
          <input type="text" v-model="m.widgetField" @change="onUpdate" placeholder="如 value / title" />
        </div>
        <div class="mapping-row">
          <label>变换</label>
          <select v-model="m.transform.id" @change="onUpdate">
            <option value="noop">无</option>
            <option value="number.toFixed">保留小数</option>
            <option value="number.clamp">范围限制</option>
            <option value="number.scale">缩放</option>
            <option value="angle.rad2deg">弧度→角度</option>
            <option value="bool.toLabel">布尔标签</option>
            <option value="string.template">模板字符串</option>
          </select>
        </div>
        <button class="remove-btn" @click="removeMapping(idx)">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useHudStore } from '../stores/hudStore.js'
import { createDefaultMapping } from '@meteor3d/core'
import ObjectPicker from './ObjectPicker.vue'
import PathSelector from './PathSelector.vue'

const hudStore = useHudStore()

const props = defineProps({
  widget: { type: Object, default: null }
})

const binding = reactive({
  mode: 'static',
  source: { objectId: '' },
  mappings: []
})

const autoCustomFields = ref(true)

// Hydrate from widget
watch(() => props.widget, (w) => {
  if (!w) return
  const db = w.dataBinding || {}
  binding.mode = db.mode || 'static'
  binding.source = { objectId: db.source?.objectId || '' }
  binding.mappings = (db.mappings || []).map(m => ({ ...m }))
  autoCustomFields.value = w.data?.autoCustomFields !== false
}, { immediate: true, deep: false })

function onAutoFieldsToggle() {
  if (!props.widget) return
  hudStore.updateWidget(props.widget.id, { data: { ...props.widget.data, autoCustomFields: autoCustomFields.value } })
}

function onUpdate() {
  if (!props.widget) return
  hudStore.updateWidgetBinding(props.widget.id, {
    mode: binding.mode,
    source: { ...binding.source },
    mappings: binding.mappings.map(m => ({ ...m }))
  })
}

function addMapping() {
  binding.mappings.push(createDefaultMapping())
  onUpdate()
}

function removeMapping(idx) {
  binding.mappings.splice(idx, 1)
  onUpdate()
}
</script>

<style scoped>
.data-binding-editor { padding: 8px 0; }
.data-binding-editor h4 { margin: 0 0 8px; font-size: 13px; color: #0df; }
.field-row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.field-row label { font-size: 12px; min-width: 60px; }
.field-row select, .field-row input {
  flex: 1; background: #333; color: #fff; border: 1px solid #555;
  border-radius: 3px; padding: 3px 6px; font-size: 12px;
}
.mappings-section { margin-top: 10px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12px; }
.add-btn { background: #0a5; color: #fff; border: none; border-radius: 3px; cursor: pointer; padding: 2px 8px; }
.mapping-item {
  position: relative; background: #2a2a2a; border: 1px solid #444;
  border-radius: 4px; padding: 8px; margin-bottom: 6px;
}
.mapping-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.mapping-row label { font-size: 11px; min-width: 50px; }
.mapping-row input, .mapping-row select {
  flex: 1; background: #333; color: #fff; border: 1px solid #555;
  border-radius: 3px; padding: 2px 5px; font-size: 11px;
}
.remove-btn {
  position: absolute; top: 4px; right: 4px; background: transparent;
  color: #f55; border: none; cursor: pointer; font-size: 14px;
}
</style>
