<template>
  <div class="text-label" :style="textStyle">
    {{ data.text }}
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ data: { type: Object, required: true }, styleConfig: Object })
const textStyle = computed(() => ({
  fontSize: (props.data.fontSize || 16) + 'px',
  color: props.data.color || '#ffffff',
  textAlign: props.data.textAlign || 'center',
  fontWeight: props.data.fontWeight || 'normal',
}))
</script>

<style scoped>
.text-label {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  box-sizing: border-box;
  word-break: break-word;
  line-height: 1.4;
  user-select: none;
}
</style>
