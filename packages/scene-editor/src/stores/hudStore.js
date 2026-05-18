import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useHudStore = defineStore('hud', () => {
  // ── State ──
  const hudConfig = ref({
    enabled: false,
    widgets: []
  })
  const selectedWidgetId = ref(null)
  const editMode = ref(false)
  const clipboard = ref(null)

  // ── Getters ──
  const selectedWidget = computed(() => {
    if (!selectedWidgetId.value) return null
    return hudConfig.value.widgets.find(w => w.id === selectedWidgetId.value) || null
  })

  const widgetCount = computed(() => hudConfig.value.widgets.length)

  // ── Actions ──
  function setHudConfig(config) {
    hudConfig.value = config || { enabled: false, widgets: [] }
  }

  function toggleEnabled(enabled) {
    hudConfig.value.enabled = enabled
    _sync()
  }

  function toggleEditMode(on) {
    editMode.value = on !== undefined ? on : !editMode.value
  }

  function addWidget(widget) {
    hudConfig.value.widgets.push(widget)
    selectedWidgetId.value = widget.id
    _sync()
  }

  function removeWidget(id) {
    const idx = hudConfig.value.widgets.findIndex(w => w.id === id)
    if (idx === -1) return
    hudConfig.value.widgets.splice(idx, 1)
    if (selectedWidgetId.value === id) selectedWidgetId.value = null
    _sync()
  }

  function updateWidget(id, updates) {
    const w = hudConfig.value.widgets.find(w => w.id === id)
    if (!w) return
    Object.assign(w, updates)
    _sync()
  }

  function updateWidgetData(id, dataUpdates) {
    const w = hudConfig.value.widgets.find(w => w.id === id)
    if (!w) return
    w.data = { ...w.data, ...dataUpdates }
    _sync()
  }

  function updateWidgetStyle(id, styleUpdates) {
    const w = hudConfig.value.widgets.find(w => w.id === id)
    if (!w) return
    w.style = { ...w.style, ...styleUpdates }
    _sync()
  }

  function updateWidgetPosition(id, x, y) {
    const w = hudConfig.value.widgets.find(w => w.id === id)
    if (!w) return
    w.x = x
    w.y = y
    _sync()
  }

  function updateWidgetSize(id, width, height) {
    const w = hudConfig.value.widgets.find(w => w.id === id)
    if (!w) return
    w.width = width
    w.height = height
    _sync()
  }

  function selectWidget(id) {
    selectedWidgetId.value = id
  }

  function clearSelection() {
    selectedWidgetId.value = null
  }

  function duplicateWidget(id) {
    const src = hudConfig.value.widgets.find(w => w.id === id)
    if (!src) return
    const copy = JSON.parse(JSON.stringify(src))
    copy.id = `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    copy.name = src.name + ' 副本'
    copy.x = Math.min(src.x + 2, 90)
    copy.y = Math.min(src.y + 2, 90)
    hudConfig.value.widgets.push(copy)
    selectedWidgetId.value = copy.id
    _sync()
  }

  function moveWidgetOrder(id, direction) {
    const widgets = hudConfig.value.widgets
    const idx = widgets.findIndex(w => w.id === id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= widgets.length) return
    const temp = widgets[idx]
    widgets[idx] = widgets[targetIdx]
    widgets[targetIdx] = temp
    _sync()
  }

  function bringToFront(id) {
    const widgets = hudConfig.value.widgets
    const idx = widgets.findIndex(w => w.id === id)
    if (idx === -1 || idx === widgets.length - 1) return
    const [w] = widgets.splice(idx, 1)
    widgets.push(w)
    _sync()
  }

  function sendToBack(id) {
    const widgets = hudConfig.value.widgets
    const idx = widgets.findIndex(w => w.id === id)
    if (idx <= 0) return
    const [w] = widgets.splice(idx, 1)
    widgets.unshift(w)
    _sync()
  }

  function toggleLock(id) {
    const w = hudConfig.value.widgets.find(w => w.id === id)
    if (!w) return
    w.locked = !w.locked
    _sync()
  }

  function copyWidget(id) {
    const w = hudConfig.value.widgets.find(w => w.id === id)
    if (w) clipboard.value = JSON.parse(JSON.stringify(w))
  }

  function pasteWidget() {
    if (!clipboard.value) return
    const copy = JSON.parse(JSON.stringify(clipboard.value))
    copy.id = `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    copy.name = clipboard.value.name + ' 副本'
    copy.x = Math.min(clipboard.value.x + 3, 85)
    copy.y = Math.min(clipboard.value.y + 3, 85)
    hudConfig.value.widgets.push(copy)
    selectedWidgetId.value = copy.id
    _sync()
  }

  function updateWidgetBinding(id, bindingUpdates) {
    const w = hudConfig.value.widgets.find(w => w.id === id)
    if (!w) return
    w.dataBinding = { ...(w.dataBinding || {}), ...bindingUpdates }
    _sync()
  }

  function updateWidgetActions(id, actions) {
    const w = hudConfig.value.widgets.find(w => w.id === id)
    if (!w) return
    w.actions = Array.isArray(actions) ? actions : []
    _sync()
  }

  function getAvailableObjects() {
    const sm = window.editor?.sceneManager
    if (!sm) return []
    return sm.objects.map(obj => ({
      uuid: obj.uuid,
      name: obj.name || '(unnamed)',
      type: obj.type
    }))
  }

  // Sync to SceneManager for persistence
  function _sync() {
    if (window.editor?.sceneManager) {
      window.editor.sceneManager.hudConfig = JSON.parse(JSON.stringify(hudConfig.value))
    }
  }

  // Restore from SceneManager after scene load
  function restoreFromScene() {
    const sm = window.editor?.sceneManager
    if (sm?.hudConfig) {
      const config = JSON.parse(JSON.stringify(sm.hudConfig))
      // Migrate legacy zone-based widgets to free-position format
      if (config.widgets) {
        let leftY = 5, rightY = 5
        config.widgets = config.widgets.map(w => {
          if (w.x !== undefined && w.y !== undefined && w.width !== undefined && w.height !== undefined) {
            return w // already new format
          }
          // Assign position based on old zone
          let x = 5, y = 10, width = 20, height = 15
          if (w.zone === 'top-bar') {
            x = 0; y = 0; width = 100; height = 6
          } else if (w.zone === 'left-panel') {
            x = 1; y = leftY + 7; width = 22; height = 18
            leftY += 20
          } else if (w.zone === 'right-panel') {
            x = 77; y = rightY + 7; width = 22; height = 18
            rightY += 20
          } else if (w.zone === 'center-popup') {
            x = 30; y = 25; width = 40; height = 50
          }
          return {
            ...w,
            x, y, width, height,
            locked: w.locked ?? false,
            style: w.style || {
              opacity: 1,
              background: 'rgba(6,30,60,0.85)',
              borderColor: 'rgba(0,212,255,0.4)',
              borderWidth: 1,
              borderRadius: 4,
              shadow: false,
            },
            dataBinding: w.dataBinding || { type: 'static' },
            actions: w.actions || [],
          }
        })
      }
      hudConfig.value = config
    }
  }

  return {
    // state
    hudConfig,
    selectedWidgetId,
    editMode,
    clipboard,
    // getters
    selectedWidget,
    widgetCount,
    // actions
    setHudConfig,
    toggleEnabled,
    toggleEditMode,
    addWidget,
    removeWidget,
    updateWidget,
    updateWidgetData,
    updateWidgetStyle,
    updateWidgetPosition,
    updateWidgetSize,
    selectWidget,
    clearSelection,
    duplicateWidget,
    moveWidgetOrder,
    bringToFront,
    sendToBack,
    toggleLock,
    copyWidget,
    pasteWidget,
    updateWidgetBinding,
    updateWidgetActions,
    getAvailableObjects,
    restoreFromScene
  }
})
