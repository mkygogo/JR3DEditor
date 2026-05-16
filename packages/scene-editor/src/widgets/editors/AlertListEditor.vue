<template>
  <div class="editor-form">
    <div class="prop-row">
      <label>标题</label>
      <input type="text" :value="data.title" @input="emit('update', { title: $event.target.value })" />
    </div>

    <div class="sub-section">
      <div class="sub-header">
        <span>告警项</span>
        <button class="btn-add" @click="addItem">+</button>
      </div>
      <div v-for="(item, i) in data.items" :key="i" class="list-item-col">
        <div class="item-row">
          <input type="text" :value="item.label" @input="updateItem(i, 'label', $event.target.value)" placeholder="标签" />
          <input type="text" :value="item.value" @input="updateItem(i, 'value', $event.target.value)" placeholder="值" class="short-input" />
          <input type="color" :value="item.color || '#00d4ff'" @input="updateItem(i, 'color', $event.target.value)" class="color-input" />
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
  const items = [...(props.data.items || []), { label: '新项', value: '0', color: '#00d4ff' }]
  emit('update', { items })
}

function removeItem(i) {
  const items = props.data.items.filter((_, idx) => idx !== i)
  emit('update', { items })
}

function updateItem(i, field, val) {
  const items = [...props.data.items]
  items[i] = { ...items[i], [field]: val }
  emit('update', { items })
}
</script>
