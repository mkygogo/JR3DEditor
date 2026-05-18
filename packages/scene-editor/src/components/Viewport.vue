<template>
  <div 
    ref="container" 
    class="viewport-container"
    @dragover.prevent
    @drop="onDrop"
  >
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import * as THREE from 'three';
import { SceneManager, PersistenceManager, DBManager, BindingManager } from '@meteor3d/core';
import { API_BASE_URL } from '../config';
import { InputManager } from '../core/InputManager';
import { TransformManager } from '../core/TransformManager';
import { HistoryManager } from '../core/HistoryManager';
import { AddObjectCommand } from '../core/CommandFactory';
import { useEditorStore } from '../stores/editorStore';
import { useHudStore } from '../stores/hudStore';
import { storeToRefs } from 'pinia';

/** Set a dotted-path value on an object (e.g. 'position.x') */
function setNestedVal(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

/**
 * Auto-populate ObjectInfoPanel widgets with custom properties of the selected object.
 * For widgets with autoCustomFields enabled + context-selected binding mode,
 * base fields (with explicit path mappings) retain their values from the binding system,
 * and custom properties are appended dynamically.
 */
function autoPopulateObjectInfoPanels(objectId) {
  const sm = window.editor?.sceneManager;
  if (!sm) return;
  const widgets = sm.hudConfig?.widgets;
  if (!widgets) return;

  const object = objectId ? sm.getObjectByUUID(objectId) : null;

  for (const widget of widgets) {
    if (widget.type !== 'object-info-panel') continue;
    if (!widget.data?.autoCustomFields) continue;
    const binding = widget.dataBinding;
    if (!binding || binding.mode !== 'context-selected') continue;

    const baseFields = (widget.data.fields || []).filter(f => f.path && !f.path.startsWith('custom.'));
    let customFields = [];

    if (object) {
      const customProps = object.userData?.customProperties || [];
      customFields = customProps.map(prop => ({
        label: prop.label || prop.key,
        value: prop.value ?? '-',
        path: `custom.${prop.key}`,
        _auto: true,
      }));
    }

    const updatedFields = [...baseFields, ...customFields];
    hudStore.updateWidget(widget.id, { data: { ...widget.data, fields: updatedFields } });
  }
}

const container = ref(null);
const canvas = ref(null);
const editorStore = useEditorStore();
const hudStore = useHudStore();
const { selectedObject } = storeToRefs(editorStore);
const route = useRoute();

let sceneManager = null;
let bindingManager = null;
let inputManager = null;
let transformManager = null;
let historyManager = null;
let persistenceManager = null;
let dbManager = null;

// Expose managers to parent/global if needed, or use a composable/provide-inject
// For now, we attach them to the window for debugging or simple access
window.editor = {};


/**
 * 计算拖放位置
 * 优先检测场景对象表面，fallback 到 Y=0 平面
 */

/**
 * Keep newly dropped models visible without changing normally scaled assets.
 * Some uploaded CAD/GLB files arrive in very small units and look like they were not added.
 */
const normalizeDroppedModel = (object) => {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;

  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(maxDim) || maxDim <= 0) return;

  // Scale only genuinely tiny assets. Preserve source hierarchy transforms.
  if (maxDim < 0.5) {
    const targetSize = 2;
    const factor = targetSize / maxDim;
    object.scale.multiplyScalar(factor);
    object.userData.autoScaledOnDrop = true;
    object.userData.autoScaleFactor = factor;
  }
};

const getDropPosition = (event) => {
  const rect = canvas.value.getBoundingClientRect();
  const screenPos = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );

  // 优先检测场景对象
  const intersects = sceneManager.raycastObjects(screenPos, { recursive: true });
  if (intersects.length > 0) {
    return intersects[0].point.clone();
  }

  // Fallback: 与 Y=0 平面相交
  const groundPoint = sceneManager.raycastGround(screenPos);
  return groundPoint || new THREE.Vector3(0, 0, 0);
};

const onDrop = async (event) => {
  const type = event.dataTransfer.getData('type');
  if (!type) return;

  if (type === 'Environment') {
    const url = event.dataTransfer.getData('url');
    try {
      await sceneManager.loadEnvironment(url);
    } catch (error) {
      console.error('Failed to load environment:', error);
    }
    return;
  }

  let object;

  if (type === 'GLTFModel') {
    // Load GLTF model. Prefer processed/compressed assets, then fall back to the raw upload.
    const url = event.dataTransfer.getData('url');
    const fallbackUrl = event.dataTransfer.getData('fallbackUrl');
    try {
      try {
        object = await persistenceManager.loadGLTFModel(url);
      } catch (primaryError) {
        if (!fallbackUrl || fallbackUrl === url) throw primaryError;
        console.warn('Compressed GLTF load failed, retrying raw asset:', primaryError);
        object = await persistenceManager.loadGLTFModel(fallbackUrl);
      }

      object.name = event.dataTransfer.getData('name') || object.name || 'GLTF Model';
      normalizeDroppedModel(object);
      
      // 使用统一的放置位置计算
      const dropPosition = getDropPosition(event);
      object.position.copy(dropPosition);
    } catch (error) {
      console.error('Failed to load GLTF model:', error);
      return;
    }
  } else if (type === 'Tileset') {
    // Load 3D Tiles
    const url = event.dataTransfer.getData('url');
    try {
      object = await persistenceManager.loadTileset(url);
      // 3D Tiles 已自动居中，无需额外位置设置
    } catch (error) {
      console.error('Failed to load 3D Tiles:', error);
      return;
    }
  } else {
    // Simple geometry
    let geometry, material;

    if (type === 'Box') {
      geometry = new THREE.BoxGeometry(1, 1, 1);
      material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    } else if (type === 'Sphere') {
      geometry = new THREE.SphereGeometry(0.5, 32, 32);
      material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    }

    if (geometry && material) {
      object = new THREE.Mesh(geometry, material);
      
      // 使用统一的放置位置计算
      const dropPosition = getDropPosition(event);
      object.position.copy(dropPosition);
      object.position.y += 0.5; // 基础几何体偏移半个高度
    }
  }

  if (object) {
    const command = new AddObjectCommand(sceneManager, object, persistenceManager);
    historyManager.execute(command);
    editorStore.addObject(object);
    editorStore.selectObject(object);
  }
};

onMounted(async () => {
  sceneManager = new SceneManager(canvas.value);
  historyManager = new HistoryManager();
  dbManager = new DBManager({ apiBaseUrl: API_BASE_URL });
  persistenceManager = new PersistenceManager(sceneManager, editorStore, dbManager);
  
  // Initialize IndexedDB and load saved scene
  const sceneId = route.params.sceneId || 'default';
  await persistenceManager.init(sceneId);
  
  // 通知场景加载完成
  window.dispatchEvent(new CustomEvent('scene-loaded'));

  // 在加载完成后聚焦相机
  sceneManager.fitCameraToScene();
  
  transformManager = new TransformManager(sceneManager, historyManager, persistenceManager);
  inputManager = new InputManager(sceneManager, editorStore, transformManager);

  // Init binding manager
  bindingManager = new BindingManager({
    sceneManager,
    hudConfigProvider: () => window.editor?.sceneManager?.hudConfig || null,
    selectionProvider: () => editorStore.selectedObject,
    objectResolver: (uuid) => sceneManager.getObjectByUUID(uuid),
    allowWriteBack: true,
    onEvent: (type, payload) => {
      if (type === 'binding:value-updated' && payload.direction === 'read') {
        // Push live data into the widget via hudStore
        const widgets = window.editor?.sceneManager?.hudConfig?.widgets;
        const widget = widgets?.find(w => w.id === payload.widgetId);
        if (widget) {
          const updated = { ...widget.data };
          setNestedVal(updated, payload.widgetField, payload.newValue);
          hudStore.updateWidget(payload.widgetId, { data: updated });
        }
      }
      if (type === 'context:object-changed') {
        // Auto-populate ObjectInfoPanel custom fields when selected object changes
        autoPopulateObjectInfoPanels(payload.newObjectId);
      }
    },
  });
  bindingManager.start();

  // Listen for custom property edits to refresh ObjectInfoPanel auto fields
  sceneManager.on('object:custom-data', (data) => {
    if (data?.object && data.object === editorStore.selectedObject) {
      autoPopulateObjectInfoPanels(data.object.uuid);
    }
  });

  window.editor = {
    sceneManager,
    historyManager,
    transformManager,
    inputManager,
    persistenceManager,
    dbManager,
    bindingManager
  };

  // Watch for selection changes to attach transform controls
  editorStore.$subscribe((mutation, state) => {
    if (state.selectedObject) {
      transformManager.attach(state.selectedObject);
    } else {
      transformManager.detach();
    }
  });

  // Watch hudConfig changes → rebind
  hudStore.$subscribe(() => {
    if (bindingManager) {
      bindingManager.rebindAll();
    }
  });

  const observer = new ResizeObserver((entries) => {
      if (sceneManager && sceneManager.renderer) {
          const entry = entries[0];
          if (entry && entry.contentRect) {
             const { width, height } = entry.contentRect;
             sceneManager.onWindowResize(width, height);
          } else {
             sceneManager.onWindowResize();
          }
      }
  });
  observer.observe(container.value);
});


onBeforeUnmount(() => {
  if (bindingManager) {
    bindingManager.dispose();
    bindingManager = null;
  }
});
</script>

<style scoped>
.viewport-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
