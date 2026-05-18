<template>
  <div class="properties-panel" v-if="selectedObject">
    <h3>属性</h3>
    
    <!-- General -->
    <div class="section">
      <h4>常规 (General)</h4>
      <div class="prop-row">
        <label>名称</label>
        <input type="text" :value="localName" @input="onNameInput">
      </div>
      <div class="prop-row">
        <label>ID</label>
        <input type="text" v-model="selectedObject.uuid" :disabled="true">
      </div>
      <div class="prop-row">
        <label>类型</label>
        <span class="readonly-val">{{ selectedObject.type }}</span>
      </div>
      <div class="prop-row">
        <label>可见性</label>
        <input type="checkbox" v-model="selectedObject.visible" @change="onVisibleChange">
      </div>
    </div>


    <!-- Custom Properties -->
    <div class="section">
      <div class="section-header">
        <h4>自定义属性</h4>
        <button class="btn-add" @click="addCustomProperty">+</button>
      </div>
      <div v-if="customProperties.length === 0" class="empty-custom">暂无自定义属性</div>
      <div v-for="(prop, index) in customProperties" :key="prop.key || index" class="custom-prop">
        <div class="custom-row">
          <label>名称</label>
          <input type="text" :value="prop.label" @input="updateCustomProperty(index, 'label', $event.target.value)">
          <button class="btn-del" @click="removeCustomProperty(index)">×</button>
        </div>
        <div class="custom-row">
          <label>值</label>
          <input type="text" :value="prop.value" @input="updateCustomProperty(index, 'value', $event.target.value)">
        </div>
        <div class="custom-path">绑定源：custom.{{ prop.key }}</div>
      </div>
    </div>

    <!-- Position -->
    <div class="section" :key="'pos-' + forceUpdateKey">
      <h4>位置 (Position)</h4>
      <div class="prop-row">
        <label>X</label>
        <input type="number" v-model.number="selectedObject.position.x" @change="onTransformChange('position')">
      </div>
      <div class="prop-row">
        <label>Y</label>
        <input type="number" v-model.number="selectedObject.position.y" @change="onTransformChange('position')">
      </div>
      <div class="prop-row">
        <label>Z</label>
        <input type="number" v-model.number="selectedObject.position.z" @change="onTransformChange('position')">
      </div>
    </div>

    <!-- Geographic Coordinates -->
    <div class="section" v-if="isGisEnabled" :key="'geo-' + forceUpdateKey">
      <h4>地理坐标 (Lat/Lng/Height)</h4>
      <div class="prop-row">
        <label>经度</label>
        <input type="number" step="0.000001" v-model.number="geoLng" @change="updatePositionFromGeo">
        <span class="unit">°</span>
      </div>
      <div class="prop-row">
        <label>纬度</label>
        <input type="number" step="0.000001" v-model.number="geoLat" @change="updatePositionFromGeo">
        <span class="unit">°</span>
      </div>
      <div class="prop-row">
        <label>高度</label>
        <input type="number" step="0.01" v-model.number="geoHeight" @change="updatePositionFromGeo">
        <span class="unit">m</span>
      </div>
    </div>

    <!-- Rotation -->
    <div class="section" :key="'rot-' + forceUpdateKey">
      <h4>旋转 (Rotation)</h4>
      <div class="prop-row">
        <label>X</label>
        <input type="number" :value="toDegrees(selectedObject.rotation.x)" @change="e => updateRotation('x', e.target.value)">
      </div>
      <div class="prop-row">
        <label>Y</label>
        <input type="number" :value="toDegrees(selectedObject.rotation.y)" @change="e => updateRotation('y', e.target.value)">
      </div>
      <div class="prop-row">
        <label>Z</label>
        <input type="number" :value="toDegrees(selectedObject.rotation.z)" @change="e => updateRotation('z', e.target.value)">
      </div>
    </div>

    <!-- Scale -->
    <div class="section" :key="'scale-' + forceUpdateKey">
      <h4>缩放 (Scale)</h4>
      <div class="prop-row">
        <label>X</label>
        <input type="number" v-model.number="selectedObject.scale.x" @change="onTransformChange('scale')">
      </div>
      <div class="prop-row">
        <label>Y</label>
        <input type="number" v-model.number="selectedObject.scale.y" @change="onTransformChange('scale')">
      </div>
      <div class="prop-row">
        <label>Z</label>
        <input type="number" v-model.number="selectedObject.scale.z" @change="onTransformChange('scale')">
      </div>
    </div>

    <div class="debug-info">
        <small>UUID: {{ selectedObject.uuid.slice(0, 8) }}...</small>
    </div>
  </div>
  <div class="properties-panel" v-else>
    <p class="empty-msg">未选择对象</p>
  </div>
</template>

<script setup>
import { useEditorStore } from '../stores/editorStore';
import { storeToRefs } from 'pinia';
import { TransformCommand } from '../core/CommandFactory';
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';

const editorStore = useEditorStore();
const { selectedObject } = storeToRefs(editorStore);

// 强制更新 key（用于触发 Vue 重新读取 Three.js 对象属性）
const forceUpdateKey = ref(0);

// Local reactive ref for object name (markRaw 对象属性无法被 Vue 追踪，需要本地 ref 中转)
const localName = ref('');

// Sync local name when selected object changes
watch(selectedObject, (obj) => {
  localName.value = obj?.name || '';
  ensureCustomProperties(obj);
}, { immediate: true });

const customProperties = computed(() => {
  forceUpdateKey.value;
  ensureCustomProperties(selectedObject.value);
  const raw = selectedObject.value?.userData?.customProperties || [];
  return [...raw];
});

function ensureCustomProperties(object) {
  if (!object) return;
  if (!object.userData) object.userData = {};
  if (!Array.isArray(object.userData.customProperties)) object.userData.customProperties = [];
}

function makeCustomKey(label) {
  const base = String(label || 'field')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '') || 'field';
  const existing = new Set(customProperties.value.map(item => item.key));
  let key = base;
  let index = 1;
  while (existing.has(key)) key = `${base}_${index++}`;
  return key;
}

function emitCustomDataChanged() {
  if (!selectedObject.value) return;
  selectedObject.value.userData.customPropertiesModified = true;
  forceUpdateKey.value++;
  window.editor?.sceneManager?.emit('object:custom-data', { object: selectedObject.value });
}

function addCustomProperty() {
  if (!selectedObject.value) return;
  ensureCustomProperties(selectedObject.value);
  selectedObject.value.userData.customProperties.push({ key: makeCustomKey('field'), label: '新属性', value: '' });
  emitCustomDataChanged();
}

function updateCustomProperty(index, field, value) {
  if (!selectedObject.value) return;
  const props = selectedObject.value.userData.customProperties;
  if (!props || !props[index]) return;
  props[index][field] = value;
  // 通知绑定系统，但不强制重建 DOM（避免输入框失焦）
  selectedObject.value.userData.customPropertiesModified = true;
  window.editor?.sceneManager?.emit('object:custom-data', { object: selectedObject.value });
}

function removeCustomProperty(index) {
  if (!selectedObject.value) return;
  selectedObject.value.userData.customProperties.splice(index, 1);
  emitCustomDataChanged();
}

// Handle name input — 实时同步到 Three.js 对象并通知场景树
const onNameInput = (event) => {
  const val = event.target.value;
  localName.value = val;
  if (selectedObject.value) {
    selectedObject.value.name = val;
    editorStore.notifyTreeUpdate();
    window.editor?.sceneManager?.emit('object:renamed', { object: selectedObject.value });
  }
};

// Geographic coordinate refs
const geoLng = ref(null);
const geoLat = ref(null);
const geoHeight = ref(null);

// Check if GIS is enabled
const isGisEnabled = computed(() => {
  const sm = window.editor?.sceneManager;
  return sm && sm.gisProjection !== null;
});

// Sync geographic coordinates from current position
const syncGeoFromPosition = () => {
  if (!selectedObject.value || !isGisEnabled.value) {
    geoLng.value = null;
    geoLat.value = null;
    geoHeight.value = null;
    return;
  }
  const sm = window.editor?.sceneManager;
  if (!sm || !sm.worldToLngLat) return;
  const geo = sm.worldToLngLat(selectedObject.value.position);
  if (geo) {
    geoLng.value = parseFloat(geo.lng.toFixed(6));
    geoLat.value = parseFloat(geo.lat.toFixed(6));
    geoHeight.value = parseFloat(geo.height.toFixed(2));
  }
};

// Sync geo coords when selected object or its position changes
watch(
  () => selectedObject.value?.position,
  () => {
    syncGeoFromPosition();
  },
  { deep: true, immediate: true }
);

watch(selectedObject, () => {
  syncGeoFromPosition();
});

// 监听 TransformManager 的变换事件
const handleTransformChanged = (event) => {
  // 如果变换的对象是当前选中的对象，触发强制更新
  if (event.detail?.object === selectedObject.value) {
    forceUpdateKey.value++;
    syncGeoFromPosition();
  }
};

onMounted(() => {
  window.addEventListener('transform-changed', handleTransformChanged);
});

onBeforeUnmount(() => {
  window.removeEventListener('transform-changed', handleTransformChanged);
});

// Update XYZ position from geographic coordinates
const updatePositionFromGeo = () => {
  const sm = window.editor?.sceneManager;
  if (!sm || !sm.lngLatToWorld || !selectedObject.value) return;
  if (geoLng.value === null || geoLat.value === null || geoHeight.value === null) return;
  
  const newPos = sm.lngLatToWorld(geoLng.value, geoLat.value, geoHeight.value);
  selectedObject.value.position.copy(newPos);
  selectedObject.value.userData.positionModified = true;
  
  if (window.editor?.transformManager) {
    window.editor.transformManager.updateSelection();
  }
};

// Helper to convert radians to degrees
const toDegrees = (radians) => {
  return Math.round(radians * (180 / Math.PI) * 100) / 100;
};

// Helper to convert degrees to radians
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Handle rotation updates
const updateRotation = (axis, value) => {
  if (!selectedObject.value) return;
  
  const radians = toRadians(parseFloat(value));
  selectedObject.value.rotation[axis] = radians;
  onTransformChange('rotation');
};

// Handle generic transform changes
const onTransformChange = (type) => {
  if (!selectedObject.value) return;

  // Mark as modified for persistence
  if (type === 'position') selectedObject.value.userData.positionModified = true;
  if (type === 'rotation') selectedObject.value.userData.rotationModified = true;
  if (type === 'scale') selectedObject.value.userData.scaleModified = true;

  // Trigger scene update
  if (window.editor && window.editor.transformManager) {
      window.editor.transformManager.updateSelection();
  }

  window.editor?.sceneManager?.emit('object:transform', { object: selectedObject.value });
};

const onVisibleChange = () => {
    if (!selectedObject.value) return;
    selectedObject.value.userData.visibleModified = true;
    // 通知场景树刷新
    editorStore.notifyTreeUpdate();
    window.editor?.sceneManager?.emit('object:visibility', { object: selectedObject.value });
};
</script>

<style scoped>
.properties-panel {
  width: 280px;
  background: #222;
  color: white;
  padding: 15px;
  overflow-y: auto;
  border-left: 1px solid #333;
}

h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #fff;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
}

.section {
  margin-bottom: 20px;
  background: #2a2a2a;
  padding: 10px;
  border-radius: 4px;
}

h4 {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: #888;
  font-weight: normal;
  text-transform: uppercase;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-add {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 3px;
  background: #0676d8;
  color: #fff;
  cursor: pointer;
}

.btn-del {
  border: 0;
  background: transparent;
  color: #f66;
  cursor: pointer;
  font-size: 16px;
}

.empty-custom {
  color: #777;
  font-size: 12px;
  padding: 4px 0;
}

.custom-prop {
  background: #202020;
  border: 1px solid #383838;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
}

.custom-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.custom-row label {
  min-width: 34px;
  color: #aaa;
  font-size: 12px;
}

.custom-row input {
  flex: 1;
  min-width: 0;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 3px;
  padding: 4px 6px;
}

.custom-path {
  padding: 4px 6px;
  background: rgba(0, 118, 216, 0.12);
  color: #8ecbff;
  border-radius: 3px;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.prop-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.prop-row:last-child {
  margin-bottom: 0;
}

label {
  width: 60px;
  font-size: 12px;
  color: #aaa;
}

input {
  flex: 1;
  background: #333;
  border: 1px solid #444;
  color: white;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
}

input:focus {
  border-color: #0066cc;
  outline: none;
}

input[type="color"] {
  padding: 0;
  height: 24px;
  cursor: pointer;
}

.empty-msg {
  color: #666;
  text-align: center;
  margin-top: 40px;
  font-size: 13px;
}

.unit {
  margin-left: 4px;
  font-size: 12px;
  color: #888;
  min-width: 16px;
}

.debug-info {
    margin-top: 20px;
    color: #444;
    font-size: 10px;
    text-align: center;
}
</style>
