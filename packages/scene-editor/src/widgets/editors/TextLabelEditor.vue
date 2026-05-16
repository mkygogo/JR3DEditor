<template>
  <div class="editor-form">
    <div class="prop-row">
      <label>文本内容</label>
      <input type="text" :value="data.text" @input="emit('update', { text: $event.target.value })" />
    </div>
    <div class="prop-row">
      <label>字号</label>
      <div class="slider-row">
        <input type="range" min="10" max="72" :value="data.fontSize || 16" @input="emit('update', { fontSize: +$event.target.value })" />
        <span class="value">{{ data.fontSize || 16 }}px</span>
      </div>
    </div>
    <div class="prop-row">
      <label>颜色</label>
      <input type="color" :value="data.color || '#ffffff'" @input="emit('update', { color: $event.target.value })" />
    </div>
    <div class="prop-row">
      <label>对齐</label>
      <select :value="data.textAlign || 'center'" @change="emit('update', { textAlign: $event.target.value })">
        <option value="left">左对齐</option>
        <option value="center">居中</option>
        <option value="right">右对齐</option>
      </select>
    </div>
    <div class="prop-row">
      <label>字重</label>
      <select :value="data.fontWeight || 'normal'" @change="emit('update', { fontWeight: $event.target.value })">
        <option value="normal">普通</option>
        <option value="bold">加粗</option>
        <option value="lighter">细体</option>
      </select>
    </div>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, required: true } })
const emit = defineEmits(['update'])
</script>
