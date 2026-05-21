<template>
  <div class="gaussian-modal" @click.self="emit('close')">
    <div class="gaussian-window">
      <div class="gaussian-toolbar">
        <strong>{{ displayTitle }}</strong>
        <span class="hint">{{ modeHint }}</span>
        <button v-if="canSaveDefaultView" @click="saveDefaultView">设为居中</button>
        <button @click="resetView">居中</button>
        <button :class="{ active: controlMode === 'fly' }" @click="toggleFly">{{ controlMode === 'fly' ? '轨道' : '漫游' }}</button>
        <button @click="emit('close')">关闭</button>
      </div>
      <div ref="canvasHostRef" class="gaussian-canvas-host">
        <canvas ref="canvasRef"></canvas>
      </div>
      <div v-if="loading || error" class="gaussian-status">
        <strong>{{ error ? '加载失败' : '加载中' }}</strong>
        <span>{{ error || statusText }}</span>
        <div v-if="!error" class="progress-track">
          <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <span v-if="!error" class="progress-text">{{ progressText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  sceneId: { type: String, required: true },
  title: { type: String, default: '' },
  initialView: { type: Object, default: null },
  canSaveDefaultView: { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'save-default-view']);

const canvasRef = ref(null);
const canvasHostRef = ref(null);
const loading = ref(true);
const error = ref('');
const statusText = ref('读取高斯场景元数据');
const progressPercent = ref(4);
const progressText = ref('准备加载');
const controlMode = ref('orbit');
const displayTitle = computed(() => props.title || props.sceneId);
const modeHint = computed(() => controlMode.value === 'fly'
  ? 'WASD 移动，Q/E 上下，Shift 加速，滚轮调速，F 退出'
  : '左键旋转，右键平移，滚轮缩放，F 漫游');

let pc;
let app;
let camera;
let splatEntity;
let splatAsset;
let sceneDetail;
let rafResize = 0;
let modelBlobUrl = '';
let modelAbortController = null;
const keys = new Set();
const WORLD_UP = () => new pc.Vec3(0, 0, 1);
const GAUSSIAN_CACHE_NAME = 'jr3d-gaussian-models-v1';

const orbit = { target: null, yaw: 35, pitch: -24, distance: 8, dragging: false, panning: false, lastX: 0, lastY: 0 };
const fly = { yaw: 35, pitch: -12, speed: 2.5, fastMultiplier: 4, mouseSensitivity: 0.12 };

async function loadPlayCanvas() {
  return import('../vendor/playcanvas.mjs');
}

function fileUrl(name) {
  return `/api/gaussian-scenes/${encodeURIComponent(props.sceneId)}/files/${name}`;
}

function detailUrl() {
  return `/api/gaussian-scenes/${encodeURIComponent(props.sceneId)}`;
}

function worldToPc(point) {
  return new pc.Vec3(point?.[0] || 0, point?.[1] || 0, point?.[2] || 0);
}

function flyForward() {
  const yaw = fly.yaw * pc.math.DEG_TO_RAD;
  const pitch = fly.pitch * pc.math.DEG_TO_RAD;
  const cp = Math.cos(pitch);
  return new pc.Vec3(Math.sin(yaw) * cp, Math.cos(yaw) * cp, Math.sin(pitch));
}

function flyRight() {
  const yaw = fly.yaw * pc.math.DEG_TO_RAD;
  return new pc.Vec3(Math.cos(yaw), -Math.sin(yaw), 0);
}

function syncFlyFromOrbit() {
  fly.yaw = orbit.yaw + 180;
  fly.pitch = pc.math.clamp(-orbit.pitch, -89, 89);
}

function updateCamera() {
  const yaw = orbit.yaw * pc.math.DEG_TO_RAD;
  const pitch = orbit.pitch * pc.math.DEG_TO_RAD;
  const cp = Math.cos(pitch);
  camera.setPosition(new pc.Vec3(
    orbit.target.x + orbit.distance * Math.sin(yaw) * cp,
    orbit.target.y + orbit.distance * Math.cos(yaw) * cp,
    orbit.target.z + orbit.distance * Math.sin(pitch),
  ));
  camera.lookAt(orbit.target, WORLD_UP());
  syncFlyFromOrbit();
}

function updateFlyCamera() {
  camera.lookAt(camera.getPosition().clone().add(flyForward()), WORLD_UP());
}

function frameFromOccupancy(occupancy) {
  const min = occupancy?.min || occupancy?.lower || [-6, -6, 0];
  const max = occupancy?.max || occupancy?.upper || [6, 6, 3];
  orbit.target.copy(worldToPc([(min[0] + max[0]) * 0.5, (min[1] + max[1]) * 0.5, (min[2] + max[2]) * 0.5]));
  orbit.distance = Math.max(6, Math.max(Math.abs(max[0] - min[0]), Math.abs(max[1] - min[1]), Math.abs(max[2] - min[2])) * 1.15);
  orbit.pitch = -28;
  orbit.yaw = 35;
  updateCamera();
}

function frameFromAabb(aabb) {
  if (!aabb?.center || !aabb?.halfExtents) return false;
  orbit.target.copy(aabb.center);
  const h = aabb.halfExtents;
  orbit.distance = Math.max(3, Math.max(h.x, h.y, h.z) * 3.2);
  orbit.pitch = -22;
  orbit.yaw = 35;
  updateCamera();
  return true;
}

function toVec3(value) {
  if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y) || !Number.isFinite(value.z)) return null;
  return new pc.Vec3(value.x, value.y, value.z);
}

function serializeVec3(value) {
  return {
    x: Number(value?.x || 0),
    y: Number(value?.y || 0),
    z: Number(value?.z || 0),
  };
}

function applySavedView(view) {
  if (!view || !camera || !pc) return false;
  if (view.mode === 'fly' && view.fly) {
    const position = toVec3(view.fly.position);
    if (!position || !Number.isFinite(view.fly.yaw) || !Number.isFinite(view.fly.pitch)) return false;
    if (document.pointerLockElement === canvasRef.value) document.exitPointerLock();
    camera.setPosition(position);
    fly.yaw = view.fly.yaw;
    fly.pitch = pc.math.clamp(view.fly.pitch, -89, 89);
    controlMode.value = 'fly';
    updateFlyCamera();
    return true;
  }
  if (view.orbit) {
    const target = toVec3(view.orbit.target);
    if (!target || !Number.isFinite(view.orbit.yaw) || !Number.isFinite(view.orbit.pitch) || !Number.isFinite(view.orbit.distance)) return false;
    if (document.pointerLockElement === canvasRef.value) document.exitPointerLock();
    orbit.target.copy(target);
    orbit.yaw = view.orbit.yaw;
    orbit.pitch = pc.math.clamp(view.orbit.pitch, -82, 18);
    orbit.distance = pc.math.clamp(view.orbit.distance, 0.5, 200);
    controlMode.value = 'orbit';
    updateCamera();
    return true;
  }
  return false;
}

function autoFrameView() {
  if (sceneDetail?.occupancy) frameFromOccupancy(sceneDetail.occupancy);
  if (splatAsset?.resource?.aabb) frameFromAabb(splatAsset.resource.aabb);
}

function captureCurrentView() {
  const position = camera?.getPosition();
  return {
    version: 1,
    mode: controlMode.value,
    orbit: {
      target: serializeVec3(orbit.target),
      yaw: Number(orbit.yaw),
      pitch: Number(orbit.pitch),
      distance: Number(orbit.distance),
    },
    fly: {
      position: serializeVec3(position),
      yaw: Number(fly.yaw),
      pitch: Number(fly.pitch),
    },
  };
}

function setControlMode(mode) {
  controlMode.value = mode;
  if (mode === 'fly') {
    syncFlyFromOrbit();
    updateFlyCamera();
  } else if (document.pointerLockElement === canvasRef.value) {
    document.exitPointerLock();
  }
}

function toggleFly() {
  setControlMode(controlMode.value === 'fly' ? 'orbit' : 'fly');
}

function resetView() {
  if (applySavedView(props.initialView)) return;
  autoFrameView();
}

function saveDefaultView() {
  emit('save-default-view', captureCurrentView());
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index++;
  }
  return `${value.toFixed(index ? 1 : 0)} ${units[index]}`;
}

function cacheKey(url) {
  return new URL(url, window.location.origin).toString();
}

async function readCachedModel(url) {
  if (!('caches' in window)) return null;
  try {
    const cache = await caches.open(GAUSSIAN_CACHE_NAME);
    const cached = await cache.match(cacheKey(url));
    if (!cached) return null;
    const blob = await cached.blob();
    progressPercent.value = 90;
    progressText.value = `已从本地缓存读取 ${formatBytes(blob.size)}`;
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('[GaussianSplatModal] cache read failed:', err);
    return null;
  }
}

async function writeCachedModel(url, blob) {
  if (!('caches' in window)) return;
  try {
    const cache = await caches.open(GAUSSIAN_CACHE_NAME);
    await cache.put(cacheKey(url), new Response(blob, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(blob.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    }));
  } catch (err) {
    console.warn('[GaussianSplatModal] cache write failed:', err);
  }
}

async function downloadModelWithProgress(url) {
  const cachedUrl = await readCachedModel(url);
  if (cachedUrl) return cachedUrl;

  modelAbortController = new AbortController();
  progressPercent.value = 12;
  progressText.value = '连接模型文件';
  const res = await fetch(url, { signal: modelAbortController.signal });
  if (!res.ok) throw new Error(`模型下载失败：HTTP ${res.status}`);

  const total = Number(res.headers.get('content-length')) || sceneDetail?.plyBytes || 0;
  if (!res.body?.getReader) {
    const blob = await res.blob();
    progressPercent.value = 76;
    progressText.value = `${formatBytes(blob.size)} / ${formatBytes(total || blob.size)}`;
    writeCachedModel(url, blob);
    return URL.createObjectURL(blob);
  }

  const reader = res.body.getReader();
  const chunks = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    if (total) {
      progressPercent.value = Math.min(76, 12 + (loaded / total) * 64);
      progressText.value = `${formatBytes(loaded)} / ${formatBytes(total)}`;
    } else {
      progressPercent.value = Math.min(68, progressPercent.value + 1.5);
      progressText.value = `${formatBytes(loaded)} 已下载`;
    }
  }
  progressPercent.value = 78;
  progressText.value = '模型下载完成，正在解析';
  const blob = new Blob(chunks, { type: 'application/octet-stream' });
  writeCachedModel(url, blob);
  return URL.createObjectURL(blob);
}

function moveFlyCamera(dt) {
  if (controlMode.value !== 'fly') return;
  const delta = new pc.Vec3();
  if (keys.has('KeyW')) delta.add(flyForward());
  if (keys.has('KeyS')) delta.sub(flyForward());
  if (keys.has('KeyD')) delta.add(flyRight());
  if (keys.has('KeyA')) delta.sub(flyRight());
  if (keys.has('KeyE')) delta.add(WORLD_UP());
  if (keys.has('KeyQ')) delta.sub(WORLD_UP());
  if (delta.lengthSq() === 0) return;
  const speed = fly.speed * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? fly.fastMultiplier : 1);
  camera.setPosition(camera.getPosition().clone().add(delta.normalize().mulScalar(speed * dt)));
  updateFlyCamera();
}

async function initViewer() {
  await nextTick();
  pc = await loadPlayCanvas();
  orbit.target = new pc.Vec3(0, 0, 0);
  app = new pc.Application(canvasRef.value, {
    mouse: new pc.Mouse(canvasRef.value),
    touch: new pc.TouchDevice(canvasRef.value),
    keyboard: new pc.Keyboard(window),
    graphicsDeviceOptions: { antialias: false },
  });
  app.setCanvasFillMode(pc.FILLMODE_NONE);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.start();
  app.scene.ambientLight = new pc.Color(0.12, 0.13, 0.15);
  app.scene.toneMapping = pc.TONEMAP_ACES;

  camera = new pc.Entity('camera');
  camera.addComponent('camera', { clearColor: new pc.Color(0.02, 0.022, 0.026), fov: 62, nearClip: 0.02, farClip: 1000 });
  app.root.addChild(camera);
  const light = new pc.Entity('light');
  light.addComponent('light', { type: 'directional', color: new pc.Color(1, 0.96, 0.86), intensity: 1.2 });
  light.setEulerAngles(45, 35, 0);
  app.root.addChild(light);
  bindEvents();
  app.on('update', moveFlyCamera);

  sceneDetail = await fetch(detailUrl()).then(res => {
    if (!res.ok) throw new Error(`高斯场景不存在：${props.sceneId}`);
    return res.json();
  });
  frameFromOccupancy(sceneDetail.occupancy);
  progressPercent.value = 10;
  progressText.value = sceneDetail?.plyBytes ? `模型大小 ${formatBytes(sceneDetail.plyBytes)}` : '准备下载模型';
  statusText.value = '下载高斯泼溅模型';

  modelBlobUrl = await downloadModelWithProgress(fileUrl('3dgs_compressed.ply'));
  statusText.value = '解析高斯泼溅模型';
  progressPercent.value = 82;
  progressText.value = '正在创建 GPU 资源';

  splatAsset = new pc.Asset(`${props.sceneId}.ply`, 'gsplat', { url: modelBlobUrl });
  app.assets.add(splatAsset);
  splatAsset.on('error', err => {
    error.value = String(err || '模型加载失败');
  });
  splatAsset.ready(() => {
    splatEntity = new pc.Entity(`splat-${props.sceneId}`);
    splatEntity.addComponent('gsplat', { asset: splatAsset });
    app.root.addChild(splatEntity);
    if (!applySavedView(props.initialView)) frameFromAabb(splatAsset.resource?.aabb);
    progressPercent.value = 100;
    progressText.value = '加载完成';
    loading.value = false;
  });
  app.assets.load(splatAsset);
  resizeCanvas();
}

function resizeCanvas() {
  cancelAnimationFrame(rafResize);
  rafResize = requestAnimationFrame(() => {
    if (!app || !canvasHostRef.value || !canvasRef.value) return;
    const rect = canvasHostRef.value.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    canvasRef.value.style.width = `${width}px`;
    canvasRef.value.style.height = `${height}px`;
    app.resizeCanvas(width, height);
  });
}

function isTypingTarget(event) {
  const tag = event.target?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || event.target?.isContentEditable;
}

function bindEvents() {
  canvasRef.value.addEventListener('contextmenu', preventDefault);
  canvasRef.value.addEventListener('pointerdown', onPointerDown);
  canvasRef.value.addEventListener('pointermove', onPointerMove);
  canvasRef.value.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', resizeCanvas);
}

function unbindEvents() {
  canvasRef.value?.removeEventListener('contextmenu', preventDefault);
  canvasRef.value?.removeEventListener('pointerdown', onPointerDown);
  canvasRef.value?.removeEventListener('pointermove', onPointerMove);
  canvasRef.value?.removeEventListener('wheel', onWheel);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  document.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('resize', resizeCanvas);
}

const preventDefault = event => event.preventDefault();
function onPointerDown(event) {
  event.stopPropagation();
  if (controlMode.value === 'fly') {
    canvasRef.value.requestPointerLock?.();
    return;
  }
  orbit.dragging = event.button === 0;
  orbit.panning = event.button === 2 || event.button === 1;
  orbit.lastX = event.clientX;
  orbit.lastY = event.clientY;
  canvasRef.value.setPointerCapture?.(event.pointerId);
}

function onPointerMove(event) {
  if (controlMode.value === 'fly') return;
  const dx = event.clientX - orbit.lastX;
  const dy = event.clientY - orbit.lastY;
  orbit.lastX = event.clientX;
  orbit.lastY = event.clientY;
  if (orbit.dragging) {
    orbit.yaw -= dx * 0.25;
    orbit.pitch = pc.math.clamp(orbit.pitch + dy * 0.2, -82, 18);
    updateCamera();
  } else if (orbit.panning) {
    orbit.target.add(camera.right.clone().mulScalar(-dx * orbit.distance * 0.0015));
    orbit.target.add(camera.up.clone().mulScalar(dy * orbit.distance * 0.0015));
    updateCamera();
  }
}

function onPointerUp() {
  orbit.dragging = false;
  orbit.panning = false;
}

function onMouseMove(event) {
  if (controlMode.value !== 'fly' || document.pointerLockElement !== canvasRef.value) return;
  fly.yaw += event.movementX * fly.mouseSensitivity;
  fly.pitch = pc.math.clamp(fly.pitch - event.movementY * fly.mouseSensitivity, -89, 89);
  updateFlyCamera();
}

function onKeyDown(event) {
  if (isTypingTarget(event)) return;
  if (event.code === 'KeyF') {
    toggleFly();
    event.preventDefault();
  } else if (event.code === 'Escape' && controlMode.value === 'fly') {
    setControlMode('orbit');
  } else if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
    keys.add(event.code);
    event.preventDefault();
  }
}

function onKeyUp(event) {
  keys.delete(event.code);
}

function onWheel(event) {
  event.preventDefault();
  if (controlMode.value === 'fly') {
    fly.speed = pc.math.clamp(fly.speed * (event.deltaY > 0 ? 0.88 : 1.12), 0.1, 25);
    return;
  }
  orbit.distance = pc.math.clamp(orbit.distance * (1 + Math.sign(event.deltaY) * 0.09), 0.5, 200);
  updateCamera();
}

function disposeViewer() {
  unbindEvents();
  modelAbortController?.abort();
  modelAbortController = null;
  if (document.pointerLockElement === canvasRef.value) document.exitPointerLock();
  if (splatEntity) splatEntity.destroy();
  if (splatAsset && app) {
    app.assets.remove(splatAsset);
    splatAsset.unload();
  }
  if (modelBlobUrl) URL.revokeObjectURL(modelBlobUrl);
  modelBlobUrl = '';
  app?.destroy();
  app = null;
}

onMounted(() => initViewer().catch(err => {
  console.error('[GaussianSplatModal] init failed:', err);
  error.value = err.message || String(err);
  loading.value = false;
}));
onBeforeUnmount(disposeViewer);
</script>

<style scoped>
.gaussian-modal {
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
}

.gaussian-window {
  width: min(1180px, calc(100vw - 56px));
  height: min(760px, calc(100vh - 56px));
  background: #07090d;
  border: 1px solid rgba(120, 190, 255, 0.35);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.gaussian-toolbar {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  background: #15191f;
  color: #f4f7fb;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.gaussian-toolbar strong {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hint {
  flex: 1;
  color: #9aa8b8;
  font-size: 12px;
}

button {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: #252c35;
  color: #fff;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
}

button.active,
button:hover {
  background: #0b73d9;
}

.gaussian-canvas-host {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  background: #000;
}

canvas {
  position: absolute;
  inset: 0;
  display: block;
}

.gaussian-status {
  position: absolute;
  inset: 44px 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #d8e7ff;
  background: rgba(7, 9, 13, 0.78);
  pointer-events: none;
}

.progress-track {
  width: min(460px, 72%);
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #12a5ff, #72e2ff);
  transition: width 0.16s ease;
}

.progress-text {
  color: #9fb4c9;
  font-size: 12px;
}
</style>
