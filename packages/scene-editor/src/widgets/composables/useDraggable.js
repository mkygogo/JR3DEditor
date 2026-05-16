import { ref, onUnmounted } from 'vue'

/**
 * useDraggable — 拖拽移动 + 缩放 composable
 * 在 HUD 画布上实现 widget 的自由拖拽和缩放
 *
 * @param {Object} options
 * @param {Function} options.getWidget — 返回当前 widget 对象 (reactive)
 * @param {Function} options.onUpdate — (id, { x, y, width, height }) 回调
 * @param {Function} options.getCanvasRect — 返回画布 DOM 的 getBoundingClientRect
 */
export function useDraggable(options) {
  const { getWidget, onUpdate, getCanvasRect } = options

  const isDragging = ref(false)
  const isResizing = ref(false)
  const resizeHandle = ref(null) // 'nw','n','ne','e','se','s','sw','w'

  let startX = 0, startY = 0
  let startWidgetX = 0, startWidgetY = 0
  let startWidgetW = 0, startWidgetH = 0

  function onPointerDownMove(e) {
    const w = getWidget()
    if (!w || w.locked) return
    e.stopPropagation()
    e.preventDefault()

    isDragging.value = true
    startX = e.clientX
    startY = e.clientY
    startWidgetX = w.x
    startWidgetY = w.y

    document.addEventListener('pointermove', onDragMove)
    document.addEventListener('pointerup', onDragEnd)
  }

  function onDragMove(e) {
    const rect = getCanvasRect()
    if (!rect) return

    const dx = ((e.clientX - startX) / rect.width) * 100
    const dy = ((e.clientY - startY) / rect.height) * 100

    const w = getWidget()
    let newX = clamp(startWidgetX + dx, 0, 100 - w.width)
    let newY = clamp(startWidgetY + dy, 0, 100 - w.height)

    // 边缘吸附 (1% threshold)
    newX = snap(newX, [0, 50 - w.width / 2, 100 - w.width], 1)
    newY = snap(newY, [0, 50 - w.height / 2, 100 - w.height], 1)

    onUpdate(w.id, { x: round2(newX), y: round2(newY) })
  }

  function onDragEnd() {
    isDragging.value = false
    document.removeEventListener('pointermove', onDragMove)
    document.removeEventListener('pointerup', onDragEnd)
  }

  function onPointerDownResize(e, handle) {
    const w = getWidget()
    if (!w || w.locked) return
    e.stopPropagation()
    e.preventDefault()

    isResizing.value = true
    resizeHandle.value = handle
    startX = e.clientX
    startY = e.clientY
    startWidgetX = w.x
    startWidgetY = w.y
    startWidgetW = w.width
    startWidgetH = w.height

    document.addEventListener('pointermove', onResizeMove)
    document.addEventListener('pointerup', onResizeEnd)
  }

  function onResizeMove(e) {
    const rect = getCanvasRect()
    if (!rect) return

    const dx = ((e.clientX - startX) / rect.width) * 100
    const dy = ((e.clientY - startY) / rect.height) * 100
    const h = resizeHandle.value
    const w = getWidget()

    let newX = startWidgetX, newY = startWidgetY
    let newW = startWidgetW, newH = startWidgetH
    const MIN = 3 // minimum 3%

    // Horizontal
    if (h.includes('w')) {
      newW = Math.max(MIN, startWidgetW - dx)
      newX = startWidgetX + startWidgetW - newW
      if (newX < 0) { newW += newX; newX = 0 }
    } else if (h.includes('e')) {
      newW = Math.max(MIN, startWidgetW + dx)
      if (newX + newW > 100) newW = 100 - newX
    }

    // Vertical
    if (h.includes('n')) {
      newH = Math.max(MIN, startWidgetH - dy)
      newY = startWidgetY + startWidgetH - newH
      if (newY < 0) { newH += newY; newY = 0 }
    } else if (h.includes('s')) {
      newH = Math.max(MIN, startWidgetH + dy)
      if (newY + newH > 100) newH = 100 - newY
    }

    onUpdate(w.id, {
      x: round2(newX),
      y: round2(newY),
      width: round2(newW),
      height: round2(newH)
    })
  }

  function onResizeEnd() {
    isResizing.value = false
    resizeHandle.value = null
    document.removeEventListener('pointermove', onResizeMove)
    document.removeEventListener('pointerup', onResizeEnd)
  }

  // Cleanup
  onUnmounted(() => {
    document.removeEventListener('pointermove', onDragMove)
    document.removeEventListener('pointerup', onDragEnd)
    document.removeEventListener('pointermove', onResizeMove)
    document.removeEventListener('pointerup', onResizeEnd)
  })

  return {
    isDragging,
    isResizing,
    onPointerDownMove,
    onPointerDownResize,
  }
}

// ── Helpers ──
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }
function round2(v) { return Math.round(v * 100) / 100 }
function snap(v, targets, threshold) {
  for (const t of targets) {
    if (Math.abs(v - t) < threshold) return t
  }
  return v
}
