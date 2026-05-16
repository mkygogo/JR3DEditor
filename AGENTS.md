# AGENTS.md — Meteor3D Project Guide

## Project Overview

Meteor3D 是一个**低代码 3D 场景可视化与编辑平台**，采用 pnpm monorepo 架构，包含后端服务、核心 SDK、场景编辑器、资产管理器、展示门户五大模块。支持拖拽式 3D 场景创建、GIS 坐标系统、实时资产处理流水线、场景发布与公开展示、云存储集成。

**技术栈**: Three.js + Vue3 + Express + MongoDB + Redis + Bull Queue + ECharts

---

## Monorepo Structure

```
JR3DEditor/                      # Root (pnpm workspace)
├── meteor3d-server/             # 后端 API 服务 (Express, port 3001)
├── packages/
│   ├── core/                    # 核心 3D 渲染 SDK (@meteor3d/core)
│   ├── scene-editor/            # 场景编辑器 SPA (@meteor3d/scene-editor, port 5173)
│   ├── asset-manager/           # 资产管理器 SPA (@meteor3d/asset-manager, port 5175)
│   └── portal/                  # 展示门户 SPA (@meteor3d/portal, port 5177)
├── meteor3d/                    # Vite 缓存目录
├── package.json                 # Monorepo 根配置
└── pnpm-workspace.yaml          # Workspace 定义
```

---

## Package Details

### 1. meteor3d-server (后端服务)

- **路径**: `meteor3d-server/`
- **运行时**: Node.js + Express 5
- **端口**: 3001
- **数据库**: MongoDB (Mongoose 9) + Redis (Bull Queue)
- **入口**: `app.js`

**启动命令**:
```bash
npm run dev     # 开发模式 (nodemon)
npm start       # 生产模式
```

**环境变量** (需要 `.env` 文件):
```env
PORT=3001
MONGODB_URI=mongodb://root:123456@127.0.0.1:27017/meteor3d
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=chenwei
UPYUN_SERVICE=...
UPYUN_OPERATOR=...
UPYUN_PASSWORD=...
OPENAI_API_KEY=...        # AI Chat 功能 (可选)
GOOGLE_AI_KEY=...         # Gemini (可选)
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
- **端口**: 5173

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
- **端口**: 5175

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
- **端口**: 5177

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
- Vite 代理 `/api` → `http://localhost:3001`
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
url (GLTF), modifications, geometry, material: {color, roughness, metalness, blending, side, transparent, depthTest, depthWrite, vertexColors}
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
- Node.js >= 18
- pnpm >= 10.2
- MongoDB (with auth)
- Redis

### Quick Start
```bash
# 安装依赖
pnpm install

# 配置后端环境变量
cp meteor3d-server/.env.example meteor3d-server/.env
# 编辑 .env 填入 MongoDB / Redis / Upyun 凭据

# 启动后端
cd meteor3d-server && npm run dev

# 启动场景编辑器 (新终端)
pnpm dev:scene

# 启动资产管理器 (新终端)
pnpm dev:asset

# 启动展示门户 (新终端)
pnpm dev:portal
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
- **Vite 代理**: 前端开发服务器代理 `/api` → `http://localhost:3001`

---

## Key Architecture Patterns

1. **Manager Pattern**: 核心 SDK 中每个功能由独立 Manager 类封装 (SceneManager → 子 Manager)
2. **Command Pattern**: 编辑器操作通过 CommandFactory 创建可撤销命令
3. **Pipeline Pattern**: 资产处理通过 Bull Queue 串行执行 6 步处理器
4. **Persistence Layer**: PersistenceManager 负责 Three.js 对象 ↔ JSON 序列化
5. **Event-Driven**: SceneManager 通过事件系统通知 UI 层变化
6. **Publish Workflow**: 场景/应用通过 publish API 标记发布状态，门户 SPA 通过 portal API 只展示已发布内容，slug 友好 URL 支持公开访问
7. **HUD Overlay**: HUD 配置随场景持久化（hudConfig 字段），编辑器通过 HudCanvas 可视化编辑，Portal 通过 HudOverlay 只读渲染
8. **Lazy Initialization**: 重资源（如 EffectComposer）延迟到首次使用时创建，避免空场景性能浪费

---

## Infrastructure Dependencies

| 服务 | 默认配置 | 用途 |
|------|---------|------|
| MongoDB | `127.0.0.1:27017`, db: `meteor3d`, user: `root` | 场景/资产/应用数据持久化 |
| Redis | `127.0.0.1:6379` | Bull 任务队列后端 |
| Upyun CDN | `youpaiyun.meteor3d.cn` | 处理后资产云存储 |
| Node.js | >= 18 | 后端运行时 |
| pnpm | >= 10.2 | 包管理器 |
