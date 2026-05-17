/**
 * BindingManager — 数据绑定运行时引擎
 * 负责对象属性与 HUD 组件间的读写同步、动作执行
 * Editor 与 Portal 共用
 */

import {
  BINDING_MODE,
  BINDING_STATUS,
  MAPPING_DIRECTION,
  TARGET_MODE,
  BINDING_ERR,
  ACTION_ERR,
  createDefaultDataBinding,
} from './constants.js'
import { readObjectPath, writeObjectPath, isPathAllowed, isPathWritable } from './pathResolver.js'
import { applyTransform, applyInverseTransform } from './transformRegistry.js'
import { executeAction } from './actionExecutors.js'

export class BindingManager {
  /**
   * @param {object} options
   * @param {object} options.sceneManager - SceneManager 实例
   * @param {Function} options.hudConfigProvider - () => hudConfig
   * @param {Function} options.selectionProvider - () => Object3D | null
   * @param {Function} options.objectResolver - (objectId) => Object3D | null
   * @param {boolean} [options.allowWriteBack=true] - 是否允许写回（Portal 默认 false）
   * @param {Function} [options.onEvent] - 事件回调 (eventType, payload) => void
   */
  constructor(options) {
    this.sceneManager = options.sceneManager
    this.hudConfigProvider = options.hudConfigProvider
    this.selectionProvider = options.selectionProvider
    this.objectResolver = options.objectResolver
    this.allowWriteBack = options.allowWriteBack !== false
    this.onEvent = options.onEvent || null

    // 内部状态
    this._widgetBindings = new Map() // widgetId -> WidgetBindingState
    this._running = false
    this._listeners = []
    this._lastContextObjectId = null

    // Debounce 管理
    this._debounceTimers = new Map()
  }

  // ==================== 生命周期 ====================

  start() {
    if (this._running) return
    this._running = true

    // 解析所有 widget 绑定
    this.rebindAll()

    // 监听 SceneManager 事件
    this._registerListeners()

    // 首次同步
    this._syncAllReads()

    this._emitEvent('binding:started', {})
  }

  stop() {
    if (!this._running) return
    this._running = false

    this._unregisterListeners()
    this._widgetBindings.clear()
    this._clearAllDebounce()

    this._emitEvent('binding:stopped', {})
  }

  dispose() {
    this.stop()
    this.sceneManager = null
    this.hudConfigProvider = null
    this.selectionProvider = null
    this.objectResolver = null
  }

  // ==================== 绑定操作 ====================

  rebindAll() {
    this._widgetBindings.clear()
    const config = this.hudConfigProvider()
    if (!config || !config.widgets) return new Map()

    for (const widget of config.widgets) {
      this._resolveWidget(widget)
    }

    return this.getAllStatuses()
  }

  rebindWidget(widgetId) {
    const config = this.hudConfigProvider()
    if (!config || !config.widgets) return BINDING_STATUS.ERROR

    const widget = config.widgets.find(w => w.id === widgetId)
    if (!widget) return BINDING_STATUS.ERROR

    this._resolveWidget(widget)
    this._syncWidgetRead(widgetId)

    return this.getWidgetStatus(widgetId)
  }

  // ==================== 读同步 ====================

  syncRead(widgetId, mappingId) {
    const state = this._widgetBindings.get(widgetId)
    if (!state) return

    if (mappingId) {
      this._syncSingleMapping(state, mappingId)
    } else {
      this._syncWidgetRead(widgetId)
    }
  }

  // ==================== 写同步 ====================

  applyWidgetInput(widgetId, patch) {
    const result = { success: true, applied: [], rejected: [], errors: [] }

    if (!this.allowWriteBack) {
      result.success = false
      result.errors.push({ code: BINDING_ERR.E_WRITE_DENIED, message: 'Write-back disabled' })
      return result
    }

    const state = this._widgetBindings.get(widgetId)
    if (!state || !state.resolvedObject) {
      result.success = false
      result.errors.push({ code: BINDING_ERR.E_NO_OBJECT, message: 'No resolved object' })
      return result
    }

    for (const [widgetField, value] of Object.entries(patch)) {
      // 查找该 widgetField 的 write/both 映射
      const mapping = this._findWriteMapping(state, widgetField)
      if (!mapping) {
        result.rejected.push(widgetField)
        continue
      }

      // 应用 write transform
      let writeValue = value
      if (mapping.transform?.write?.id) {
        const transformed = applyTransform(mapping.transform.write.id, value, mapping.transform.write.params)
        if (transformed.success) {
          writeValue = transformed.value
        } else {
          result.errors.push({ code: BINDING_ERR.E_TRANSFORM_FAIL, message: `Transform failed for ${widgetField}` })
          result.rejected.push(widgetField)
          continue
        }
      }

      // 写入对象
      const writeResult = writeObjectPath(state.resolvedObject, mapping.objectPath, writeValue)
      if (writeResult.success) {
        result.applied.push(widgetField)
        this._emitEvent('binding:value-updated', {
          widgetId,
          mappingId: mapping.id,
          widgetField,
          objectPath: mapping.objectPath,
          oldValue: mapping.currentValue,
          newValue: writeValue,
          direction: 'write',
        })
        mapping.currentValue = writeValue

        // 触发对象变换事件
        if (this.sceneManager?.emit) {
          const prop = mapping.objectPath.split('.')[0]
          if (['position', 'rotation', 'scale'].includes(prop)) {
            this.sceneManager.emit('object:transform', { object: state.resolvedObject, property: prop })
          }
        }
      } else {
        result.rejected.push(widgetField)
        result.errors.push({ code: writeResult.error, message: `Write failed: ${mapping.objectPath}` })
      }
    }

    result.success = result.errors.length === 0
    return result
  }

  // ==================== 动作 ====================

  dispatchWidgetTrigger(widgetId, trigger, eventData) {
    const results = []
    const config = this.hudConfigProvider()
    if (!config || !config.widgets) return results

    const widget = config.widgets.find(w => w.id === widgetId)
    if (!widget || !widget.actions) return results

    const matchingActions = widget.actions.filter(a => a.enabled && a.trigger === trigger)

    for (const action of matchingActions) {
      const targetObject = this._resolveActionTarget(action, widgetId)
      const actionResult = executeAction(
        action.type,
        this.sceneManager,
        targetObject,
        action.payload || {},
        { widgetData: widget.data, eventData }
      )

      results.push({ actionId: action.id, ...actionResult })

      this._emitEvent(actionResult.success ? 'action:executed' : 'action:failed', {
        widgetId,
        actionId: action.id,
        actionType: action.type,
        trigger,
        targetObjectId: targetObject?.uuid || null,
        error: actionResult.error,
      })
    }

    return results
  }

  // ==================== 校验 ====================

  validateConfig(hudConfig) {
    const errors = []
    const warnings = []

    if (!hudConfig || !hudConfig.widgets) {
      errors.push({ widgetId: null, field: 'widgets', code: 3001, message: 'hudConfig.widgets missing' })
      return { valid: false, errors, warnings }
    }

    for (const widget of hudConfig.widgets) {
      const binding = widget.dataBinding || createDefaultDataBinding()

      // 检查 object-id 模式需要 objectId
      if (binding.mode === BINDING_MODE.OBJECT_ID && !binding.source?.objectId) {
        errors.push({ widgetId: widget.id, field: 'dataBinding.source.objectId', code: 3003, message: 'object-id mode requires objectId' })
      }

      // 检查映射路径
      if (binding.mappings) {
        const writeFields = new Set()
        for (const m of binding.mappings) {
          if (!isPathAllowed(m.objectPath)) {
            errors.push({ widgetId: widget.id, field: `mapping.${m.id}.objectPath`, code: 1002, message: `Invalid path: ${m.objectPath}` })
          }
          if ((m.direction === 'write' || m.direction === 'both') && !isPathWritable(m.objectPath)) {
            errors.push({ widgetId: widget.id, field: `mapping.${m.id}.direction`, code: 1005, message: `Path not writable: ${m.objectPath}` })
          }
          // 重复写入检测
          if (m.direction === 'write' || m.direction === 'both') {
            if (writeFields.has(m.widgetField)) {
              warnings.push({ widgetId: widget.id, field: `mapping.${m.id}`, code: 3002, message: `Duplicate write target: ${m.widgetField}` })
            }
            writeFields.add(m.widgetField)
          }
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  // ==================== 查询 ====================

  getWidgetStatus(widgetId) {
    const state = this._widgetBindings.get(widgetId)
    return state ? state.status : BINDING_STATUS.ERROR
  }

  getWidgetRuntimeData(widgetId) {
    const config = this.hudConfigProvider()
    if (!config || !config.widgets) return null

    const widget = config.widgets.find(w => w.id === widgetId)
    if (!widget) return null

    // 返回 data 的深拷贝，由 binding 覆盖后的值
    const state = this._widgetBindings.get(widgetId)
    if (!state) return { ...widget.data }

    const runtimeData = { ...widget.data }
    for (const [, mState] of state.mappingStates) {
      if (mState.currentValue !== undefined && mState.status !== BINDING_STATUS.ERROR) {
        setNestedValue(runtimeData, mState.widgetField, mState.currentValue)
      }
    }
    return runtimeData
  }

  getAllStatuses() {
    const result = new Map()
    for (const [id, state] of this._widgetBindings) {
      result.set(id, state.status)
    }
    return result
  }

  // ==================== 私有方法 ====================

  _resolveWidget(widget) {
    const binding = widget.dataBinding || createDefaultDataBinding()

    const state = {
      widgetId: widget.id,
      mode: binding.mode,
      resolvedObject: null,
      status: BINDING_STATUS.OK,
      mappingStates: new Map(),
      actionDefs: widget.actions || [],
      lastSyncTime: 0,
    }

    // 解析目标对象
    if (binding.mode === BINDING_MODE.OBJECT_ID) {
      const objectId = binding.source?.objectId
      if (objectId) {
        state.resolvedObject = this.objectResolver(objectId)
        if (!state.resolvedObject) {
          state.status = BINDING_STATUS.ERROR
          this._emitEvent('binding:invalid', { widgetId: widget.id, code: BINDING_ERR.E_NO_OBJECT, message: `Object not found: ${objectId}` })
        }
      } else {
        state.status = BINDING_STATUS.ERROR
      }
    } else if (binding.mode === BINDING_MODE.CONTEXT_SELECTED) {
      state.resolvedObject = this.selectionProvider()
      if (!state.resolvedObject) {
        state.status = BINDING_STATUS.DEGRADED
      }
    }
    // STATIC mode: no object needed

    // 解析映射
    if (binding.mappings) {
      for (const m of binding.mappings) {
        state.mappingStates.set(m.id, {
          ...m,
          mappingId: m.id,
          currentValue: m.defaultValue ?? undefined,
          lastReadValue: undefined,
          status: state.status === BINDING_STATUS.ERROR ? BINDING_STATUS.ERROR : BINDING_STATUS.OK,
          error: null,
        })
      }
    }

    this._widgetBindings.set(widget.id, state)

    if (state.status === BINDING_STATUS.OK || state.status === BINDING_STATUS.DEGRADED) {
      this._emitEvent('binding:resolved', { widgetId: widget.id, mode: binding.mode, objectId: binding.source?.objectId, mappingCount: binding.mappings?.length || 0 })
    }
  }

  _syncAllReads() {
    for (const [widgetId] of this._widgetBindings) {
      this._syncWidgetRead(widgetId)
    }
  }

  _syncWidgetRead(widgetId) {
    const state = this._widgetBindings.get(widgetId)
    if (!state || state.mode === BINDING_MODE.STATIC) return

    for (const [mappingId] of state.mappingStates) {
      this._syncSingleMapping(state, mappingId)
    }
    state.lastSyncTime = Date.now()
  }

  _syncSingleMapping(state, mappingId) {
    const mState = state.mappingStates.get(mappingId)
    if (!mState) return
    if (mState.direction === MAPPING_DIRECTION.WRITE) return // write-only 不做读同步

    const object = state.resolvedObject
    if (!object) {
      mState.currentValue = mState.defaultValue
      mState.status = BINDING_STATUS.DEGRADED
      return
    }

    // 读取对象属性
    const { value, error } = readObjectPath(object, mState.objectPath)
    if (error) {
      mState.status = BINDING_STATUS.ERROR
      mState.error = `Read error: ${error}`
      mState.currentValue = mState.defaultValue
      return
    }

    // 应用 read transform
    let finalValue = value
    if (mState.transform?.read?.id) {
      const transformed = applyTransform(mState.transform.read.id, value, mState.transform.read.params)
      if (transformed.success) {
        finalValue = transformed.value
      } else {
        mState.status = BINDING_STATUS.DEGRADED
        finalValue = mState.defaultValue ?? value
      }
    }

    const oldValue = mState.currentValue
    if (oldValue !== finalValue) {
      mState.currentValue = finalValue
      mState.lastReadValue = value
      mState.status = BINDING_STATUS.OK
      this._emitEvent('binding:value-updated', {
        widgetId: state.widgetId,
        mappingId,
        widgetField: mState.widgetField,
        objectPath: mState.objectPath,
        oldValue,
        newValue: finalValue,
        direction: 'read',
      })
    }
  }

  _findWriteMapping(state, widgetField) {
    for (const [, mState] of state.mappingStates) {
      if (mState.widgetField === widgetField &&
          (mState.direction === MAPPING_DIRECTION.WRITE || mState.direction === MAPPING_DIRECTION.BOTH)) {
        return mState
      }
    }
    return null
  }

  _resolveActionTarget(action, widgetId) {
    if (!action.target) return this.selectionProvider()

    // 绑定对象优先：使用当前 widget 已解析的对象
    if (action.target.mode === TARGET_MODE.BOUND_OBJECT) {
      const state = this._widgetBindings.get(widgetId)
      return state?.resolvedObject || null
    }

    if (action.target.mode === TARGET_MODE.OBJECT_ID && action.target.objectId) {
      return this.objectResolver(action.target.objectId)
    }

    // context-selected（兼容兜底：无选中对象时回退到绑定对象）
    const selected = this.selectionProvider()
    if (selected) return selected
    const state = this._widgetBindings.get(widgetId)
    return state?.resolvedObject || null
  }

  // ==================== 事件监听 ====================

  _registerListeners() {
    if (!this.sceneManager) return

    const onTransform = (data) => this._onObjectTransform(data)
    const onRenamed = (data) => this._onObjectRenamed(data)
    const onVisibility = (data) => this._onObjectVisibility(data)
    const onSelected = (data) => this._onObjectSelected(data)
    const onRemoved = (data) => this._onObjectRemoved(data)

    this.sceneManager.on('object:transform', onTransform)
    this.sceneManager.on('object:renamed', onRenamed)
    this.sceneManager.on('object:visibility', onVisibility)
    this.sceneManager.on('object:selected', onSelected)
    this.sceneManager.on('object:removed', onRemoved)

    this._listeners = [
      ['object:transform', onTransform],
      ['object:renamed', onRenamed],
      ['object:visibility', onVisibility],
      ['object:selected', onSelected],
      ['object:removed', onRemoved],
    ]
  }

  _unregisterListeners() {
    if (!this.sceneManager) return
    for (const [event, handler] of this._listeners) {
      this.sceneManager.off(event, handler)
    }
    this._listeners = []
  }

  _onObjectTransform(data) {
    if (!data?.object) return
    this._syncWidgetsForObject(data.object, ['position', 'rotation', 'scale'])
  }

  _onObjectRenamed(data) {
    if (!data?.object) return
    this._syncWidgetsForObject(data.object, ['name'])
  }

  _onObjectVisibility(data) {
    if (!data?.object) return
    this._syncWidgetsForObject(data.object, ['visible'])
  }

  _onObjectSelected(data) {
    const newObject = data?.object || null
    const newId = newObject?.uuid || null

    if (newId === this._lastContextObjectId) return
    this._lastContextObjectId = newId

    // 更新所有 context-selected 绑定
    const affectedWidgets = []
    for (const [widgetId, state] of this._widgetBindings) {
      if (state.mode === BINDING_MODE.CONTEXT_SELECTED) {
        state.resolvedObject = newObject
        state.status = newObject ? BINDING_STATUS.OK : BINDING_STATUS.DEGRADED
        this._syncWidgetRead(widgetId)
        affectedWidgets.push(widgetId)
      }
    }

    this._emitEvent('context:object-changed', {
      newObjectId: newId,
      oldObjectId: this._lastContextObjectId,
      affectedWidgets,
    })
  }

  _onObjectRemoved(data) {
    if (!data?.object) return
    const uuid = data.object.uuid

    for (const [widgetId, state] of this._widgetBindings) {
      if (state.resolvedObject?.uuid === uuid) {
        state.resolvedObject = null
        state.status = BINDING_STATUS.ERROR
        // 所有映射降级
        for (const [, mState] of state.mappingStates) {
          mState.currentValue = mState.defaultValue
          mState.status = BINDING_STATUS.ERROR
        }
        this._emitEvent('binding:invalid', { widgetId, code: BINDING_ERR.E_NO_OBJECT, message: 'Bound object removed' })
      }
    }
  }

  _syncWidgetsForObject(object, pathPrefixes) {
    const uuid = object.uuid
    for (const [widgetId, state] of this._widgetBindings) {
      if (state.resolvedObject?.uuid !== uuid) continue

      for (const [mappingId, mState] of state.mappingStates) {
        if (mState.direction === MAPPING_DIRECTION.WRITE) continue
        const rootPath = mState.objectPath.split('.')[0]
        if (pathPrefixes.includes(rootPath) || pathPrefixes.includes(mState.objectPath)) {
          this._syncSingleMapping(state, mappingId)
        }
      }
    }
  }

  _clearAllDebounce() {
    for (const timer of this._debounceTimers.values()) {
      clearTimeout(timer)
    }
    this._debounceTimers.clear()
  }

  _emitEvent(type, payload) {
    if (this.onEvent) {
      this.onEvent(type, { type, timestamp: Date.now(), ...payload })
    }
  }
}

// ── Utils ──
function setNestedValue(obj, path, value) {
  if (!path) return
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined) current[parts[i]] = {}
    current = current[parts[i]]
  }
  current[parts[parts.length - 1]] = value
}
