<template>
  <div class="editor-form">
    <div class="prop-row">
      <label>标题</label>
      <input type="text" :value="data.title" @input="emit('update', { title: $event.target.value })" />
    </div>

    <!-- 数据项 -->
    <div class="sub-section">
      <div class="sub-header">
        <span>数据项</span>
        <button class="btn-add" @click="addItem">+</button>
      </div>
      <div v-for="(item, i) in data.data" :key="i" class="list-item-col">
        <div class="item-row">
          <input type="text" :value="item.name" @input="updateItem(i, 'name', $event.target.value)" placeholder="名称" />
          <input type="number" :value="item.value" @input="updateItem(i, 'value', +$event.target.value)" placeholder="值" class="num-input" />
          <button class="btn-del" @click="removeItem(i)">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ data: { type: Object, required: true } })
const emit = defineEmits(['update'])

function addItem() {
  const items = [...(props.data.data || []), { name: '新类别', value: 100 }]
  emit('update', { data: items })
}

function removeItem(i) {
  const items = props.data.data.filter((_, idx) => idx !== i)
  emit('update', { data: items })
}

function updateItem(i, field, val) {
  const items = [...props.data.data]
  items[i] = { ...items[i], [field]: val }
  emit('update', { data: items })
}
</script>
