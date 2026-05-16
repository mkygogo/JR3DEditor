<template>
  <div class="editor-form">
    <div class="prop-row">
      <label>标题</label>
      <input type="text" :value="data.title" @input="emit('update', { title: $event.target.value })" />
    </div>
    <div class="prop-row">
      <label>显示头部</label>
      <input type="checkbox" :checked="data.showHeader" @change="emit('update', { showHeader: $event.target.checked })" />
    </div>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, required: true } })
const emit = defineEmits(['update'])
</script>
