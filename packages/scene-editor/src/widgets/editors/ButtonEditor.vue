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
      <label>样式</label>
      <select :value="data.variant || 'default'" @change="emit('update', { variant: $event.target.value })">
        <option value="default">默认</option>
        <option value="primary">主要</option>
        <option value="danger">危险</option>
      </select>
    </div>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, required: true } })
const emit = defineEmits(['update'])
</script>
