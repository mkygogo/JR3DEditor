<template>
  <div class="editor-form">
    <div class="prop-row">
      <label>标题</label>
      <input type="text" :value="data.title" @input="emit('update', { title: $event.target.value })" />
    </div>

    <!-- 列头 -->
    <div class="sub-section">
      <div class="sub-header"><span>列头</span></div>
      <div v-for="(col, i) in data.columns" :key="'c'+i" class="list-item">
        <input type="text" :value="col" @input="updateColumn(i, $event.target.value)" />
      </div>
    </div>

    <!-- 行数据 -->
    <div class="sub-section">
      <div class="sub-header">
        <span>行数据</span>
        <button class="btn-add" @click="addRow">+</button>
      </div>
      <div v-for="(row, ri) in data.rows" :key="'r'+ri" class="table-row-editor">
        <div class="row-header">
          <input type="text" :value="row.icon" @input="updateRowField(ri, 'icon', $event.target.value)" class="icon-input" placeholder="图标" />
          <button class="btn-del" @click="removeRow(ri)">✕</button>
        </div>
        <div v-for="(val, vi) in row.values" :key="vi" class="list-item">
          <span class="item-label">{{ data.columns[vi] || vi }}</span>
          <input type="text" :value="val" @input="updateRowValue(ri, vi, $event.target.value)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ data: { type: Object, required: true } })
const emit = defineEmits(['update'])

function updateColumn(i, val) {
  const cols = [...props.data.columns]
  cols[i] = val
  emit('update', { columns: cols })
}

function addRow() {
  const emptyValues = props.data.columns.map(() => '')
  const rows = [...props.data.rows, { icon: '📌', values: emptyValues }]
  emit('update', { rows })
}

function removeRow(i) {
  const rows = props.data.rows.filter((_, idx) => idx !== i)
  emit('update', { rows })
}

function updateRowField(ri, field, val) {
  const rows = [...props.data.rows]
  rows[ri] = { ...rows[ri], [field]: val }
  emit('update', { rows })
}

function updateRowValue(ri, vi, val) {
  const rows = [...props.data.rows]
  const values = [...rows[ri].values]
  values[vi] = val
  rows[ri] = { ...rows[ri], values }
  emit('update', { rows })
}
</script>
