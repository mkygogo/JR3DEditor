<template>
  <div class="editor-form">
    <div class="prop-row">
      <label>标题</label>
      <input type="text" :value="data.title" @input="emit('update', { title: $event.target.value })" />
    </div>
    <div class="prop-row">
      <label>空状态</label>
      <input type="text" :value="data.emptyText" @input="emit('update', { emptyText: $event.target.value })" />
    </div>

    <div class="sub-section">
      <div class="sub-header">
        <span>显示字段</span>
        <button class="btn-add" @click="addField">+</button>
      </div>

      <div v-for="(field, index) in fields" :key="index" class="field-editor">
        <div class="row-header">
          <span class="field-index">字段 {{ index + 1 }}</span>
          <button class="btn-del" @click="removeField(index)">×</button>
        </div>
        <div class="prop-row compact">
          <label>名称</label>
          <input type="text" :value="field.label" @input="updateField(index, 'label', $event.target.value)" />
        </div>
        <div class="prop-row compact">
          <label>默认值</label>
          <input type="text" :value="field.value" @input="updateField(index, 'value', $event.target.value)" />
        </div>
        <div class="binding-target">绑定目标：data.fields.{{ index }}.value</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ data: { type: Object, required: true } })
const emit = defineEmits(['update'])

const fields = computed(() => Array.isArray(props.data.fields) ? props.data.fields : [])

function addField() {
  emit('update', {
    fields: [...fields.value, { label: '新字段', value: '-', path: 'name' }]
  })
}

function removeField(index) {
  emit('update', { fields: fields.value.filter((_, i) => i !== index) })
}

function updateField(index, key, value) {
  const next = fields.value.map((field, i) => i === index ? { ...field, [key]: value } : field)
  emit('update', { fields: next })
}
</script>

<style scoped>
.editor-form { display: flex; flex-direction: column; gap: 8px; }
.prop-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.prop-row label {
  min-width: 48px;
  color: #aaa;
  font-size: 12px;
}
.prop-row input {
  flex: 1;
  min-width: 0;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 4px 6px;
  font-size: 12px;
}
.sub-section { margin-top: 4px; }
.sub-header, .row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  color: #aaa;
  font-size: 12px;
}
.btn-add {
  background: #0676d8;
  color: #fff;
  border: 0;
  border-radius: 3px;
  width: 22px;
  height: 22px;
  cursor: pointer;
}
.btn-del {
  background: transparent;
  color: #f66;
  border: 0;
  cursor: pointer;
  font-size: 15px;
}
.field-editor {
  background: #202020;
  border: 1px solid #383838;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
}
.compact { margin-bottom: 5px; }
.field-index { color: #ddd; }
.binding-target {
  margin-top: 6px;
  padding: 4px 6px;
  border-radius: 3px;
  background: rgba(0, 118, 216, 0.12);
  color: #8ecbff;
  font-size: 11px;
  overflow-wrap: anywhere;
}
</style>
