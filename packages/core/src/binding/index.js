/**
 * 数据绑定系统 — 统一导出
 */

export { BindingManager } from './BindingManager.js'
export { executeAction } from './actionExecutors.js'
export { applyTransform, applyInverseTransform, getAvailableTransforms } from './transformRegistry.js'
export {
  readObjectPath,
  writeObjectPath,
  isPathAllowed,
  isPathWritable,
  getPathValueType,
  getGroupedPaths,
  ALLOWED_PATHS,
} from './pathResolver.js'
export {
  BINDING_MODE,
  BINDING_STATUS,
  MAPPING_DIRECTION,
  VALUE_TYPE,
  UPDATE_POLICY,
  ACTION_TRIGGER,
  ACTION_TYPE,
  TARGET_MODE,
  TRANSFORM_ID,
  BINDING_ERR,
  ACTION_ERR,
  CONFIG_ERR,
  createDefaultDataBinding,
  createDefaultAction,
  createDefaultMapping,
} from './constants.js'
