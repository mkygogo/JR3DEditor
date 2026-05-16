<template>
  <div class="container-widget">
    <div v-if="data.showHeader" class="container-header">
      <span class="header-decoration"></span>
      <span class="header-title">{{ data.title }}</span>
      <span class="header-decoration right"></span>
    </div>
    <div class="container-body">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, required: true }, styleConfig: Object })
</script>

<style scoped>
.container-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.container-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0,212,255,0.2);
  flex-shrink: 0;
}
.header-decoration {
  width: 3px;
  height: 14px;
  background: linear-gradient(180deg, #00d4ff, transparent);
  border-radius: 1px;
}
.header-decoration.right {
  flex: 1;
  width: auto;
  height: 1px;
  background: linear-gradient(90deg, rgba(0,212,255,0.4), transparent);
}
.header-title {
  color: #00d4ff;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.container-body {
  flex: 1;
  padding: 8px;
  overflow: hidden;
}
</style>
