# AGENTS.md — Meteor3D Project Guide

## Project Overview

Meteor3D 是一个**低代码 3D 场景可视化与编辑平台**，采用 pnpm monorepo 架构，包含后端服务、核心 SDK、场景编辑器、资产管理器、展示门户五大模块。支持拖拽式 3D 场景创建、GIS 坐标系统、实时资产处理流水线、场景发布与公开展示、云存储集成。

**技术栈**: Three.js + Vue3 + Express + MongoDB + Redis + Bull Queue + ECharts

---

## Monorepo Structure

```
JR3DEditor/                      # Root (pnpm workspace)
├── meteor3d-server/             # 后端 API 服务 (Express, port 6001)
├── packages/
│   ├── core/                    # 核心 3D 渲染 SDK (@meteor3d/core)
│   ├── scene-editor/            # 场景编辑器 SPA (@meteor3d/scene-editor, port 6173)
│   ├── asset-manager/           # 资产管理器 SPA (@meteor3d/asset-manager, port 6175)
│   └── portal/                  # 展示门户 SPA (@meteor3d/portal, port 6177)
├── meteor3d/                    # Vite 缓存目录
├── package.json                 # Monorepo 根配置
└── pnpm-workspace.yaml          # Workspace 定义
```

---

## Package Details

### 1. meteor3d-server (后端服务)

- **路径**: `meteor3d-server/`
- **运行时**: Node.js + Express 5
- **端口**: 6001
- **数据库**: MongoDB (Mongoose 9) + Redis (Bull Queue)
- **入口**: `app.js`

**启动命令**:
```bash
npm run dev     # 开发模式 (nodemon)
npm start       # 生产模式
```

**环境变量** (需要 `.env` 文件):
```env
PORT=6001
MONGODB_URI=mongodb://<user>:<password>@127.0.0.1:27017/meteor3d?authSource=admin
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>
UPYUN_SERVICE_NAME=...
UPYUN_OPERATOR_NAME=...
UPYUN_PASSWORD=...
UPYUN_DOMAIN=...
OPENAI_API_KEY=...        # AI Chat 功能 (可选)
GOOGLE_AI_KEY=...         # Gemini (可选)
ZHIPU_API_KEY=...         # Chat controller currently requires a value at startup
```

**API 路由**:
| 前缀 | 功能 | 主要端点 |
|------|------|---------|
| `/api/scene` | 场景 CRUD + 发布 | list, create, load, save, delete, clear, basemap, `:id/publish`, `:id/unpublish` |
| `/api/assets` | 资产管理 | upload, list, get, delete, download, status, reprocess, register-tileset |
| `/api/app` | 应用管理 + 发布 | list, get, create, update, delete, `:id/publish`, `:id/unpublish` |
| `/api/chat` | AI 对话 | chat, chat/stream (SSE) |
| `/api/portal` | 公开展示 (只读) | scenes, scenes/:slug, apps, apps/:id |

**资产处理流水线** (Bull Queue, 6 步):
1. ZIP 解压 → 2. 格式转换 (OBJ/FBX/STL→GLB) → 3. 模型清洗 → 4. Draco 压缩 → 5. 纹理优化 (KTX2) → 6. LOD 生成 → 7. 包围盒计算 → 上传 Upyun CDN

**核心依赖**: `@gltf-transform`, `draco3dgltf`, `meshoptimizer`, `sharp`, `multer`, `bull`, `openai`

### 2. @meteor3d/core (核心 SDK)

- **路径**: `packages/core/`
- **构建输出**: UMD (`dist/meteor3d-core.umd.js`) + ES modules
- **全局变量名**: `Meteor3D`

**核心模块**:
| 模块 | 职责 |
|------|------|
| `SceneManager` | Three.js 场景/相机/渲染器初始化，集成所有子管理器 |
| `PersistenceManager` | 场景序列化/反序列化（含 HUD 配置） |
| `DBManager` | 后端 API 调用封装 |
| `CameraControlManager` | 多相机控制模式 (Orbit / Ghost FPS) |
| `GeoCoordinateSystem` | WGS84 ↔ 本地坐标转换 (proj4) |
| `TileMapManager` | 卫星影像瓦片加载 |
| `LabelManager` | 3D 标签（无标签时跳过渲染） |
| `OutlineManager` | 后处理描边（延迟初始化 EffectComposer） |
| `HighlightManager` | 高亮发光效果 |
| `LineManager` | 线条绘制 |
| `VFXManager` | 粒子特效 |
| `RainManager` / `SnowManager` | 天气粒子效果 |
| `StatsManager` | FPS 监控 |
| `RaycastManager` | 射线检测 |
| `TriangleStatsManager` | 三角形统计 |

**性能优化**:
- `powerPreference: 'high-performance'` — 强制使用独立显卡
- `Math.min(devicePixelRatio, 2)` — 防止超高 DPI 屏幕过度渲染
- 无 `logarithmicDepthBuffer`（仅 GIS 模式按需启用）
- OutlineManager 延迟创建 EffectComposer（首次 enable 时才分配 render target）
- LabelManager 无标签时跳过 CSS2DRenderer 渲染

**构建命令**: `pnpm build:core`

### 3. @meteor3d/scene-editor (场景编辑器)

- **路径**: `packages/scene-editor/`
- **框架**: Vue 3.5 + Vue Router 4 + Pinia 3
- **端口**: 6173

**路由**:
| 路径 | 视图 | 描述 |
|------|------|------|
| `/` | 重定向 → `/scenes` | |
| `/scenes` | `ScenesView` | 场景列表/创建/删除 |
| `/editor/:sceneId` | `EditorView` | 主编辑器界面 |

**编辑器布局**:
```
┌──────────────────────────────────────────────────────┐
│ Header: 首页链接 │ 场景标题 │ Toolbar (保存/撤销/重做) │
├──────────┬────────────────────────┬──────────────────┤
│ SceneTree│    Viewport (3D)       │ 右侧面板:         │
│ (对象树) │  + HudCanvas (覆盖层)  │ - 属性面板        │
│          │  + LibraryPanel(底部)  │ - 材质面板        │
│          │                        │ - 场景设置        │
│          │                        │ - GIS 设置        │
│          │                        │ - 天气效果        │
│          │                        │ - HUD 编辑器     │
└──────────┴────────────────────────┴──────────────────┘
```

**编辑器核心 (`src/core/`)**:
- `InputManager` — 鼠标/键盘输入、射线选取
- `TransformManager` — Gizmo 变换工具 (移动/旋转/缩放)
- `HistoryManager` — 撤销/重做栈 (Command 模式)
- `CommandFactory` — AddObject / DeleteObject / ModifyObject / MoveObject 命令

**HUD 系统 (`src/widgets/` + `src/components/Hud*` + `src/stores/hudStore.js`)**:
- `HudCanvas` — 自由定位画布，支持拖拽/缩放 widget
- `HudToolbar` — HUD 编辑模式工具栏
- `HudEditorPanel` — 右侧 HUD 属性编辑面板（布局/数据/样式 tab）
- `hudStore` — Pinia 状态管理（widget 列表、选中、编辑模式）
- `WidgetRenderer` — 统一 widget 渲染器（按 type 动态加载组件）
- **Widget 类型**: stat-card, progress-bar, pie-chart, gauge-chart, bar-chart, line-chart, text-label, image, button, alert-list, data-table, divider, container
- **Widget 定位**: 百分比坐标 (x, y, width, height)，支持自由拖拽和缩放
- **数据源**: 静态数据 / 模拟随机数据（可扩展 API 数据源）
- **图表引擎**: ECharts 6.0
- **模板系统**: 预设布局模板 (如 digital-park.json)

**启动命令**: `pnpm dev:scene`

### 4. @meteor3d/asset-manager (资产管理器)

- **路径**: `packages/asset-manager/`
- **框架**: Vue 3 + Pinia
- **端口**: 6175

**功能**:
- 上传 3D 资产 (GLB, OBJ, FBX, STL, ZIP)
- 上传纹理 (JPG, PNG) / HDRI (HDR, EXR)
- 注册 3D Tiles URL
- 查看处理状态 (pending → processing → ready/failed)
- 资产分类过滤 (模型/纹理/HDRI/3D Tiles)
- 分页浏览和下载

**启动命令**: `pnpm dev:asset`

### 5. @meteor3d/portal (展示门户)

- **路径**: `packages/portal/`
- **框架**: Vue 3 + Vue Router 4
- **端口**: 6177

**路由**:
| 路径 | 视图 | 描述 |
|------|------|------|
| `/` | `HomeView` | 首页：已发布场景/应用卡片网格 + 筛选 + 分页 |
| `/scene/:slug` | `SceneViewerView` | 全屏 3D 场景查看器 (使用 `loadScene()`) |

**功能**:
- 浏览所有已发布的 3D 场景和应用
- 全屏 3D 场景查看器（基于核心 SDK 的 `loadScene()`）
- HUD 覆盖层：自动加载场景中保存的 HUD 配置并渲染 widget
- 查看器工具栏：相机模式切换 (Orbit/Ghost)、FPS 统计、全屏（默认隐藏，鼠标移到顶部自动下拉）
- 场景/应用筛选标签页
- 分页导航
- Vite 代理 `/api` → `http://localhost:6001` (via Vite proxy)
- Vite 别名 `@widgets` → `scene-editor/src/widgets`（复用 widget 组件）

**启动命令**: `pnpm dev:portal`

---

## Data Models (MongoDB)

### Scene
```
sceneId, name, description, thumbnail, environmentUrl,
cameraFar (default: 1000000),
cloudUrls: { environment, baseMap },
gisConfig: { enable, center: {lng, lat}, size, bounds, projection, gridVisible, baseMapUrl, showBaseMap },
hudConfig: { widgets: [{ id, type, name, x, y, width, height, data, style }] },
published (Boolean, default: false), publishedAt (Date), slug (String, unique sparse)
```

### SceneObject
```
id, sceneId (indexed), type, name, visible,
position: {x,y,z}, rotation: {x,y,z}, scale: {x,y,z},
url (GLTF), customProperties [{key,label,value,type}], modifications, geometry, material: {color, roughness, metalness, blending, side, transparent, depthTest, depthWrite, vertexColors}
```

### Asset
```
name, originalName, type: [model|texture|hdri|effect|tileset], format, filePath, fileSize, url, thumbnail,
processingStatus: [pending|processing|ready|failed|skipped], processingError,
processedFiles: { compressed, lod0, lod1, lod2, textures: {original, 2k, 1k, 512} },
cloudUrls: { compressed, lod0-2, textures }
```

### App
```
appId, name, description, thumbnail,
canvas: { width: 1920, height: 1080, background },
widgets: [{ id, type, name, position, size, rotation, data, enabled, interactions }],
published (Boolean, default: false), publishedAt (Date), sceneId (String)
```

---

## Development Workflow

### Prerequisites
- Node.js >= 20.19.0 (or >= 22.12.0 for Vite 7 frontends)
- pnpm >= 10.2
- MongoDB (with auth)
- Redis

### Quick Start
```bash
# 安装依赖
pnpm install

# 配置后端环境变量
# 当前仓库未提交 meteor3d-server/.env.example；首次部署请手动创建 .env
# 编辑 .env 填入 MongoDB / Redis / Upyun 凭据，禁止提交真实密钥

# 启动后端
cd meteor3d-server && npm run dev

# 启动场景编辑器 (新终端)
pnpm --filter @meteor3d/scene-editor dev --host 0.0.0.0

# 启动资产管理器 (新终端)
pnpm --filter @meteor3d/asset-manager dev --host 0.0.0.0

# 启动展示门户 (新终端)
pnpm --filter @meteor3d/portal dev --host 0.0.0.0
```

### Build
```bash
pnpm build:core      # 构建核心 SDK
pnpm build:scene     # 构建场景编辑器
pnpm build:asset     # 构建资产管理器
pnpm build:portal    # 构建展示门户
pnpm build:all       # 构建所有包
```

---

## Docker / Production Deployment

### Cloud server layout

The production Docker deployment lives at `/home/ubuntu/jr3d-editor` on the cloud server. The LAN development checkout remains the source of truth for Git work at `~/CloudTwin_vue/JR3DEditor`.

### Docker files

| File | Purpose |
|------|---------|
| `Dockerfile.frontend` | Builds core, scene-editor, asset-manager, and portal, then serves them with Nginx |
| `Dockerfile.server` | Builds the Express backend on Node 20 and prepares upload directories |
| `docker-compose.prod.yml` | Runs `jr3d-frontend`, `jr3d-backend`, `jr3d-mongo`, and `jr3d-redis` |
| `docker/nginx.conf` | HTTPS reverse proxy and SPA routing for editor, asset manager, portal, API, and uploads |
| `deploy-cloud.sh` | Local production helper that unpacks certs into `deploy/ssl` and runs Docker Compose |

### Production URLs

| App | URL |
|-----|-----|
| Scene editor | `https://test.shjrinfo.com:8443/editor/scenes` |
| Asset manager | `https://test.shjrinfo.com:8443/asset/` |
| Portal | `https://test.shjrinfo.com:8443/portal/` |
| API | Same-origin `/api/...` through Nginx |
| Uploads | Same-origin `/uploads/...` through Nginx |

### Important production rules

- Frontend production env should keep `VITE_API_BASE_URL` empty so apps call same-origin `/api`; do not point browser builds at `pro-server.meteor3d.cn`.
- Vite bases are controlled by `VITE_BASE_PATH`: `/editor/`, `/asset/`, and `/portal/` in Docker builds.
- Portal uses `createWebHistory(import.meta.env.BASE_URL)`; published scene links must include the portal base path.
- Scene publish toast links are generated as `window.location.origin + /portal + viewUrl` in production. Development may use port `6177`, but production must never hard-code `5177`.
- Nginx intentionally does not enable HTTP/2 for this service because large GLB uploads previously failed with `ERR_HTTP2_PING_FAILED` / Nginx `499`.
- Nginx upload proxying uses `client_max_body_size 1024m`, `proxy_request_buffering off`, `proxy_buffering off`, and 600s timeouts for `/api/` and `/uploads/`.
- SSL certificate zip files and unpacked `deploy/ssl` contents are deployment secrets and must not be committed.
- Current portal branding is `JR数字孪生平台`; scene editor title is `JR数字孪生开发平台`.

### Upyun behavior

Upyun is optional CDN/object storage for processed assets and thumbnails. Local uploads and processing still write into the backend upload volume first. If Upyun env vars are empty or invalid, local assets can still work, but cloud URL fields such as `cloudUrls.compressed` or `cloudUrls.thumbnail` may be absent. Treat Upyun upload failures as CDN sync failures unless the local upload route itself fails.

---

## Coding Conventions

- **包管理器**: pnpm (workspace protocol `workspace:*`)
- **前端框架**: Vue 3 Composition API + `<script setup>`
- **状态管理**: Pinia (stores in `src/stores/`)
- **3D 引擎**: Three.js 0.181, ACESFilmic tone mapping, sRGB color space
- **后端**: Express 5, Mongoose ODM, async/await controllers
- **文件上传**: Multer, 50MB body limit
- **队列**: Bull (Redis-backed), 3 retries + exponential backoff
- **云存储**: Upyun CDN
- **坐标系**: WGS84 ↔ proj4 投影转换
- **API 前缀**: `/api/` (scene, assets, app, chat)
- **Vite 代理**: 前端开发服务器代理 `/api` 和 `/uploads` → `http://localhost:6001`

---

## Key Architecture Patterns

1. **Manager Pattern**: 核心 SDK 中每个功能由独立 Manager 类封装 (SceneManager → 子 Manager)
2. **Command Pattern**: 编辑器操作通过 CommandFactory 创建可撤销命令
3. **Pipeline Pattern**: 资产处理通过 Bull Queue 串行执行主要处理阶段
4. **Persistence Layer**: PersistenceManager 负责 Three.js 对象 ↔ JSON 序列化
5. **Event-Driven**: SceneManager 通过事件系统通知 UI 层变化
6. **Publish Workflow**: 场景/应用通过 publish API 标记发布状态，门户 SPA 通过 portal API 只展示已发布内容，slug 友好 URL 支持公开访问
7. **HUD Overlay**: HUD 配置随场景持久化（hudConfig 字段），编辑器通过 HudCanvas 可视化编辑，Portal 通过 HudOverlay 只读渲染
8. **Lazy Initialization**: 重资源（如 EffectComposer）延迟到首次使用时创建，避免空场景性能浪费

---

## HUD 数据绑定系统（v2024.5）

**概述**：低代码数据绑定引擎，让 HUD Widget 实时读取 3D 场景对象属性并支持交互动作。编辑器提供可视化配置，门户支持发布场景后的只读绑定。

### 核心模块 (`packages/core/src/binding/`)

| 文件 | 功能 |
|------|------|
| `constants.js` | 枚举常量（绑定模式、映射方向、动作触发器、目标模式） |
| `pathResolver.js` | 对象路径白名单、值类型推断、路径读写接口 |
| `transformRegistry.js` | 8 种值转换器（保留小数、范围限制、缩放、弧度转角度、布尔标签、模板字符串等） |
| `actionExecutors.js` | 4 种动作执行器（高亮、相机聚焦、切换可见、设置属性） |
| `BindingManager.js` | 核心管理器：绑定解析、属性同步、事件驱动、动作分发 |
| `index.js` | 统一导出接口 |

### 绑定模式（4 种）

| 模式 | 说明 | 用途 |
|------|------|------|
| `static` | 静态数据 | Widget 显示固定值 |
| `context-selected` | 跟随选中对象（兼容模式） | 编辑器中动态追踪当前选中的场景对象 |
| `object-id` | 指定对象 UUID | 编辑器和门户中精确绑定固定对象 |
| `bound-object` | 当前 Widget 绑定对象 | 动作目标默认指向该 Widget 的数据源对象 |

### 属性映射（READ/WRITE/BOTH）

可绑定的对象属性路径（白名单）：
- `position.x/y/z` — 位置坐标
- `rotation.x/y/z` — 欧拉角
- `scale.x/y/z` — 缩放系数
- `name` — 对象名称
- `visible` — 可见性
- `userData.*` — 自定义数据

### 动作系统（4 种）

| 动作 | 触发器 | 目标 | 效果 |
|------|--------|------|------|
| `highlight-object` | click/hover-enter | 绑定/选中/指定对象 | 发光高亮 2s 自动还原 |
| `camera-focus` | click/hover-enter | 绑定/选中/指定对象 | 1s 内相机聚焦至对象 |
| `toggle-visible` | click/value-change | 绑定/选中/指定对象 | 切换可见性 |
| `set-property` | click/value-change | 绑定/选中/指定对象 | 写入任意可写属性 |

### Implementation Status (current master)

The HUD data binding system is implemented in the current `master` branch. Important integration points:

- `packages/core/src/SceneManager.js` owns a lightweight event bus: `on()`, `off()`, `emit()`, `setReady()`, and scene/object lifecycle events used by bindings.
- `packages/core/index.js` exports the binding modules, so apps can import `BindingManager` and related constants from `@meteor3d/core`.
- `packages/scene-editor/src/components/Viewport.vue` creates the editor `BindingManager`, enables write-back, listens for scene/object/HUD changes, and pushes live binding data into `hudStore`.
- `packages/scene-editor/src/stores/hudStore.js` now exposes `updateWidgetBinding()`, `updateWidgetActions()`, and `getAvailableObjects()` for the binding and action editors.
- `packages/portal/src/views/SceneViewerView.vue` creates a read-only `BindingManager` for published scenes, converts scene clicks into `object:selected`, and uses that selection for `context-selected` HUD bindings; `packages/portal/src/components/HudOverlay.vue` merges live data and dispatches widget click triggers.
- `packages/scene-editor/src/components/Toolbar.vue` no longer owns HUD quick actions; HUD editing controls live in the HUD-specific canvas/panel flow.

### 编辑器集成（6173）

**右侧 HUD 编辑面板新增 Tab**：
- **"绑定" Tab**（`DataBindingEditor.vue`）
  - 选择绑定模式（静态/跟随选中/指定对象）
  - 添加属性映射（源属性 → 目标字段 → 值变换）；源属性来自 `PathSelector.vue`，使用 `getGroupedPaths()` 返回的 `{ group, paths }` 数组结构
  - 多字段对象详情优先使用 `object-info-panel` 组件；每个字段的绑定目标形如 `data.fields.0.value`，适合 `context-selected` 场景对象信息展示。
  - 场景对象业务字段保存在 `object.userData.customProperties`，属性面板可编辑，绑定路径为 `custom.<key>`，后端 `SceneObject.customProperties` 会持久化。
  - 对象选择器和路径选择器下拉
  
- **"动作" Tab**（`ActionsEditor.vue`）
  - 每条动作配置：触发器 + 动作类型 + 目标模式 + 可选参数
  - 支持多条动作链

**Viewport.vue 集成**：
- `BindingManager` 在场景加载后初始化，write-back 启用
- 监听 `hudConfig` 变化自动 `rebindAll()`
- 订阅 `binding:value-updated` 事件，推送实时数据到 `hudStore`
- `setNestedVal()` 工具函数支持点路径赋值

**事件发射**（通过 SceneManager）：
- `object:selected` — 选中对象时发出
- `object:transform` — 变换完成或属性面板修改时发出
- `object:renamed` — 名称修改时发出
- `object:visibility` — 可见性变化时发出
- `object:added/removed` — 对象添加/删除时发出

### 门户集成（6177）

**SceneViewerView.vue**：
- 场景加载后创建 `BindingManager`（只读模式 `allowWriteBack: false`）
- `liveWidgetData` 响应式对象接收实时绑定数据，并支持点路径字段写入
- 订阅 `binding:value-updated` 事件，只需读取无需写回
- 监听 `scene-click` 并发出 `object:selected`，让 `context-selected` 绑定随用户点击场景对象刷新

**HudOverlay.vue**：
- 新增 props：`bindingManager`、`liveData`
- `mergedWidget()` 深度合并原始 widget 配置 + 实时绑定数据（不破坏原始 hudConfig）
- `onWidgetClick()` 分发 click 触发器到 `bindingManager.dispatchWidgetTrigger()`
- Portal 运行态必须阻止 HUD pointer/click 事件继续穿透到 3D canvas，避免 widget 点击同时触发场景控制器/射线检测。
- HUD 的 `highlight-object` 动作优先使用 `HighlightManager` 材质高亮；不要默认走 `OutlineManager`，大场景后处理容易让展示页卡顿。

**功能**：发布场景后，门户显示该场景的 HUD Widget，Widget 中的绑定数据实时跟踪 3D 对象属性；点击 Widget 可触发高亮/聚焦等动作。

### 核心 API

```javascript
// 初始化
const bm = new BindingManager({
  sceneManager,
  hudConfigProvider: () => hudConfig,
  selectionProvider: () => selectedObject,
  objectResolver: (uuid) => sceneManager.getObjectByUUID(uuid),
  allowWriteBack: true,
  onEvent: (type, payload) => { /* binding:value-updated等事件 */ }
});

// 生命周期
bm.start();           // 开始绑定与事件监听
bm.rebindAll();       // 重新解析所有 widget 绑定
bm.rebindWidget(id);  // 重新解析单个 widget
bm.stop();            // 停止并清理
bm.dispose();         // 完全释放

// 同步
bm.syncRead(widgetId);           // 手动同步该 widget 的所有读映射
bm.applyWidgetInput(widgetId, { field: value });  // 应用 widget 输入（写映射）

// 动作
bm.dispatchWidgetTrigger(widgetId, 'click', { /* eventData */ });

// 查询
bm.getWidgetStatus(widgetId);       // 返回 OK/DEGRADED/ERROR
bm.getWidgetRuntimeData(widgetId);  // 获取含绑定数据的完整 widget.data
bm.validateConfig(hudConfig);       // 验证配置有效性
```

### 数据模型扩展

**Scene.hudConfig** 新增字段：
```javascript
{
  widgets: [{
    id: 'w_xxx',
    type: 'stat-card',
    name: '位置 X',
    x: 10, y: 10, width: 20, height: 15,
    data: { title: '位置', value: 0 },
    style: { ... },
    
    // 新增：数据绑定配置
    dataBinding: {
      mode: 'object-id',  // static | context-selected | object-id | bound-object
      source: { objectId: 'uuid-of-cube' },
      mappings: [{
        id: 'm_1',
        objectPath: 'position.x',
        widgetField: 'value',
        direction: 'read',  // read | write | both
        transform: {
          read: { id: 'number.toFixed', params: { digits: 2 } }
        }
      }],
      updatePolicy: 'event'
    },
    
    // 新增：动作配置
    actions: [{
      id: 'a_1',
      enabled: true,
      trigger: 'click',          // click | hover-enter | hover-leave | value-change
      type: 'camera-focus',      // highlight-object | camera-focus | toggle-visible | set-property
      target: {
        mode: 'bound-object',    // bound-object | context-selected | object-id
        objectId: null
      },
      payload: { fitPadding: 1.5, durationMs: 1000 }
    }]
  }]
}
```


---

## Agent Operating Notes

### Current Workspace Reality

- `pnpm-workspace.yaml` currently includes only `packages/*` and `meteor3d-server`.
- Existing workspace packages: `@meteor3d/core`, `@meteor3d/scene-editor`, `@meteor3d/asset-manager`, `@meteor3d/portal`, and `meteor3d-server`.
- Root scripts `dev:ai-scene`, `dev:docs`, `dev:scene-webgpu`, `build:ai-scene`, and `build:docs` currently point to packages that are not present in this checkout. Do not treat them as working commands unless those packages are restored.
- `meteor3d/` is mainly a Vite cache directory. Do not edit or commit it during normal feature work.
- The repo has `pnpm-lock.yaml` plus some `package-lock.json` files. Default to pnpm; only touch npm lockfiles when intentionally maintaining an npm install path.

### Environment Files and Secrets

- Never commit `.env`, real database passwords, Redis passwords, Upyun credentials, or AI API keys.

- Do not commit `test.shjrinfo.com_nginx.zip`, `deploy/ssl/`, `docker/nginx.conf.bak-*`, runtime uploads, or any real certificate/key material.
- Frontend env files live under `packages/scene-editor/.env.*` and `packages/asset-manager/.env.*`; the backend needs `meteor3d-server/.env` at runtime.
- When adding a new env var, update this file and README with placeholders only.

### Verification Matrix

Choose the smallest useful verification for the changed area:

| Changed area | Recommended verification |
|-------------|--------------------------|
| `packages/core` | `pnpm build:core`, then smoke-test one frontend that consumes core |
| `packages/scene-editor` | `pnpm build:scene`; for UI work, run `pnpm --filter @meteor3d/scene-editor dev --host 0.0.0.0` and check the editor |
| `packages/asset-manager` | `pnpm build:asset`, then check upload/list views |
| `packages/portal` | `pnpm build:portal`, then check published scene loading and HUD overlay rendering |
| `meteor3d-server` | `cd meteor3d-server && npm run dev`, then check `/api` routes plus MongoDB/Redis connectivity |
| HUD binding | Check editor config UI, core `BindingManager`, and portal read-only rendering together |
| Data model or persistence | Check Mongoose models, controllers, core `PersistenceManager`, and portal load paths together |

### LAN Deployment Notes

For LAN testing, Vite dev servers must bind to `0.0.0.0`:

```bash
pnpm --filter @meteor3d/scene-editor dev --host 0.0.0.0
pnpm --filter @meteor3d/asset-manager dev --host 0.0.0.0
pnpm --filter @meteor3d/portal dev --host 0.0.0.0
```

The backend listens on `PORT=6001`. When the browser opens the Vite frontend from another LAN device, API calls to `/api` are still proxied by the Ubuntu Vite server to its local backend at `http://localhost:6001`.

### Cross-Package Coupling

- HUD widgets live mainly in `packages/scene-editor/src/widgets/`; portal reuses them through aliases. When adding or renaming a widget, check `WidgetRenderer`, editor property panels, and `packages/portal/src/components/HudOverlay.vue`.
- Scene save/load spans backend `Scene` and `SceneObject` models/controllers, `packages/core/src/PersistenceManager.js`, and editor stores.
- GIS changes often span `GeoCoordinateSystem`, `TileMapManager`, editor GIS panels, and backend basemap generation.
- Asset processing spans backend pipeline code, the `Asset` model, asset-manager status UI, and core/editor model loading paths.
- Uploaded GLB/CAD assets may have very small model-space units. `Viewport.vue` auto-scales only tiny dropped GLTF assets (`max dimension < 0.5`) so the object is visible after drag-and-drop while preserving normal-scale models.
- Scene editor drag-and-drop tries the processed/compressed GLB first and falls back to the raw uploaded GLB, so a Draco/processing-specific browser load failure does not prevent the object from being added to the scene tree.
- GLB files are loaded as a single top-level model in the scene tree. Do not reset child-node transforms from imported GLBs; CAD/BIM files often store required offsets/scales on child nodes.
- Imported GLB assets are wrapped in an editor-owned root `Group`; the original GLB scene stays inside it and is centered by bounds so gizmo coordinates match the visible model. Selection resolves child mesh clicks back to that wrapper.


### Recent Bug Fix Notes

- Loading a different scene must clear both Three.js objects and HUD state. `PersistenceManager.loadScene()` resets `sceneManager.hudConfig`; `hudStore.restoreFromScene()` resets to `{ enabled: false, widgets: [] }` when a scene has no HUD config.
- Published portal HUD widgets must stop pointer/click propagation so UI clicks do not also trigger 3D canvas selection or camera controls.
- Portal scene clicks emit `object:selected`; this is required for `context-selected` HUD bindings in published scenes.
- Object information panels should bind to `custom.<key>` for business fields stored on scene objects, or to built-in paths such as `name`, `position.x`, etc.
- Imported GLB models must stay as one scene-tree object through the editor wrapper group. Do not expose or save every child mesh as a separate top-level scene object.
- When creating a new scene, backend metadata is intentionally empty: do not seed HUD widgets from client state or previous scenes.
- Production publish links should resolve to `/portal/scene/:slug` under the current origin.

### Code Change Guardrails

- Keep Vue code in the existing Vue 3 Composition API and `<script setup>` style.
- Prefer existing Manager, Command, Pipeline, and Persistence patterns before adding new abstractions.
- Be careful with global renderer settings, camera near/far values, coordinate transforms, and persistence schemas; these can affect existing saved scenes.
- Before adding dependencies, check whether an existing package already solves the problem and document why the new dependency is needed.
- Only modify lockfiles after a real dependency install or upgrade.


---

## Infrastructure Dependencies

| 服务 | 默认配置 | 用途 |
|------|---------|------|
| MongoDB | `127.0.0.1:27017`, db: `meteor3d`, user: `root` | 场景/资产/应用数据持久化 |
| Redis | `127.0.0.1:6379` | Bull 任务队列后端 |
| Upyun CDN | `youpaiyun.meteor3d.cn` | 处理后资产云存储 |
| Node.js | >= 20.19.0 / >= 22.12.0 | 前端 Vite 7 与后端运行时 |
| pnpm | >= 10.2 | 包管理器 |
