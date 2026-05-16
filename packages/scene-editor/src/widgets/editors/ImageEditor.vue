<template>
  <div class="editor-form">
    <div class="prop-row">
      <label>图片URL</label>
      <input type="text" :value="data.url" @input="emit('update', { url: $event.target.value })" placeholder="https://..." />
    </div>
    <div class="prop-row">
      <label>填充方式</label>
      <select :value="data.fit || 'contain'" @change="emit('update', { fit: $event.target.value })">
        <option value="contain">等比包含</option>
        <option value="cover">等比覆盖</option>
        <option value="fill">拉伸填充</option>
      </select>
    </div>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, required: true } })
const emit = defineEmits(['update'])
</script>
