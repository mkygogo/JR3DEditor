<template>
  <div class="hud-data-table">
    <div class="table-title" v-if="data.title">{{ data.title }}</div>
    <div class="table-header" v-if="data.columns">
      <span class="col col-icon"></span>
      <span class="col" v-for="(col, i) in data.columns" :key="i">{{ col }}</span>
    </div>
    <div class="table-rows">
      <div class="table-row" v-for="(row, i) in data.rows" :key="i">
        <span class="col col-icon">{{ row.icon }}</span>
        <span class="col" v-for="(val, j) in row.values" :key="j">{{ val }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: { type: Object, required: true },
  styleConfig: { type: Object, default: () => ({}) }
})
</script>

<style scoped>
.hud-data-table {
  padding: 4px 0;
}

.table-title {
  font-size: 11px;
  color: rgba(180, 220, 255, 0.6);
  margin-bottom: 4px;
}

.table-header {
  display: flex;
  padding: 4px 6px;
  background: rgba(0, 60, 120, 0.2);
  border-bottom: 1px solid rgba(0, 180, 255, 0.1);
}

.table-header .col {
  font-size: 10px;
  color: rgba(180, 220, 255, 0.5);
  flex: 1;
  text-align: center;
}

.table-row {
  display: flex;
  padding: 5px 6px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.06);
  transition: background 0.2s;
}

.table-row:hover {
  background: rgba(0, 100, 200, 0.1);
}

.col {
  flex: 1;
  font-size: 12px;
  color: rgba(180, 220, 255, 0.8);
  text-align: center;
}

.col-icon {
  flex: 0 0 28px;
  text-align: center;
}
</style>
