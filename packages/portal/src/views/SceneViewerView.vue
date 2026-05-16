<template>
  <div class="viewer">
    <!-- Hover trigger zone -->
    <div class="toolbar-trigger" v-if="ready"></div>
    <!-- Floating toolbar -->
    <div class="toolbar" v-if="ready">
      <router-link to="/" class="back-btn">← 返回</router-link>
      <span class="scene-title">{{ sceneName }}</span>
      <div class="toolbar-actions">
        <button @click="toggleCameraMode" :title="cameraMode === 'orbit' ? '切换漫游模式' : '切换轨道模式'">
          {{ cameraMode === 'orbit' ? '🎮 漫游' : '🔄 轨道' }}
        </button>
        <button @click="toggleStats">📊 FPS</button>
        <button @click="fitCamera">🎯 居中</button>
        <button @click="toggleFullscreen">⛶ 全屏</button>
      </div>
    </div>

    <!-- 3D Canvas -->
    <div ref="canvasContainer" class="canvas-container">
      <HudOverlay :hudConfig="hudConfig" />
    </div>

    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>加载场景中...</p>
    </div>

    <!-- Error -->
    <div v-if="error" class="error-overlay">
      <p>{{ error }}</p>
      <router-link to="/" class="back-link">返回首页</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { getPublishedScene } from '../services/portalService';
import HudOverlay from '../components/HudOverlay.vue';

const route = useRoute();
const canvasContainer = ref(null);
const loading = ref(true);
const ready = ref(false);
const error = ref(null);
const sceneName = ref('');
const cameraMode = ref('orbit');
const hudConfig = ref(null);

let instance = null;
let statsEnabled = false;

onMounted(async () => {
  const slug = route.params.slug;
  try {
    // 1. 获取场景元数据以拿到 sceneId
    const { metadata } = await getPublishedScene(slug);
    sceneName.value = metadata.name || '未命名场景';

    // 2. 用 loadScene 加载完整 3D 场景
    const { loadScene } = await import('@meteor3d/core');
    instance = await loadScene({
      sceneId: metadata.sceneId,
      serverUrl: window.location.origin,
      container: canvasContainer.value,
      config: { fitCamera: true, autoResize: true }
    });

    // Load HUD config from scene
    if (instance?._internal?.sceneManager?.hudConfig) {
      hudConfig.value = instance._internal.sceneManager.hudConfig;
    }

    ready.value = true;
  } catch (e) {
    console.error('场景加载失败:', e);
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  if (instance?.dispose) instance.dispose();
});

const toggleCameraMode = () => {
  if (!instance) return;
  const next = cameraMode.value === 'orbit' ? 'ghost' : 'orbit';
  instance.setControlMode(next);
  cameraMode.value = next;
};

const toggleStats = () => {
  if (!instance) return;
  statsEnabled = !statsEnabled;
  instance.toggleStats(statsEnabled);
};

const fitCamera = () => {
  if (!instance) return;
  instance.fitCameraToScene();
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    canvasContainer.value?.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};
</script>

<style scoped>
.viewer {
  position: fixed;
  inset: 0;
  background: #000;
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.toolbar-trigger {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 12px;
  z-index: 11;
}

.toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
  z-index: 10;
  transform: translateY(-100%);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.toolbar-trigger:hover ~ .toolbar,
.toolbar:hover {
  transform: translateY(0);
  opacity: 1;
}

.back-btn {
  color: #aaa;
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;
}
.back-btn:hover { color: #fff; }

.scene-title {
  flex: 1;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-actions {
  display: flex;
  gap: 6px;
}
.toolbar-actions button {
  padding: 5px 12px;
  background: rgba(255,255,255,0.1);
  color: #ccc;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}
.toolbar-actions button:hover {
  background: rgba(255,255,255,0.2);
  color: #fff;
}

.loading-overlay, .error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0f0f0f;
  color: #888;
  gap: 16px;
  z-index: 20;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top-color: #4da6ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.back-link {
  color: #4da6ff;
  text-decoration: underline;
}
</style>
