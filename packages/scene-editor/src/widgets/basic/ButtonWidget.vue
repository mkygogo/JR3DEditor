<template>
  <div class="button-widget" :class="'variant-' + (data.variant || 'default')">
    <span v-if="data.icon" class="btn-icon">{{ data.icon }}</span>
    <span class="btn-label">{{ data.label }}</span>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, required: true }, styleConfig: Object })
</script>

<style scoped>
.button-widget {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  color: #fff;
  font-size: 13px;
  user-select: none;
  transition: filter 0.15s;
}
.button-widget:hover {
  filter: brightness(1.3);
}
.btn-icon { font-size: 16px; }
.variant-primary { background: rgba(0,102,204,0.7) !important; }
.variant-danger { background: rgba(204,51,51,0.7) !important; }
</style>
