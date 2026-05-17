/**
 * 路径解析器 — 白名单对象属性的读写
 * 仅允许预定义路径，禁止原型链访问和函数调用
 */

import { VALUE_TYPE, BINDING_ERR } from './constants.js'

// ── 白名单定义 ──
export const ALLOWED_PATHS = {
  'name':       { valueType: VALUE_TYPE.STRING,  writable: true },
  'visible':    { valueType: VALUE_TYPE.BOOLEAN, writable: true },
  'type':       { valueType: VALUE_TYPE.STRING,  writable: false },
  'position':   { valueType: VALUE_TYPE.VECTOR3, writable: true },
  'position.x': { valueType: VALUE_TYPE.NUMBER,  writable: true },
  'position.y': { valueType: VALUE_TYPE.NUMBER,  writable: true },
  'position.z': { valueType: VALUE_TYPE.NUMBER,  writable: true },
  'rotation':   { valueType: VALUE_TYPE.VECTOR3, writable: true },
  'rotation.x': { valueType: VALUE_TYPE.NUMBER,  writable: true },
  'rotation.y': { valueType: VALUE_TYPE.NUMBER,  writable: true },
  'rotation.z': { valueType: VALUE_TYPE.NUMBER,  writable: true },
  'scale':      { valueType: VALUE_TYPE.VECTOR3, writable: true },
  'scale.x':    { valueType: VALUE_TYPE.NUMBER,  writable: true },
  'scale.y':    { valueType: VALUE_TYPE.NUMBER,  writable: true },
  'scale.z':    { valueType: VALUE_TYPE.NUMBER,  writable: true },
}

/**
 * 检查路径是否在白名单内
 */
export function isPathAllowed(path) {
  return path in ALLOWED_PATHS
}

/**
 * 检查路径是否可写
 */
export function isPathWritable(path) {
  const entry = ALLOWED_PATHS[path]
  return entry ? entry.writable : false
}

/**
 * 获取路径的值类型
 */
export function getPathValueType(path) {
  const entry = ALLOWED_PATHS[path]
  return entry ? entry.valueType : null
}

/**
 * 从 Object3D 读取属性值
 * @param {Object3D} object - Three.js 对象
 * @param {string} path - 白名单路径
 * @returns {{ value: any, error: number|null }}
 */
export function readObjectPath(object, path) {
  if (!object) {
    return { value: undefined, error: BINDING_ERR.E_NO_OBJECT }
  }
  if (!isPathAllowed(path)) {
    return { value: undefined, error: BINDING_ERR.E_INVALID_PATH }
  }

  switch (path) {
    case 'name':
      return { value: object.name, error: null }
    case 'visible':
      return { value: object.visible, error: null }
    case 'type':
      return { value: object.type || object.geometry?.type || 'Object3D', error: null }
    case 'position':
      return { value: { x: object.position.x, y: object.position.y, z: object.position.z }, error: null }
    case 'position.x':
      return { value: object.position.x, error: null }
    case 'position.y':
      return { value: object.position.y, error: null }
    case 'position.z':
      return { value: object.position.z, error: null }
    case 'rotation':
      return { value: { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z }, error: null }
    case 'rotation.x':
      return { value: object.rotation.x, error: null }
    case 'rotation.y':
      return { value: object.rotation.y, error: null }
    case 'rotation.z':
      return { value: object.rotation.z, error: null }
    case 'scale':
      return { value: { x: object.scale.x, y: object.scale.y, z: object.scale.z }, error: null }
    case 'scale.x':
      return { value: object.scale.x, error: null }
    case 'scale.y':
      return { value: object.scale.y, error: null }
    case 'scale.z':
      return { value: object.scale.z, error: null }
    default:
      return { value: undefined, error: BINDING_ERR.E_INVALID_PATH }
  }
}

/**
 * 向 Object3D 写入属性值
 * @param {Object3D} object - Three.js 对象
 * @param {string} path - 白名单路径
 * @param {any} value - 要写入的值
 * @returns {{ success: boolean, error: number|null, clamped: boolean }}
 */
export function writeObjectPath(object, path, value) {
  if (!object) {
    return { success: false, error: BINDING_ERR.E_NO_OBJECT, clamped: false }
  }
  if (!isPathAllowed(path)) {
    return { success: false, error: BINDING_ERR.E_INVALID_PATH, clamped: false }
  }
  if (!isPathWritable(path)) {
    return { success: false, error: BINDING_ERR.E_WRITE_DENIED, clamped: false }
  }

  let clamped = false

  switch (path) {
    case 'name':
      object.name = String(value)
      break
    case 'visible':
      object.visible = Boolean(value)
      break
    case 'position':
      if (value && typeof value === 'object') {
        if (value.x !== undefined) object.position.x = Number(value.x)
        if (value.y !== undefined) object.position.y = Number(value.y)
        if (value.z !== undefined) object.position.z = Number(value.z)
      }
      break
    case 'position.x':
      object.position.x = Number(value)
      break
    case 'position.y':
      object.position.y = Number(value)
      break
    case 'position.z':
      object.position.z = Number(value)
      break
    case 'rotation':
      if (value && typeof value === 'object') {
        if (value.x !== undefined) object.rotation.x = Number(value.x)
        if (value.y !== undefined) object.rotation.y = Number(value.y)
        if (value.z !== undefined) object.rotation.z = Number(value.z)
      }
      break
    case 'rotation.x':
      object.rotation.x = Number(value)
      break
    case 'rotation.y':
      object.rotation.y = Number(value)
      break
    case 'rotation.z':
      object.rotation.z = Number(value)
      break
    case 'scale':
      if (value && typeof value === 'object') {
        if (value.x !== undefined) { const v = Math.max(0.001, Number(value.x)); clamped = clamped || v !== Number(value.x); object.scale.x = v }
        if (value.y !== undefined) { const v = Math.max(0.001, Number(value.y)); clamped = clamped || v !== Number(value.y); object.scale.y = v }
        if (value.z !== undefined) { const v = Math.max(0.001, Number(value.z)); clamped = clamped || v !== Number(value.z); object.scale.z = v }
      }
      break
    case 'scale.x': {
      const v = Math.max(0.001, Number(value))
      clamped = v !== Number(value)
      object.scale.x = v
      break
    }
    case 'scale.y': {
      const v = Math.max(0.001, Number(value))
      clamped = v !== Number(value)
      object.scale.y = v
      break
    }
    case 'scale.z': {
      const v = Math.max(0.001, Number(value))
      clamped = v !== Number(value)
      object.scale.z = v
      break
    }
    default:
      return { success: false, error: BINDING_ERR.E_INVALID_PATH, clamped: false }
  }

  // 标记矩阵需更新
  if (path.startsWith('position') || path.startsWith('rotation') || path.startsWith('scale')) {
    object.matrixWorldNeedsUpdate = true
  }

  return { success: true, error: clamped ? BINDING_ERR.E_WRITE_CLAMPED : null, clamped }
}

/**
 * 获取分组后的白名单路径列表（供 UI 选择器使用）
 */
export function getGroupedPaths() {
  return [
    { group: '基础', paths: ['name', 'visible', 'type'] },
    { group: '位置', paths: ['position', 'position.x', 'position.y', 'position.z'] },
    { group: '旋转', paths: ['rotation', 'rotation.x', 'rotation.y', 'rotation.z'] },
    { group: '缩放', paths: ['scale', 'scale.x', 'scale.y', 'scale.z'] },
  ]
}
