<template>
  <div class="home">
    <!-- Header -->
    <header class="header">
      <div class="header-inner">
        <div class="logo">🌐 JR数字孪生平台</div>
        <nav class="nav">
          <a href="/" class="nav-link active">展示门户</a>
        </nav>
      </div>
    </header>

    <!-- Hero -->
    <section class="hero">
      <h1>3D 场景展示平台</h1>
      <p>浏览已发布的三维可视化场景与应用</p>
    </section>

    <!-- Filter -->
    <div class="container">
      <div class="filter-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['filter-btn', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Scenes Grid -->
      <section v-if="activeTab === 'scenes' || activeTab === 'all'">
        <h2 class="section-title" v-if="activeTab === 'all'">场景</h2>
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="scenes.length === 0" class="empty">暂无已发布场景</div>
        <div v-else class="card-grid">
          <router-link
            v-for="scene in scenes"
            :key="scene.sceneId"
            :to="`/scene/${scene.slug}`"
            class="card"
          >
            <div class="card-preview">
              <img v-if="scene.thumbnail" :src="scene.thumbnail" alt="" />
              <span v-else class="card-icon">🏝️</span>
            </div>
            <div class="card-body">
              <div class="card-title">{{ scene.name }}</div>
              <div class="card-desc">{{ scene.description || '暂无描述' }}</div>
              <div class="card-meta">
                <span>{{ scene.objectCount || 0 }} 个对象</span>
                <span>{{ formatDate(scene.publishedAt) }}</span>
              </div>
            </div>
          </router-link>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="scenePagination.totalPages > 1">
          <button :disabled="scenePagination.page <= 1" @click="loadScenes(scenePagination.page - 1)">‹ 上一页</button>
          <span class="page-info">{{ scenePagination.page }} / {{ scenePagination.totalPages }}</span>
          <button :disabled="scenePagination.page >= scenePagination.totalPages" @click="loadScenes(scenePagination.page + 1)">下一页 ›</button>
        </div>
      </section>

      <!-- Apps Grid -->
      <section v-if="activeTab === 'apps' || activeTab === 'all'">
        <h2 class="section-title" v-if="activeTab === 'all'">应用</h2>
        <div v-if="loadingApps" class="loading">加载中...</div>
        <div v-else-if="apps.length === 0" class="empty">暂无已发布应用</div>
        <div v-else class="card-grid">
          <div v-for="app in apps" :key="app.appId" class="card">
            <div class="card-preview">
              <img v-if="app.thumbnail" :src="app.thumbnail" alt="" />
              <span v-else class="card-icon">📊</span>
            </div>
            <div class="card-body">
              <div class="card-title">{{ app.name }}</div>
              <div class="card-desc">{{ app.description || '暂无描述' }}</div>
              <div class="card-meta">
                <span>{{ app.canvas?.width }}×{{ app.canvas?.height }}</span>
                <span>{{ formatDate(app.publishedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <p>JR数字孪生平台 · 低代码 3D 场景可视化平台</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { getPublishedScenes, getPublishedApps } from '../services/portalService';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'scenes', label: '场景' },
  { key: 'apps', label: '应用' },
];
const activeTab = ref('all');

const scenes = ref([]);
const scenePagination = ref({ page: 1, totalPages: 1 });
const loading = ref(false);

const apps = ref([]);
const loadingApps = ref(false);

const loadScenes = async (page = 1) => {
  loading.value = true;
  try {
    const result = await getPublishedScenes(page);
    scenes.value = result.scenes;
    scenePagination.value = result.pagination;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const loadApps = async () => {
  loadingApps.value = true;
  try {
    const result = await getPublishedApps();
    apps.value = result.apps;
  } catch (e) {
    console.error(e);
  } finally {
    loadingApps.value = false;
  }
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString();
};

watch(activeTab, () => {
  if (activeTab.value === 'scenes' || activeTab.value === 'all') loadScenes();
  if (activeTab.value === 'apps' || activeTab.value === 'all') loadApps();
});

onMounted(() => {
  loadScenes();
  loadApps();
});
</script>

<style scoped>
.header {
  background: #1a1a1a;
  border-bottom: 1px solid #2a2a2a;
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}
.nav-link {
  color: #aaa;
  font-size: 14px;
}
.nav-link.active { color: #4da6ff; }

.hero {
  text-align: center;
  padding: 60px 24px 40px;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f0f 100%);
}
.hero h1 {
  font-size: 36px;
  color: #fff;
  margin-bottom: 12px;
}
.hero p {
  font-size: 16px;
  color: #888;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 60px;
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
}
.filter-btn {
  padding: 8px 20px;
  border: 1px solid #333;
  background: transparent;
  color: #aaa;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.filter-btn.active {
  background: #4da6ff;
  border-color: #4da6ff;
  color: #fff;
}
.filter-btn:hover:not(.active) {
  border-color: #555;
  color: #fff;
}

.section-title {
  font-size: 20px;
  margin-bottom: 20px;
  color: #ccc;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.card {
  background: #1e1e1e;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  display: block;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

.card-preview {
  height: 160px;
  background: #151515;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.card-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card-icon {
  font-size: 48px;
}

.card-body {
  padding: 16px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-desc {
  font-size: 13px;
  color: #777;
  height: 36px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 10px;
}
.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #555;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}
.pagination button {
  padding: 8px 16px;
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #333;
  border-radius: 6px;
  cursor: pointer;
}
.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-info {
  color: #888;
  font-size: 14px;
}

.loading, .empty {
  text-align: center;
  padding: 60px 0;
  color: #666;
  font-size: 16px;
}

.footer {
  text-align: center;
  padding: 32px;
  color: #444;
  font-size: 13px;
  border-top: 1px solid #1a1a1a;
}
</style>
