<template>
  <div class="toolbar">
    <div class="group">
      <button @click="setMode('translate')">移动</button>
      <button @click="setMode('rotate')">旋转</button>
      <button @click="setMode('scale')">缩放</button>
    </div>
    <div class="group">
      <button @click="undo">撤销</button>
      <button @click="redo">重做</button>
    </div>
    <div class="group">
      <button @click="showBatchLoader = true" title="批量导入">📥 批量导入</button>
      <button @click="save" class="save-btn">💾 保存</button>
      <button
        v-if="!isPublished"
        @click="handlePublish"
        class="publish-btn"
        :disabled="publishing"
      >🚀 发布</button>
      <button
        v-else
        @click="handleUnpublish"
        class="unpublish-btn"
        :disabled="publishing"
      >⏹ 取消发布</button>
    </div>

    <!-- 发布成功提示 -->
    <div v-if="showPublishLink" class="publish-toast">
      <span>已发布！查看链接：</span>
      <a :href="publishedViewUrl" target="_blank">{{ publishedViewUrl }}</a>
      <button class="copy-btn" @click="copyLink">📋</button>
      <button class="close-btn" @click="showPublishLink = false">✕</button>
    </div>
    
    <BatchLoaderDialog v-model:visible="showBatchLoader" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { message } from '../utils/message';
import { publishScene, unpublishScene, getSceneData } from '../services/sceneService';
import BatchLoaderDialog from './BatchLoaderDialog.vue';

const route = useRoute();
const showBatchLoader = ref(false);
const isPublished = ref(false);
const publishing = ref(false);
const showPublishLink = ref(false);
const publishedViewUrl = ref('');

const sceneId = () => route.params.sceneId;

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const getPortalBaseUrl = () => {
  const configured = import.meta.env.VITE_PORTAL_BASE_URL?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }

  if (import.meta.env.PROD) {
    return `${window.location.origin}/portal`;
  }

  return window.location.origin.replace(/:\d+$/, ':6177');
};

const buildPublishedViewUrl = (viewUrl) => {
  const path = viewUrl?.startsWith('/') ? viewUrl : `/${viewUrl || ''}`;
  return `${getPortalBaseUrl()}${path}`;
};

// 检查当前发布状态
const checkPublishStatus = async () => {
  try {
    const meta = await getSceneData(sceneId());
    isPublished.value = !!meta.published;
  } catch (e) {
    // ignore
  }
};

const handlePublish = async () => {
  publishing.value = true;
  try {
    // 先保存再发布
    await save(true);
    const result = await publishScene(sceneId());
    isPublished.value = true;
    publishedViewUrl.value = buildPublishedViewUrl(result.viewUrl);
    showPublishLink.value = true;
    message.success('场景已发布！');
  } catch (e) {
    message.error('发布失败: ' + e.message);
  } finally {
    publishing.value = false;
  }
};

const handleUnpublish = async () => {
  publishing.value = true;
  try {
    await unpublishScene(sceneId());
    isPublished.value = false;
    showPublishLink.value = false;
    message.success('已取消发布');
  } catch (e) {
    message.error('取消发布失败: ' + e.message);
  } finally {
    publishing.value = false;
  }
};

const copyLink = () => {
  navigator.clipboard.writeText(publishedViewUrl.value);
  message.success('链接已复制');
};

const setMode = (mode) => {
  if (window.editor && window.editor.transformManager) {
    window.editor.transformManager.setMode(mode);
  }
};

const undo = () => {
  if (window.editor && window.editor.historyManager) {
    window.editor.historyManager.undo();
  }
};

const redo = () => {
  if (window.editor && window.editor.historyManager) {
    window.editor.historyManager.redo();
  }
};

const save = async (isAutoSave = false) => {
  if (window.editor && window.editor.persistenceManager) {
    await window.editor.persistenceManager.saveScene();
    if (isAutoSave === true) {
      // Auto save implicitly without toast, or maybe a subtle indication could be added later
    } else {
      message.success('场景已保存！');
    }
  }
};

let autoSaveTimer = null;

onMounted(() => {
  checkPublishStatus();
  autoSaveTimer = setInterval(() => {
    save(true);
  }, 60000);
});

onUnmounted(() => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }
});
</script>

<style scoped>
.toolbar {
  padding: 10px;
  background: #333;
  display: flex;
  gap: 20px;
}

.group {
  display: flex;
  gap: 5px;
}

button {
  padding: 5px 10px;
  background: #555;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background: #666;
}

button.active {
  background: #0066cc;
  box-shadow: inset 0 0 4px rgba(0, 150, 255, 0.5);
}

.save-btn {
  background: #0066cc;
}

.save-btn:hover {
  background: #0052a3;
}

.publish-btn {
  background: #2ea043;
}
.publish-btn:hover {
  background: #238636;
}

.unpublish-btn {
  background: #8b5e00;
}
.unpublish-btn:hover {
  background: #6e4b00;
}

.publish-btn:disabled,
.unpublish-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.publish-toast {
  position: fixed;
  top: 60px;
  right: 20px;
  background: #1e3a1e;
  border: 1px solid #2ea043;
  color: #8eff8e;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
}
.publish-toast a {
  color: #58a6ff;
  text-decoration: underline;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.copy-btn, .close-btn {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 2px 4px;
  font-size: 13px;
}
.copy-btn:hover, .close-btn:hover {
  color: #fff;
}
</style>
