/**
 * 数据绑定系统 — 枚举常量
 * 所有端（Editor / Portal / Core）共用
 */

// ── 绑定模式 ──
export const BINDING_MODE = {
  STATIC: 'static',
  CONTEXT_SELECTED: 'context-selected',
  OBJECT_ID: 'object-id',
}

// ── 映射方向 ──
export const MAPPING_DIRECTION = {
  READ: 'read',
  WRITE: 'write',
  BOTH: 'both',
}

// ── 值类型 ──
export const VALUE_TYPE = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  VECTOR3: 'vector3',
  ARRAY: 'array',
}

// ── 更新策略 ──
export const UPDATE_POLICY = {
  EVENT: 'event',
  HYBRID: 'hybrid',
}

// ── 动作触发器 ──
export const ACTION_TRIGGER = {
  CLICK: 'click',
  HOVER_ENTER: 'hover-enter',
  HOVER_LEAVE: 'hover-leave',
  VALUE_CHANGE: 'value-change',
}

// ── 动作类型 ──
export const ACTION_TYPE = {
  HIGHLIGHT: 'highlight-object',
  CAMERA_FOCUS: 'camera-focus',
  TOGGLE_VISIBLE: 'toggle-visible',
  SET_PROPERTY: 'set-property',
}

// ── 目标模式 ──
export const TARGET_MODE = {
  BOUND_OBJECT: 'bound-object',
  CONTEXT: 'context-selected',
  OBJECT_ID: 'object-id',
}

// ── 绑定状态 ──
export const BINDING_STATUS = {
  OK: 'ok',
  DEGRADED: 'degraded',
  ERROR: 'error',
}

// ── 转换器 ID ──
export const TRANSFORM_ID = {
  NUMBER_TO_FIXED: 'number.toFixed',
  NUMBER_CLAMP: 'number.clamp',
  NUMBER_SCALE: 'number.scale',
  ANGLE_DEG2RAD: 'angle.deg2rad',
  ANGLE_RAD2DEG: 'angle.rad2deg',
  BOOL_TO_LABEL: 'bool.toLabel',
  ARRAY_PICK: 'array.pick',
  STRING_TEMPLATE: 'string.template',
  NOOP: 'noop',
}

// ── 错误码 ──
export const BINDING_ERR = {
  E_NO_OBJECT: 1001,
  E_INVALID_PATH: 1002,
  E_TYPE_MISMATCH: 1003,
  E_TRANSFORM_FAIL: 1004,
  E_WRITE_DENIED: 1005,
  E_WRITE_CLAMPED: 1006,
  E_MISSING_FIELD: 1007,
  E_CIRCULAR_BIND: 1008,
}

export const ACTION_ERR = {
  E_TARGET_NOT_FOUND: 2001,
  E_ACTION_TYPE_UNKNOWN: 2002,
  E_PAYLOAD_INVALID: 2003,
  E_ACTION_TIMEOUT: 2004,
  E_CONTEXT_EMPTY: 2005,
}

export const CONFIG_ERR = {
  E_SCHEMA_INVALID: 3001,
  E_DUPLICATE_MAPPING: 3002,
  E_OBJECT_ID_MISSING: 3003,
}

// ── 默认 DataBinding 结构 ──
export function createDefaultDataBinding() {
  return {
    version: 1,
    mode: BINDING_MODE.STATIC,
    source: { objectId: null, objectName: null },
    mappings: [],
    updatePolicy: UPDATE_POLICY.EVENT,
  }
}

// ── 默认 Action 结构 ──
export function createDefaultAction(type = ACTION_TYPE.HIGHLIGHT) {
  return {
    id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    enabled: true,
    trigger: ACTION_TRIGGER.CLICK,
    type,
    target: { mode: TARGET_MODE.BOUND_OBJECT, objectId: null, objectName: null },
    payload: getDefaultPayload(type),
    debounceMs: 0,
  }
}

// ── 默认 Mapping 结构 ──
export function createDefaultMapping() {
  return {
    id: `m_${Math.random().toString(36).slice(2, 10)}`,
    widgetField: 'data.text',
    objectPath: 'name',
    direction: MAPPING_DIRECTION.READ,
    valueType: VALUE_TYPE.STRING,
    transform: { read: null, write: null },
    defaultValue: '',
    readOnlyWhenInvalid: true,
  }
}

function getDefaultPayload(type) {
  switch (type) {
    case ACTION_TYPE.HIGHLIGHT:
      return { color: '#ffff00', intensity: 0.5, durationMs: 2000, autoRestore: true }
    case ACTION_TYPE.CAMERA_FOCUS:
      return { fitPadding: 1.5, durationMs: 1000, showIfHidden: false }
    case ACTION_TYPE.TOGGLE_VISIBLE:
      return { strategy: 'toggle' }
    case ACTION_TYPE.SET_PROPERTY:
      return { objectPath: '', value: null, valueFromWidgetField: null }
    default:
      return {}
  }
}
