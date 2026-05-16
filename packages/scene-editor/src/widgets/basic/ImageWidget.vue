<template>
  <div class="image-widget">
    <img v-if="data.url" :src="data.url" :style="{ objectFit: data.fit || 'contain' }" />
    <div v-else class="placeholder">🖼️ 图片</div>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, required: true }, styleConfig: Object })
</script>

<style scoped>
.image-widget {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.image-widget img {
  width: 100%;
  height: 100%;
}
.placeholder {
  color: rgba(255,255,255,0.3);
  font-size: 14px;
}
</style>
