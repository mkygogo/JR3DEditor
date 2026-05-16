<template>
  <div class="editor-form">
    <div class="prop-row">
      <label>标签</label>
      <input type="text" :value="data.label" @input="emit('update', { label: $event.target.value })" />
    </div>
    <div class="prop-row">
      <label>图标</label>
      <input type="text" :value="data.icon" @input="emit('update', { icon: $event.target.value })" class="icon-input" />
    </div>
    <div class="prop-row">
      <label>数值</label>
      <input type="number" :value="data.value" @input="emit('update', { value: +$event.target.value })" />
    </div>
    <div class="prop-row">
      <label>单位</label>
      <input type="text" :value="data.unit" @input="emit('update', { unit: $event.target.value })" />
    </div>
    <div class="prop-row">
      <label>颜色</label>
      <input type="color" :value="data.color || '#00d4ff'" @input="emit('update', { color: $event.target.value })" />
    </div>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, required: true } })
const emit = defineEmits(['update'])
</script>
