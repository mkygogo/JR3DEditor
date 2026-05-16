<template>
  <div class="editor-form">
    <div class="prop-row">
      <label>方向</label>
      <select :value="data.direction || 'horizontal'" @change="emit('update', { direction: $event.target.value })">
        <option value="horizontal">水平</option>
        <option value="vertical">垂直</option>
      </select>
    </div>
    <div class="prop-row">
      <label>颜色</label>
      <input type="color" :value="toHex(data.color)" @input="emit('update', { color: $event.target.value })" />
    </div>
    <div class="prop-row">
      <label>粗细</label>
      <div class="slider-row">
        <input type="range" min="1" max="5" :value="data.thickness || 1" @input="emit('update', { thickness: +$event.target.value })" />
        <span class="value">{{ data.thickness || 1 }}px</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, required: true } })
const emit = defineEmits(['update'])

function toHex(color) {
  if (!color || color.startsWith('#')) return color || '#00d4ff'
  // rough rgba to hex fallback
  return '#00d4ff'
}
</script>
