<template>
  <div class="editor-form">
    <div class="prop-row">
      <label>标题</label>
      <input type="text" :value="data.title" @input="emit('update', { title: $event.target.value })" />
    </div>
    <div class="prop-row">
      <label>颜色</label>
      <input type="color" :value="data.color || '#00d4ff'" @input="emit('update', { color: $event.target.value })" />
    </div>

    <!-- 类别 -->
    <div class="sub-section">
      <div class="sub-header">
        <span>类别 (X轴)</span>
        <button class="btn-add" @click="addCategory">+</button>
      </div>
      <div v-for="(cat, i) in data.categories" :key="i" class="list-item">
        <input type="text" :value="cat" @input="updateCategory(i, $event.target.value)" />
        <button class="btn-del" @click="removeCategory(i)">✕</button>
      </div>
    </div>

    <!-- 数据 -->
    <div class="sub-section">
      <div class="sub-header">
        <span>数据 ({{ seriesName }})</span>
      </div>
      <div v-for="(val, i) in seriesData" :key="i" class="list-item">
        <span class="item-label">{{ data.categories[i] || i }}</span>
        <input type="number" :value="val" @input="updateSeriesValue(i, +$event.target.value)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ data: { type: Object, required: true } })
const emit = defineEmits(['update'])

const seriesName = computed(() => props.data.series?.[0]?.name || '数据')
const seriesData = computed(() => props.data.series?.[0]?.data || [])

function addCategory() {
  const cats = [...(props.data.categories || []), '新类别']
  const series = [{ ...props.data.series[0], data: [...seriesData.value, 0] }]
  emit('update', { categories: cats, series })
}

function removeCategory(i) {
  const cats = props.data.categories.filter((_, idx) => idx !== i)
  const newData = seriesData.value.filter((_, idx) => idx !== i)
  const series = [{ ...props.data.series[0], data: newData }]
  emit('update', { categories: cats, series })
}

function updateCategory(i, val) {
  const cats = [...props.data.categories]
  cats[i] = val
  emit('update', { categories: cats })
}

function updateSeriesValue(i, val) {
  const newData = [...seriesData.value]
  newData[i] = val
  const series = [{ ...props.data.series[0], data: newData }]
  emit('update', { series })
}
</script>
