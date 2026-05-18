/**
 * 动作执行器集合
 * 每个执行器: (sceneManager, targetObject, payload) => { success, error? }
 */

import { ACTION_TYPE, ACTION_ERR } from './constants.js'
import { isPathAllowed, writeObjectPath } from './pathResolver.js'

const executors = new Map()

// ── highlight-object ──
executors.set(ACTION_TYPE.HIGHLIGHT, (sceneManager, object, payload = {}) => {
  if (!object) return { success: false, error: ACTION_ERR.E_TARGET_NOT_FOUND }

  const {
    color = '#ffff00',
    intensity = 0.5,
    durationMs = 2000,
    autoRestore = true,
  } = payload
  const highlightColor = parseInt(color.replace('#', ''), 16)

  // HUD 点击发生在运行态展示页，优先使用轻量材质高亮，避免 OutlinePass 在大场景中触发后处理卡顿。
  if (sceneManager.highlightManager) {
    sceneManager.highlightManager.enable(object, {
      color: highlightColor,
      intensity,
    })

    if (autoRestore && durationMs > 0) {
      setTimeout(() => {
        sceneManager.highlightManager.disable(object)
      }, durationMs)
    }
  } else if (sceneManager.outlineManager) {
    sceneManager.outlineManager.enable(object, {
      color: highlightColor,
      strength: intensity * 6,
    })

    if (autoRestore && durationMs > 0) {
      setTimeout(() => {
        sceneManager.outlineManager.disable(object)
      }, durationMs)
    }
  }

  return { success: true }
})

// ── camera-focus ──
executors.set(ACTION_TYPE.CAMERA_FOCUS, (sceneManager, object, payload = {}) => {
  if (!object) return { success: false, error: ACTION_ERR.E_TARGET_NOT_FOUND }

  const {
    fitPadding = 1.5,
    durationMs = 1000,
    showIfHidden = false,
  } = payload

  // 若不可见且配置了 showIfHidden，临时显示
  const wasHidden = !object.visible
  if (wasHidden && showIfHidden) {
    object.visible = true
  }

  // 使用 SceneManager 的聚焦能力
  if (sceneManager.fitCameraToObject) {
    sceneManager.fitCameraToObject(object, fitPadding, durationMs)
  } else if (sceneManager.fitCameraToScene) {
    // fallback: 聚焦整个场景
    sceneManager.fitCameraToScene()
  }

  return { success: true }
})

// ── toggle-visible ──
executors.set(ACTION_TYPE.TOGGLE_VISIBLE, (sceneManager, object, payload = {}) => {
  if (!object) return { success: false, error: ACTION_ERR.E_TARGET_NOT_FOUND }

  const { strategy = 'toggle' } = payload

  switch (strategy) {
    case 'show':
      object.visible = true
      break
    case 'hide':
      object.visible = false
      break
    case 'toggle':
    default:
      object.visible = !object.visible
      break
  }

  // 触发事件
  if (sceneManager.emit) {
    sceneManager.emit('object:visibility', { object, visible: object.visible })
  }

  return { success: true }
})

// ── set-property ──
executors.set(ACTION_TYPE.SET_PROPERTY, (sceneManager, object, payload = {}, context = {}) => {
  if (!object) return { success: false, error: ACTION_ERR.E_TARGET_NOT_FOUND }

  const { objectPath, value, valueFromWidgetField } = payload

  if (!objectPath || !isPathAllowed(objectPath)) {
    return { success: false, error: ACTION_ERR.E_PAYLOAD_INVALID }
  }

  // 确定写入值：静态值优先，否则从 widget 字段取
  let writeValue = value
  if (writeValue === null && valueFromWidgetField && context.widgetData) {
    writeValue = getNestedValue(context.widgetData, valueFromWidgetField)
  }

  if (writeValue === undefined || writeValue === null) {
    return { success: false, error: ACTION_ERR.E_PAYLOAD_INVALID }
  }

  const result = writeObjectPath(object, objectPath, writeValue)
  if (!result.success) {
    return { success: false, error: ACTION_ERR.E_PAYLOAD_INVALID }
  }

  // 触发变换事件
  if (sceneManager.emit && (objectPath.startsWith('position') || objectPath.startsWith('rotation') || objectPath.startsWith('scale'))) {
    const prop = objectPath.split('.')[0]
    sceneManager.emit('object:transform', { object, property: prop })
  }

  return { success: true }
})

/**
 * 执行动作
 * @param {string} actionType - ACTION_TYPE 枚举值
 * @param {object} sceneManager - SceneManager 实例
 * @param {Object3D|null} targetObject - 目标对象
 * @param {object} payload - 动作参数
 * @param {object} context - 上下文（如 widgetData）
 * @returns {{ success: boolean, error?: number }}
 */
export function executeAction(actionType, sceneManager, targetObject, payload, context = {}) {
  const executor = executors.get(actionType)
  if (!executor) {
    return { success: false, error: ACTION_ERR.E_ACTION_TYPE_UNKNOWN }
  }

  try {
    return executor(sceneManager, targetObject, payload, context)
  } catch (err) {
    console.warn(`[ActionExecutor] ${actionType} failed:`, err)
    return { success: false, error: ACTION_ERR.E_ACTION_TIMEOUT }
  }
}

// ── Utils ──
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current == null) return undefined
    current = current[part]
  }
  return current
}
