/**
 * 转换器注册表 — 内置值转换函数
 * 每个转换器: (value, params) => transformedValue
 * 转换失败返回 undefined（由调用方决定 fallback）
 */

import { TRANSFORM_ID } from './constants.js'

const registry = new Map()

// ── number.toFixed ──
registry.set(TRANSFORM_ID.NUMBER_TO_FIXED, (value, params = {}) => {
  const num = Number(value)
  if (isNaN(num)) return undefined
  const digits = params.digits ?? 2
  return parseFloat(num.toFixed(digits))
})

// ── number.clamp ──
registry.set(TRANSFORM_ID.NUMBER_CLAMP, (value, params = {}) => {
  const num = Number(value)
  if (isNaN(num)) return undefined
  const min = params.min ?? -Infinity
  const max = params.max ?? Infinity
  return Math.min(Math.max(num, min), max)
})

// ── number.scale ──
// read: k * value + b
// write (inverse): (value - b) / k
registry.set(TRANSFORM_ID.NUMBER_SCALE, (value, params = {}) => {
  const num = Number(value)
  if (isNaN(num)) return undefined
  const k = params.k ?? 1
  const b = params.b ?? 0
  if (params._inverse) {
    if (k === 0) return undefined
    return (num - b) / k
  }
  return k * num + b
})

// ── angle.deg2rad ──
registry.set(TRANSFORM_ID.ANGLE_DEG2RAD, (value) => {
  const num = Number(value)
  if (isNaN(num)) return undefined
  return num * (Math.PI / 180)
})

// ── angle.rad2deg ──
registry.set(TRANSFORM_ID.ANGLE_RAD2DEG, (value) => {
  const num = Number(value)
  if (isNaN(num)) return undefined
  return num * (180 / Math.PI)
})

// ── bool.toLabel ──
registry.set(TRANSFORM_ID.BOOL_TO_LABEL, (value, params = {}) => {
  const trueLabel = params.trueLabel ?? 'true'
  const falseLabel = params.falseLabel ?? 'false'
  if (typeof value === 'string') {
    // write direction: label -> boolean
    return value === trueLabel
  }
  // read direction: boolean -> label
  return value ? trueLabel : falseLabel
})

// ── array.pick ──
registry.set(TRANSFORM_ID.ARRAY_PICK, (value, params = {}) => {
  if (!Array.isArray(value)) return undefined
  const index = params.index ?? 0
  return value[index]
})

// ── string.template ──
registry.set(TRANSFORM_ID.STRING_TEMPLATE, (value, params = {}) => {
  const template = params.template ?? '{v}'
  return template.replace(/\{v\}/g, String(value ?? ''))
})

// ── noop ──
registry.set(TRANSFORM_ID.NOOP, (value) => value)

/**
 * 执行转换
 * @param {string|null} transformId - 转换器 ID
 * @param {any} value - 输入值
 * @param {object|null} params - 转换器参数
 * @returns {{ value: any, success: boolean }}
 */
export function applyTransform(transformId, value, params) {
  if (!transformId) return { value, success: true }

  const fn = registry.get(transformId)
  if (!fn) return { value, success: false }

  try {
    const result = fn(value, params || {})
    if (result === undefined) return { value, success: false }
    return { value: result, success: true }
  } catch {
    return { value, success: false }
  }
}

/**
 * 执行逆向转换（用于 write 方向的 number.scale）
 */
export function applyInverseTransform(transformId, value, params) {
  if (!transformId) return { value, success: true }

  // 目前只有 number.scale 需要逆向
  if (transformId === TRANSFORM_ID.NUMBER_SCALE) {
    return applyTransform(transformId, value, { ...params, _inverse: true })
  }

  // bool.toLabel 的逆向就是原函数传 string
  if (transformId === TRANSFORM_ID.BOOL_TO_LABEL) {
    return applyTransform(transformId, value, params)
  }

  // deg2rad <-> rad2deg 互为逆
  if (transformId === TRANSFORM_ID.ANGLE_DEG2RAD) {
    return applyTransform(TRANSFORM_ID.ANGLE_RAD2DEG, value, params)
  }
  if (transformId === TRANSFORM_ID.ANGLE_RAD2DEG) {
    return applyTransform(TRANSFORM_ID.ANGLE_DEG2RAD, value, params)
  }

  // 其他转换器无逆向，直接透传
  return applyTransform(transformId, value, params)
}

/**
 * 获取所有可用转换器列表（供 UI 使用）
 */
export function getAvailableTransforms() {
  return [
    { id: TRANSFORM_ID.NUMBER_TO_FIXED, label: '数值精度', params: ['digits'] },
    { id: TRANSFORM_ID.NUMBER_CLAMP, label: '数值限幅', params: ['min', 'max'] },
    { id: TRANSFORM_ID.NUMBER_SCALE, label: '线性换算', params: ['k', 'b'] },
    { id: TRANSFORM_ID.ANGLE_DEG2RAD, label: '角度→弧度', params: [] },
    { id: TRANSFORM_ID.ANGLE_RAD2DEG, label: '弧度→角度', params: [] },
    { id: TRANSFORM_ID.BOOL_TO_LABEL, label: '布尔标签', params: ['trueLabel', 'falseLabel'] },
    { id: TRANSFORM_ID.ARRAY_PICK, label: '数组取值', params: ['index'] },
    { id: TRANSFORM_ID.STRING_TEMPLATE, label: '字符串模板', params: ['template'] },
  ]
}
