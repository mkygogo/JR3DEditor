<template>
  <div class="hud-editor-panel">
    <h3>HUD 覆盖层</h3>

    <!-- 启用 & 编辑模式 -->
    <div class="section">
      <div class="switch-row">
        <label>启用 HUD</label>
        <div class="switch-container">
          <label class="switch">
            <input type="checkbox" :checked="hudConfig.enabled" @change="onToggleEnabled">
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div class="switch-row" v-if="hudConfig.enabled">
        <label>编辑模式</label>
        <div class="switch-container">
          <label class="switch">
            <input type="checkbox" :checked="editMode" @change="hudStore.toggleEditMode()">
            <span class="slider"></span>
          </label>
          <span class="switch-label">{{ editMode ? '编辑中' : '预览' }}</span>
        </div>
      </div>
    </div>

    <template v-if="hudConfig.enabled">
      <!-- 模板 -->
      <div class="section">
        <h4>快速模板</h4>
        <div class="template-grid">
          <div class="template-card" @click="applyTemplate('digital-park')">
            <span class="tpl-icon">🏢</span>
            <span class="tpl-name">数字园区</span>
          </div>
          <div class="template-card" @click="applyTemplate('empty')">
            <span class="tpl-icon">📄</span>
            <span class="tpl-name">空白画布</span>
          </div>
        </div>
      </div>

      <!-- 选中组件属性 -->
      <div class="section" v-if="selectedWidget">
        <h4>组件属性 — {{ selectedWidget.name }}</h4>

        <!-- Tab 切换 -->
        <div class="editor-tabs">
          <button
            v-for="tab in editorTabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >{{ tab.label }}</button>
        </div>

        <!-- 布局 Tab -->
        <div v-show="activeTab === 'layout'" class="tab-content">
          <div class="prop-row">
            <label>名称</label>
            <input type="text" :value="selectedWidget.name" @input="onUpdateField('name', $event.target.value)" />
          </div>
          <div class="prop-row">
            <label>X</label>
            <input type="number" :value="selectedWidget.x" step="0.5" @input="onUpdateField('x', +$event.target.value)" />
            <span class="unit">%</span>
          </div>
          <div class="prop-row">
            <label>Y</label>
            <input type="number" :value="selectedWidget.y" step="0.5" @input="onUpdateField('y', +$event.target.value)" />
            <span class="unit">%</span>
          </div>
          <div class="prop-row">
            <label>宽</label>
            <input type="number" :value="selectedWidget.width" step="0.5" @input="onUpdateField('width', +$event.target.value)" />
            <span class="unit">%</span>
          </div>
          <div class="prop-row">
            <label>高</label>
            <input type="number" :value="selectedWidget.height" step="0.5" @input="onUpdateField('height', +$event.target.value)" />
            <span class="unit">%</span>
          </div>
        </div>

        <!-- 数据 Tab -->
        <div v-show="activeTab === 'data'" class="tab-content">
          <component
            v-if="dataEditorComponent"
            :is="dataEditorComponent"
            :data="selectedWidget.data"
            @update="onDataUpdate"
          />
          <p v-else class="hint">该组件类型无可配置数据</p>
        </div>

        <!-- 样式 Tab -->
        <div v-show="activeTab === 'style'" class="tab-content">
          <div class="prop-row">
            <label>透明度</label>
            <div class="slider-row">
              <input type="range" min="0" max="1" step="0.05"
                :value="selectedWidget.style?.opacity ?? 1"
                @input="onStyleUpdate('opacity', +$event.target.value)" />
              <span class="value">{{ ((selectedWidget.style?.opacity ?? 1) * 100).toFixed(0) }}%</span>
            </div>
          </div>
          <div class="prop-row">
            <label>背景色</label>
            <input type="color" :value="toHex(selectedWidget.style?.background)" @input="onStyleUpdate('background', $event.target.value)" />
          </div>
          <div class="prop-row">
            <label>边框色</label>
            <input type="color" :value="toHex(selectedWidget.style?.borderColor)" @input="onStyleUpdate('borderColor', $event.target.value)" />
          </div>
          <div class="prop-row">
            <label>边框宽</label>
            <div class="slider-row">
              <input type="range" min="0" max="4" step="1"
                :value="selectedWidget.style?.borderWidth ?? 1"
                @input="onStyleUpdate('borderWidth', +$event.target.value)" />
              <span class="value">{{ selectedWidget.style?.borderWidth ?? 1 }}px</span>
            </div>
          </div>
          <div class="prop-row">
            <label>圆角</label>
            <div class="slider-row">
              <input type="range" min="0" max="20" step="1"
                :value="selectedWidget.style?.borderRadius ?? 4"
                @input="onStyleUpdate('borderRadius', +$event.target.value)" />
              <span class="value">{{ selectedWidget.style?.borderRadius ?? 4 }}px</span>
            </div>
          </div>
          <div class="switch-row">
            <label>阴影</label>
            <div class="switch-container">
              <label class="switch">
                <input type="checkbox" :checked="selectedWidget.style?.shadow" @change="onStyleUpdate('shadow', $event.target.checked)" />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- 绑定 Tab -->
        <div v-show="activeTab === 'binding'" class="tab-content">
          <DataBindingEditor :widget="selectedWidget" />
        </div>

        <!-- 动作 Tab -->
        <div v-show="activeTab === 'actions'" class="tab-content">
          <ActionsEditor :widget="selectedWidget" />
        </div>
      </div>

      <!-- 组件面板 -->
      <div class="section" v-if="editMode">
        <h4>添加组件</h4>
        <WidgetPalette />
      </div>

      <!-- 组件列表 -->
      <div class="section">
        <h4>组件列表 <span class="count">{{ widgetCount }}</span></h4>
        <div class="widget-list">
          <div
            v-for="w in hudConfig.widgets"
            :key="w.id"
            class="widget-list-item"
            :class="{ selected: selectedWidgetId === w.id, locked: w.locked }"
            @click="hudStore.selectWidget(w.id)"
          >
            <span class="wl-icon">{{ getIcon(w.type) }}</span>
            <span class="wl-name">{{ w.name }}</span>
            <button class="wl-btn" @click.stop="hudStore.toggleLock(w.id)" :title="w.locked ? '解锁' : '锁定'">
              {{ w.locked ? '🔒' : '🔓' }}
            </button>
            <button class="wl-btn danger" @click.stop="hudStore.removeWidget(w.id)" title="删除">✕</button>
          </div>
          <div v-if="hudConfig.widgets.length === 0" class="empty-msg">暂无组件</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useHudStore } from '../stores/hudStore'
import { WIDGET_TYPES, WIDGET_META } from '../widgets/types.js'
import WidgetPalette from './WidgetPalette.vue'
import DataBindingEditor from './DataBindingEditor.vue'
import ActionsEditor from './ActionsEditor.vue'

// Per-type editors
import TextLabelEditor from '../widgets/editors/TextLabelEditor.vue'
import StatCardEditor from '../widgets/editors/StatCardEditor.vue'
import ProgressBarEditor from '../widgets/editors/ProgressBarEditor.vue'
import GaugeChartEditor from '../widgets/editors/GaugeChartEditor.vue'
import ChartSeriesEditor from '../widgets/editors/ChartSeriesEditor.vue'
import PieChartEditor from '../widgets/editors/PieChartEditor.vue'
import DataTableEditor from '../widgets/editors/DataTableEditor.vue'
import ObjectInfoPanelEditor from '../widgets/editors/ObjectInfoPanelEditor.vue'
import AlertListEditor from '../widgets/editors/AlertListEditor.vue'
import ContainerEditor from '../widgets/editors/ContainerEditor.vue'
import ButtonEditor from '../widgets/editors/ButtonEditor.vue'
import ImageEditor from '../widgets/editors/ImageEditor.vue'
import DividerEditor from '../widgets/editors/DividerEditor.vue'

const hudStore = useHudStore()
const { hudConfig, selectedWidget, selectedWidgetId, editMode, widgetCount } = storeToRefs(hudStore)

const activeTab = ref('layout')

const editorTabs = [
  { id: 'layout', label: '布局' },
  { id: 'data', label: '数据' },
  { id: 'style', label: '样式' },
  { id: 'binding', label: '绑定' },
  { id: 'actions', label: '动作' },
]

const dataEditorMap = {
  [WIDGET_TYPES.TEXT_LABEL]: TextLabelEditor,
  [WIDGET_TYPES.STAT_CARD]: StatCardEditor,
  [WIDGET_TYPES.PROGRESS_BAR]: ProgressBarEditor,
  [WIDGET_TYPES.GAUGE_CHART]: GaugeChartEditor,
  [WIDGET_TYPES.BAR_CHART]: ChartSeriesEditor,
  [WIDGET_TYPES.LINE_CHART]: ChartSeriesEditor,
  [WIDGET_TYPES.PIE_CHART]: PieChartEditor,
  [WIDGET_TYPES.DATA_TABLE]: DataTableEditor,
  [WIDGET_TYPES.OBJECT_INFO_PANEL]: ObjectInfoPanelEditor,
  [WIDGET_TYPES.ALERT_LIST]: AlertListEditor,
  [WIDGET_TYPES.CONTAINER]: ContainerEditor,
  [WIDGET_TYPES.BUTTON]: ButtonEditor,
  [WIDGET_TYPES.IMAGE]: ImageEditor,
  [WIDGET_TYPES.DIVIDER]: DividerEditor,
}

const dataEditorComponent = computed(() => {
  if (!selectedWidget.value) return null
  return dataEditorMap[selectedWidget.value.type] || null
})

function getIcon(type) {
  return WIDGET_META[type]?.icon || '?'
}

function onToggleEnabled(e) {
  hudStore.toggleEnabled(e.target.checked)
  if (e.target.checked) hudStore.toggleEditMode(true)
}

function onUpdateField(field, value) {
  if (!selectedWidget.value) return
  hudStore.updateWidget(selectedWidget.value.id, { [field]: value })
}

function onDataUpdate(updates) {
  if (!selectedWidget.value) return
  hudStore.updateWidgetData(selectedWidget.value.id, updates)
}

function onStyleUpdate(field, value) {
  if (!selectedWidget.value) return
  hudStore.updateWidgetStyle(selectedWidget.value.id, { [field]: value })
}

function applyTemplate(id) {
  if (id === 'empty') {
    hudStore.setHudConfig({ enabled: true, widgets: [] })
    hudStore.toggleEditMode(true)
    return
  }
  // Load digital-park template
  import('../widgets/templates/digital-park.json').then(mod => {
    const tplConfig = mod.default?.hudConfig || mod.default
    if (tplConfig) {
      // Convert old zone-based template to free-position format
      const widgets = convertLegacyWidgets(tplConfig.widgets || [])
      hudStore.setHudConfig({ enabled: true, widgets })
      hudStore.toggleEditMode(true)
    }
  })
}

function convertLegacyWidgets(oldWidgets) {
  // Map old zone-based widgets to free-positioned ones
  let leftY = 5, rightY = 5, topCount = 0
  return oldWidgets.map(w => {
    let x = 10, y = 10, width = 18, height = 15

    // Determine position based on old zone
    if (w.zone === 'top-bar') {
      x = 0; y = 0; width = 100; height = 6
      topCount++
    } else if (w.zone === 'left-panel') {
      x = 1; y = leftY + 7; width = 20; height = 18
      leftY += 20
    } else if (w.zone === 'right-panel') {
      x = 79; y = rightY + 7; width = 20; height = 18
      rightY += 20
    } else if (w.zone === 'center-popup') {
      x = 35; y = 30; width = 30; height = 40
    }

    // Map old type to new type, keep data
    const type = mapLegacyType(w.type)
    return {
      id: w.id || `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      name: w.name || type,
      locked: false,
      x, y, width, height,
      data: w.data || {},
      dataBinding: { type: 'static' },
      style: {
        opacity: 1,
        background: 'rgba(6,30,60,0.85)',
        borderColor: 'rgba(0,212,255,0.4)',
        borderWidth: 1,
        borderRadius: 4,
        shadow: false,
      },
      actions: [],
    }
  }).filter(w => w.type) // Remove unknown types
}

function mapLegacyType(oldType) {
  const map = {
    'top-bar': 'text-label',
    'side-panel': 'container',
    'center-popup': 'container',
    'tab-nav': 'text-label',
    'icon-button': 'button',
    'floor-selector': 'button',
  }
  return map[oldType] || oldType // data types keep same names
}

function toHex(color) {
  if (!color) return '#061e3c'
  if (color.startsWith('#')) return color.length <= 7 ? color : color.slice(0, 7)
  // rough rgba extraction
  const m = color.match(/\d+/g)
  if (m && m.length >= 3) {
    return '#' + [m[0], m[1], m[2]].map(v => (+v).toString(16).padStart(2, '0')).join('')
  }
  return '#061e3c'
}
</script>

<style scoped>
.hud-editor-panel {
  padding: 10px;
  color: #ddd;
  overflow-y: auto;
  height: 100%;
}

h3 {
  font-size: 16px;
  color: #fff;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #444;
}

.section {
  background: #2a2a2a;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

h4 {
  font-size: 12px;
  color: #888;
  font-weight: normal;
  text-transform: uppercase;
  margin: 0 0 8px;
}

.count {
  color: #4CAF50;
  font-variant-numeric: tabular-nums;
}

/* Prop rows */
.prop-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  gap: 6px;
}
.prop-row > label {
  width: 50px;
  font-size: 12px;
  color: #aaa;
  flex-shrink: 0;
}
.prop-row input[type="text"],
.prop-row input[type="number"],
.prop-row select {
  flex: 1;
  background: #333;
  border: 1px solid #444;
  color: #fff;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
}
.prop-row input:focus,
.prop-row select:focus {
  border-color: #0066cc;
  outline: none;
}
.prop-row input[type="color"] {
  width: 32px;
  height: 24px;
  padding: 0;
  border: 1px solid #444;
  background: transparent;
  cursor: pointer;
}
.prop-row input[type="checkbox"] {
  width: 16px;
  height: 16px;
}
.unit {
  font-size: 11px;
  color: #666;
  width: 16px;
}

/* Slider row */
.slider-row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.slider-row input[type="range"] {
  flex: 1;
  accent-color: #0066cc;
}
.slider-row .value {
  min-width: 40px;
  text-align: right;
  font-size: 11px;
  color: #4CAF50;
  font-variant-numeric: tabular-nums;
}

/* Switch */
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.switch-row > label {
  font-size: 12px;
  color: #aaa;
}
.switch-container {
  display: flex;
  align-items: center;
  gap: 6px;
}
.switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 18px;
}
.switch input { opacity: 0; width: 0; height: 0; }
.switch .slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #444;
  border-radius: 18px;
  transition: 0.2s;
}
.switch .slider::before {
  content: '';
  position: absolute;
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background: #fff;
  border-radius: 50%;
  transition: 0.2s;
}
.switch input:checked + .slider { background: #4CAF50; }
.switch input:checked + .slider::before { transform: translateX(18px); }
.switch-label {
  font-size: 11px;
  color: #888;
}

/* Editor tabs */
.editor-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 10px;
  background: #1a1a1a;
  border-radius: 4px;
  padding: 2px;
}
.tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  color: #888;
  font-size: 11px;
  padding: 5px 0;
  cursor: pointer;
  border-radius: 3px;
  transition: 0.15s;
}
.tab-btn:hover { color: #fff; }
.tab-btn.active {
  background: #0066cc;
  color: #fff;
}

/* Template grid */
.template-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.template-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.15s;
}
.template-card:hover {
  border-color: #0066cc;
  background: #3a3a3a;
}
.tpl-icon { font-size: 20px; }
.tpl-name { font-size: 11px; color: #aaa; }

/* Widget list */
.widget-list {
  max-height: 200px;
  overflow-y: auto;
}
.widget-list-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 3px;
  cursor: pointer;
  transition: 0.1s;
}
.widget-list-item:hover { background: #333; }
.widget-list-item.selected { background: rgba(0,102,204,0.3); }
.widget-list-item.locked { opacity: 0.6; }
.wl-icon { font-size: 13px; }
.wl-name { flex: 1; font-size: 12px; color: #ccc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wl-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 11px;
  padding: 2px 4px;
}
.wl-btn:hover { color: #fff; }
.wl-btn.danger:hover { color: #f66; }

.empty-msg {
  color: #666;
  font-size: 12px;
  text-align: center;
  padding: 12px;
}

.hint {
  color: #666;
  font-size: 12px;
  margin: 0;
}

/* Shared editor form styles used by child editors */
:deep(.editor-form) .prop-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  gap: 6px;
}
:deep(.editor-form) .prop-row > label {
  width: 50px;
  font-size: 12px;
  color: #aaa;
  flex-shrink: 0;
}
:deep(.editor-form) input[type="text"],
:deep(.editor-form) input[type="number"],
:deep(.editor-form) select {
  flex: 1;
  background: #333;
  border: 1px solid #444;
  color: #fff;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
}
:deep(.editor-form) input:focus,
:deep(.editor-form) select:focus {
  border-color: #0066cc;
  outline: none;
}
:deep(.editor-form) input[type="color"] {
  width: 32px;
  height: 24px;
  padding: 0;
  border: 1px solid #444;
  background: transparent;
  cursor: pointer;
  flex: none;
}
:deep(.editor-form) input[type="checkbox"] {
  width: 16px;
  height: 16px;
  flex: none;
}
:deep(.editor-form) .icon-input {
  max-width: 50px;
  text-align: center;
}
:deep(.editor-form) .slider-row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
:deep(.editor-form) .slider-row input[type="range"] {
  flex: 1;
  accent-color: #0066cc;
}
:deep(.editor-form) .slider-row .value {
  min-width: 40px;
  text-align: right;
  font-size: 11px;
  color: #4CAF50;
  font-variant-numeric: tabular-nums;
}

/* Sub sections in editors */
:deep(.sub-section) {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #333;
}
:deep(.sub-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
:deep(.sub-header) span {
  font-size: 11px;
  color: #888;
}
:deep(.btn-add) {
  background: #0066cc;
  border: none;
  color: #fff;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}
:deep(.list-item) {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}
:deep(.list-item) .item-label {
  font-size: 11px;
  color: #888;
  width: 40px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:deep(.btn-del) {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 11px;
  padding: 2px 4px;
  flex-shrink: 0;
}
:deep(.btn-del):hover { color: #f66; }
:deep(.list-item-col) {
  margin-bottom: 6px;
}
:deep(.item-row) {
  display: flex;
  align-items: center;
  gap: 4px;
}
:deep(.short-input) { max-width: 60px !important; }
:deep(.num-input) { max-width: 70px !important; }
:deep(.color-input) { width: 28px !important; height: 22px !important; }
:deep(.table-row-editor) {
  padding: 6px;
  background: #1a1a1a;
  border-radius: 3px;
  margin-bottom: 4px;
}
:deep(.row-header) {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}
</style>
