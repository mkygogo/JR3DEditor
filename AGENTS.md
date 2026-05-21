# AGENTS.md 鈥?Meteor3D Project Guide

## Project Overview

Meteor3D 鏄竴涓?*浣庝唬鐮?3D 鍦烘櫙鍙鍖栦笌缂栬緫骞冲彴**锛岄噰鐢?pnpm monorepo 鏋舵瀯锛屽寘鍚悗绔湇鍔°€佹牳蹇?SDK銆佸満鏅紪杈戝櫒銆佽祫浜х鐞嗗櫒銆佸睍绀洪棬鎴蜂簲澶фā鍧椼€傛敮鎸佹嫋鎷藉紡 3D 鍦烘櫙鍒涘缓銆丟IS 鍧愭爣绯荤粺銆佸疄鏃惰祫浜у鐞嗘祦姘寸嚎銆佸満鏅彂甯冧笌鍏紑灞曠ず銆佷簯瀛樺偍闆嗘垚銆?
**鎶€鏈爤**: Three.js + Vue3 + Express + MongoDB + Redis + Bull Queue + ECharts

---

## Monorepo Structure

```
JR3DEditor/                      # Root (pnpm workspace)
鈹溾攢鈹€ meteor3d-server/             # 鍚庣 API 鏈嶅姟 (Express, port 6001)
鈹溾攢鈹€ packages/
鈹?  鈹溾攢鈹€ core/                    # 鏍稿績 3D 娓叉煋 SDK (@meteor3d/core)
鈹?  鈹溾攢鈹€ scene-editor/            # 鍦烘櫙缂栬緫鍣?SPA (@meteor3d/scene-editor, port 6173)
鈹?  鈹溾攢鈹€ asset-manager/           # 璧勪骇绠＄悊鍣?SPA (@meteor3d/asset-manager, port 6175)
鈹?  鈹斺攢鈹€ portal/                  # 灞曠ず闂ㄦ埛 SPA (@meteor3d/portal, port 6177)
鈹溾攢鈹€ meteor3d/                    # Vite 缂撳瓨鐩綍
鈹溾攢鈹€ package.json                 # Monorepo 鏍归厤缃?鈹斺攢鈹€ pnpm-workspace.yaml          # Workspace 瀹氫箟
```

---

## Package Details

### 1. meteor3d-server (鍚庣鏈嶅姟)

- **璺緞**: `meteor3d-server/`
- **杩愯鏃?*: Node.js + Express 5
- **绔彛**: 6001
- **鏁版嵁搴?*: MongoDB (Mongoose 9) + Redis (Bull Queue)
- **鍏ュ彛**: `app.js`

**鍚姩鍛戒护**:
```bash
npm run dev     # 寮€鍙戞ā寮?(nodemon)
npm start       # 鐢熶骇妯″紡
```

**鐜鍙橀噺** (闇€瑕?`.env` 鏂囦欢):
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
OPENAI_API_KEY=...        # AI Chat 鍔熻兘 (鍙€?
GOOGLE_AI_KEY=...         # Gemini (鍙€?
ZHIPU_API_KEY=...         # Chat controller currently requires a value at startup
```

**API 璺敱**:
| 鍓嶇紑 | 鍔熻兘 | 涓昏绔偣 |
|------|------|---------|
| `/api/scene` | 鍦烘櫙 CRUD + 鍙戝竷 | list, create, load, save, delete, clear, basemap, `:id/publish`, `:id/unpublish` |
| `/api/assets` | 璧勪骇绠＄悊 | upload, list, get, delete, download, status, reprocess, register-tileset |
| `/api/app` | 搴旂敤绠＄悊 + 鍙戝竷 | list, get, create, update, delete, `:id/publish`, `:id/unpublish` |
| `/api/chat` | AI 瀵硅瘽 | chat, chat/stream (SSE) |
| `/api/portal` | 鍏紑灞曠ず (鍙) | scenes, scenes/:slug, apps, apps/:id |

**璧勪骇澶勭悊娴佹按绾?* (Bull Queue, 6 姝?:
1. ZIP 瑙ｅ帇 鈫?2. 鏍煎紡杞崲 (OBJ/FBX/STL鈫扜LB) 鈫?3. 妯″瀷娓呮礂 鈫?4. Draco 鍘嬬缉 鈫?5. 绾圭悊浼樺寲 (KTX2) 鈫?6. LOD 鐢熸垚 鈫?7. 鍖呭洿鐩掕绠?鈫?涓婁紶 Upyun CDN

**鏍稿績渚濊禆**: `@gltf-transform`, `draco3dgltf`, `meshoptimizer`, `sharp`, `multer`, `bull`, `openai`

### 2. @meteor3d/core (鏍稿績 SDK)

- **璺緞**: `packages/core/`
- **鏋勫缓杈撳嚭**: UMD (`dist/meteor3d-core.umd.js`) + ES modules
- **鍏ㄥ眬鍙橀噺鍚?*: `Meteor3D`

**鏍稿績妯″潡**:
| 妯″潡 | 鑱岃矗 |
|------|------|
| `SceneManager` | Three.js 鍦烘櫙/鐩告満/娓叉煋鍣ㄥ垵濮嬪寲锛岄泦鎴愭墍鏈夊瓙绠＄悊鍣?|
| `PersistenceManager` | 鍦烘櫙搴忓垪鍖?鍙嶅簭鍒楀寲锛堝惈 HUD 閰嶇疆锛?|
| `DBManager` | 鍚庣 API 璋冪敤灏佽 |
| `CameraControlManager` | 澶氱浉鏈烘帶鍒舵ā寮?(Orbit / Ghost FPS) |
| `GeoCoordinateSystem` | WGS84 鈫?鏈湴鍧愭爣杞崲 (proj4) |
| `TileMapManager` | 鍗槦褰卞儚鐡︾墖鍔犺浇 |
| `LabelManager` | 3D 鏍囩锛堟棤鏍囩鏃惰烦杩囨覆鏌擄級 |
| `OutlineManager` | 鍚庡鐞嗘弿杈癸紙寤惰繜鍒濆鍖?EffectComposer锛?|
| `HighlightManager` | 楂樹寒鍙戝厜鏁堟灉 |
| `LineManager` | 绾挎潯缁樺埗 |
| `VFXManager` | 绮掑瓙鐗规晥 |
| `RainManager` / `SnowManager` | 澶╂皵绮掑瓙鏁堟灉 |
| `StatsManager` | FPS 鐩戞帶 |
| `RaycastManager` | 灏勭嚎妫€娴?|
| `TriangleStatsManager` | 涓夎褰㈢粺璁?|

**鎬ц兘浼樺寲**:
- `powerPreference: 'high-performance'` 鈥?寮哄埗浣跨敤鐙珛鏄惧崱
- `Math.min(devicePixelRatio, 2)` 鈥?闃叉瓒呴珮 DPI 灞忓箷杩囧害娓叉煋
- 鏃?`logarithmicDepthBuffer`锛堜粎 GIS 妯″紡鎸夐渶鍚敤锛?- OutlineManager 寤惰繜鍒涘缓 EffectComposer锛堥娆?enable 鏃舵墠鍒嗛厤 render target锛?- LabelManager 鏃犳爣绛炬椂璺宠繃 CSS2DRenderer 娓叉煋

**鏋勫缓鍛戒护**: `pnpm build:core`

### 3. @meteor3d/scene-editor (鍦烘櫙缂栬緫鍣?

- **璺緞**: `packages/scene-editor/`
- **妗嗘灦**: Vue 3.5 + Vue Router 4 + Pinia 3
- **绔彛**: 6173

**璺敱**:
| 璺緞 | 瑙嗗浘 | 鎻忚堪 |
|------|------|------|
| `/` | 閲嶅畾鍚?鈫?`/scenes` | |
| `/scenes` | `ScenesView` | 鍦烘櫙鍒楄〃/鍒涘缓/鍒犻櫎 |
| `/editor/:sceneId` | `EditorView` | 涓荤紪杈戝櫒鐣岄潰 |

**缂栬緫鍣ㄥ竷灞€**:
```
鈹屸攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?鈹?Header: 棣栭〉閾炬帴 鈹?鍦烘櫙鏍囬 鈹?Toolbar (淇濆瓨/鎾ら攢/閲嶅仛) 鈹?鈹溾攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?鈹?SceneTree鈹?   Viewport (3D)       鈹?鍙充晶闈㈡澘:         鈹?鈹?(瀵硅薄鏍? 鈹? + HudCanvas (瑕嗙洊灞?  鈹?- 灞炴€ч潰鏉?       鈹?鈹?         鈹? + LibraryPanel(搴曢儴)  鈹?- 鏉愯川闈㈡澘        鈹?鈹?         鈹?                       鈹?- 鍦烘櫙璁剧疆        鈹?鈹?         鈹?                       鈹?- GIS 璁剧疆        鈹?鈹?         鈹?                       鈹?- 澶╂皵鏁堟灉        鈹?鈹?         鈹?                       鈹?- HUD 缂栬緫鍣?    鈹?鈹斺攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹粹攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹粹攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹?```

**缂栬緫鍣ㄦ牳蹇?(`src/core/`)**:
- `InputManager` 鈥?榧犳爣/閿洏杈撳叆銆佸皠绾块€夊彇
- `TransformManager` 鈥?Gizmo 鍙樻崲宸ュ叿 (绉诲姩/鏃嬭浆/缂╂斁)
- `HistoryManager` 鈥?鎾ら攢/閲嶅仛鏍?(Command 妯″紡)
- `CommandFactory` 鈥?AddObject / DeleteObject / ModifyObject / MoveObject 鍛戒护

**HUD 绯荤粺 (`src/widgets/` + `src/components/Hud*` + `src/stores/hudStore.js`)**:
- `HudCanvas` 鈥?鑷敱瀹氫綅鐢诲竷锛屾敮鎸佹嫋鎷?缂╂斁 widget
- `HudToolbar` 鈥?HUD 缂栬緫妯″紡宸ュ叿鏍?- `HudEditorPanel` 鈥?鍙充晶 HUD 灞炴€х紪杈戦潰鏉匡紙甯冨眬/鏁版嵁/鏍峰紡 tab锛?- `hudStore` 鈥?Pinia 鐘舵€佺鐞嗭紙widget 鍒楄〃銆侀€変腑銆佺紪杈戞ā寮忥級
- `WidgetRenderer` 鈥?缁熶竴 widget 娓叉煋鍣紙鎸?type 鍔ㄦ€佸姞杞界粍浠讹級
- **Widget 绫诲瀷**: stat-card, progress-bar, pie-chart, gauge-chart, bar-chart, line-chart, text-label, image, button, alert-list, data-table, divider, container
- **Widget 瀹氫綅**: 鐧惧垎姣斿潗鏍?(x, y, width, height)锛屾敮鎸佽嚜鐢辨嫋鎷藉拰缂╂斁
- **鏁版嵁婧?*: 闈欐€佹暟鎹?/ 妯℃嫙闅忔満鏁版嵁锛堝彲鎵╁睍 API 鏁版嵁婧愶級
- **鍥捐〃寮曟搸**: ECharts 6.0
- **妯℃澘绯荤粺**: 棰勮甯冨眬妯℃澘 (濡?digital-park.json)

**鍚姩鍛戒护**: `pnpm dev:scene`

### 4. @meteor3d/asset-manager (璧勪骇绠＄悊鍣?

- **璺緞**: `packages/asset-manager/`
- **妗嗘灦**: Vue 3 + Pinia
- **绔彛**: 6175

**鍔熻兘**:
- 涓婁紶 3D 璧勪骇 (GLB, OBJ, FBX, STL, ZIP)
- 涓婁紶绾圭悊 (JPG, PNG) / HDRI (HDR, EXR)
- 娉ㄥ唽 3D Tiles URL
- 鏌ョ湅澶勭悊鐘舵€?(pending 鈫?processing 鈫?ready/failed)
- 璧勪骇鍒嗙被杩囨护 (妯″瀷/绾圭悊/HDRI/3D Tiles)
- 鍒嗛〉娴忚鍜屼笅杞?
**鍚姩鍛戒护**: `pnpm dev:asset`

### 5. @meteor3d/portal (灞曠ず闂ㄦ埛)

- **璺緞**: `packages/portal/`
- **妗嗘灦**: Vue 3 + Vue Router 4
- **绔彛**: 6177

**璺敱**:
| 璺緞 | 瑙嗗浘 | 鎻忚堪 |
|------|------|------|
| `/` | `HomeView` | 棣栭〉锛氬凡鍙戝竷鍦烘櫙/搴旂敤鍗＄墖缃戞牸 + 绛涢€?+ 鍒嗛〉 |
| `/scene/:slug` | `SceneViewerView` | 鍏ㄥ睆 3D 鍦烘櫙鏌ョ湅鍣?(浣跨敤 `loadScene()`) |

**鍔熻兘**:
- 娴忚鎵€鏈夊凡鍙戝竷鐨?3D 鍦烘櫙鍜屽簲鐢?- 鍏ㄥ睆 3D 鍦烘櫙鏌ョ湅鍣紙鍩轰簬鏍稿績 SDK 鐨?`loadScene()`锛?- HUD 瑕嗙洊灞傦細鑷姩鍔犺浇鍦烘櫙涓繚瀛樼殑 HUD 閰嶇疆骞舵覆鏌?widget
- 鏌ョ湅鍣ㄥ伐鍏锋爮锛氱浉鏈烘ā寮忓垏鎹?(Orbit/Ghost)銆丗PS 缁熻銆佸叏灞忥紙榛樿闅愯棌锛岄紶鏍囩Щ鍒伴《閮ㄨ嚜鍔ㄤ笅鎷夛級
- 鍦烘櫙/搴旂敤绛涢€夋爣绛鹃〉
- 鍒嗛〉瀵艰埅
- Vite 浠ｇ悊 `/api` 鈫?`http://localhost:6001` (via Vite proxy)
- Vite 鍒悕 `@widgets` 鈫?`scene-editor/src/widgets`锛堝鐢?widget 缁勪欢锛?
**鍚姩鍛戒护**: `pnpm dev:portal`

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
url (GLTF), customProperties [{key,label,value,type}], modifications, geometry,
material: Mixed (mongoose.Schema.Types.Mixed)
  // 允许任意材质属性透传，包括 color, roughness, metalness, emissive, emissiveIntensity,
  // opacity, alphaTest, blending, side, transparent, depthTest, depthWrite, vertexColors,
  // wireframe, flatShading 等。旧版严格子 schema 会丢弃未声明字段。
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
# 瀹夎渚濊禆
pnpm install

# 閰嶇疆鍚庣鐜鍙橀噺
# 褰撳墠浠撳簱鏈彁浜?meteor3d-server/.env.example锛涢娆￠儴缃茶鎵嬪姩鍒涘缓 .env
# 缂栬緫 .env 濉叆 MongoDB / Redis / Upyun 鍑嵁锛岀姝㈡彁浜ょ湡瀹炲瘑閽?
# 鍚姩鍚庣
cd meteor3d-server && npm run dev

# 鍚姩鍦烘櫙缂栬緫鍣?(鏂扮粓绔?
pnpm --filter @meteor3d/scene-editor dev --host 0.0.0.0

# 鍚姩璧勪骇绠＄悊鍣?(鏂扮粓绔?
pnpm --filter @meteor3d/asset-manager dev --host 0.0.0.0

# 鍚姩灞曠ず闂ㄦ埛 (鏂扮粓绔?
pnpm --filter @meteor3d/portal dev --host 0.0.0.0
```

### Build
```bash
pnpm build:core      # 鏋勫缓鏍稿績 SDK
pnpm build:scene     # 鏋勫缓鍦烘櫙缂栬緫鍣?pnpm build:asset     # 鏋勫缓璧勪骇绠＄悊鍣?pnpm build:portal    # 鏋勫缓灞曠ず闂ㄦ埛
pnpm build:all       # 鏋勫缓鎵€鏈夊寘
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
- Current portal branding is `JR鏁板瓧瀛敓骞冲彴`; scene editor title is `JR鏁板瓧瀛敓寮€鍙戝钩鍙癭.

### Upyun behavior

Upyun is optional CDN/object storage for processed assets and thumbnails. Local uploads and processing still write into the backend upload volume first. If Upyun env vars are empty or invalid, local assets can still work, but cloud URL fields such as `cloudUrls.compressed` or `cloudUrls.thumbnail` may be absent. Treat Upyun upload failures as CDN sync failures unless the local upload route itself fails.

---

## Coding Conventions

- **鍖呯鐞嗗櫒**: pnpm (workspace protocol `workspace:*`)
- **鍓嶇妗嗘灦**: Vue 3 Composition API + `<script setup>`
- **鐘舵€佺鐞?*: Pinia (stores in `src/stores/`)
- **3D 寮曟搸**: Three.js 0.181, ACESFilmic tone mapping, sRGB color space
- **鍚庣**: Express 5, Mongoose ODM, async/await controllers
- **鏂囦欢涓婁紶**: Multer, 50MB body limit
- **闃熷垪**: Bull (Redis-backed), 3 retries + exponential backoff
- **浜戝瓨鍌?*: Upyun CDN
- **鍧愭爣绯?*: WGS84 鈫?proj4 鎶曞奖杞崲
- **API 鍓嶇紑**: `/api/` (scene, assets, app, chat)
- **Vite 浠ｇ悊**: 鍓嶇寮€鍙戞湇鍔″櫒浠ｇ悊 `/api` 鍜?`/uploads` 鈫?`http://localhost:6001`

---

## Key Architecture Patterns

1. **Manager Pattern**: 鏍稿績 SDK 涓瘡涓姛鑳界敱鐙珛 Manager 绫诲皝瑁?(SceneManager 鈫?瀛?Manager)
2. **Command Pattern**: 缂栬緫鍣ㄦ搷浣滈€氳繃 CommandFactory 鍒涘缓鍙挙閿€鍛戒护
3. **Pipeline Pattern**: 璧勪骇澶勭悊閫氳繃 Bull Queue 涓茶鎵ц涓昏澶勭悊闃舵
4. **Persistence Layer**: PersistenceManager 璐熻矗 Three.js 瀵硅薄 鈫?JSON 搴忓垪鍖?5. **Event-Driven**: SceneManager 閫氳繃浜嬩欢绯荤粺閫氱煡 UI 灞傚彉鍖?6. **Publish Workflow**: 鍦烘櫙/搴旂敤閫氳繃 publish API 鏍囪鍙戝竷鐘舵€侊紝闂ㄦ埛 SPA 閫氳繃 portal API 鍙睍绀哄凡鍙戝竷鍐呭锛宻lug 鍙嬪ソ URL 鏀寔鍏紑璁块棶
7. **HUD Overlay**: HUD 閰嶇疆闅忓満鏅寔涔呭寲锛坔udConfig 瀛楁锛夛紝缂栬緫鍣ㄩ€氳繃 HudCanvas 鍙鍖栫紪杈戯紝Portal 閫氳繃 HudOverlay 鍙娓叉煋
8. **Lazy Initialization**: 閲嶈祫婧愶紙濡?EffectComposer锛夊欢杩熷埌棣栨浣跨敤鏃跺垱寤猴紝閬垮厤绌哄満鏅€ц兘娴垂

---

## HUD 鏁版嵁缁戝畾绯荤粺锛坴2024.5锛?
**姒傝堪**锛氫綆浠ｇ爜鏁版嵁缁戝畾寮曟搸锛岃 HUD Widget 瀹炴椂璇诲彇 3D 鍦烘櫙瀵硅薄灞炴€у苟鏀寔浜や簰鍔ㄤ綔銆傜紪杈戝櫒鎻愪緵鍙鍖栭厤缃紝闂ㄦ埛鏀寔鍙戝竷鍦烘櫙鍚庣殑鍙缁戝畾銆?
### 鏍稿績妯″潡 (`packages/core/src/binding/`)

| 鏂囦欢 | 鍔熻兘 |
|------|------|
| `constants.js` | 鏋氫妇甯搁噺锛堢粦瀹氭ā寮忋€佹槧灏勬柟鍚戙€佸姩浣滆Е鍙戝櫒銆佺洰鏍囨ā寮忥級 |
| `pathResolver.js` | 瀵硅薄璺緞鐧藉悕鍗曘€佸€肩被鍨嬫帹鏂€佽矾寰勮鍐欐帴鍙?|
| `transformRegistry.js` | 8 绉嶅€艰浆鎹㈠櫒锛堜繚鐣欏皬鏁般€佽寖鍥撮檺鍒躲€佺缉鏀俱€佸姬搴﹁浆瑙掑害銆佸竷灏旀爣绛俱€佹ā鏉垮瓧绗︿覆绛夛級 |
| `actionExecutors.js` | 4 绉嶅姩浣滄墽琛屽櫒锛堥珮浜€佺浉鏈鸿仛鐒︺€佸垏鎹㈠彲瑙併€佽缃睘鎬э級 |
| `BindingManager.js` | 鏍稿績绠＄悊鍣細缁戝畾瑙ｆ瀽銆佸睘鎬у悓姝ャ€佷簨浠堕┍鍔ㄣ€佸姩浣滃垎鍙?|
| `index.js` | 缁熶竴瀵煎嚭鎺ュ彛 |

### 缁戝畾妯″紡锛? 绉嶏級

| 妯″紡 | 璇存槑 | 鐢ㄩ€?|
|------|------|------|
| `static` | 闈欐€佹暟鎹?| Widget 鏄剧ず鍥哄畾鍊?|
| `context-selected` | 璺熼殢閫変腑瀵硅薄锛堝吋瀹规ā寮忥級 | 缂栬緫鍣ㄤ腑鍔ㄦ€佽拷韪綋鍓嶉€変腑鐨勫満鏅璞?|
| `object-id` | 鎸囧畾瀵硅薄 UUID | 缂栬緫鍣ㄥ拰闂ㄦ埛涓簿纭粦瀹氬浐瀹氬璞?|
| `bound-object` | 褰撳墠 Widget 缁戝畾瀵硅薄 | 鍔ㄤ綔鐩爣榛樿鎸囧悜璇?Widget 鐨勬暟鎹簮瀵硅薄 |

### 灞炴€ф槧灏勶紙READ/WRITE/BOTH锛?
鍙粦瀹氱殑瀵硅薄灞炴€ц矾寰勶紙鐧藉悕鍗曪級锛?- `position.x/y/z` 鈥?浣嶇疆鍧愭爣
- `rotation.x/y/z` 鈥?娆ф媺瑙?- `scale.x/y/z` 鈥?缂╂斁绯绘暟
- `name` 鈥?瀵硅薄鍚嶇О
- `visible` 鈥?鍙鎬?- `userData.*` 鈥?鑷畾涔夋暟鎹?
### 鍔ㄤ綔绯荤粺锛? 绉嶏級

| 鍔ㄤ綔 | 瑙﹀彂鍣?| 鐩爣 | 鏁堟灉 |
|------|--------|------|------|
| `highlight-object` | click/hover-enter | 缁戝畾/閫変腑/鎸囧畾瀵硅薄 | 鍙戝厜楂樹寒 2s 鑷姩杩樺師 |
| `camera-focus` | click/hover-enter | 缁戝畾/閫変腑/鎸囧畾瀵硅薄 | 1s 鍐呯浉鏈鸿仛鐒﹁嚦瀵硅薄 |
| `toggle-visible` | click/value-change | 缁戝畾/閫変腑/鎸囧畾瀵硅薄 | 鍒囨崲鍙鎬?|
| `set-property` | click/value-change | 缁戝畾/閫変腑/鎸囧畾瀵硅薄 | 鍐欏叆浠绘剰鍙啓灞炴€?|

### Implementation Status (current master)

The HUD data binding system is implemented in the current `master` branch. Important integration points:

- `packages/core/src/SceneManager.js` owns a lightweight event bus: `on()`, `off()`, `emit()`, `setReady()`, and scene/object lifecycle events used by bindings.
- `packages/core/index.js` exports the binding modules, so apps can import `BindingManager` and related constants from `@meteor3d/core`.
- `packages/scene-editor/src/components/Viewport.vue` creates the editor `BindingManager`, enables write-back, listens for scene/object/HUD changes, and pushes live binding data into `hudStore`.
- `packages/scene-editor/src/stores/hudStore.js` now exposes `updateWidgetBinding()`, `updateWidgetActions()`, and `getAvailableObjects()` for the binding and action editors.
- `packages/portal/src/views/SceneViewerView.vue` creates a read-only `BindingManager` for published scenes, converts scene clicks into `object:selected`, and uses that selection for `context-selected` HUD bindings; `packages/portal/src/components/HudOverlay.vue` merges live data and dispatches widget click triggers.
- `packages/scene-editor/src/components/Toolbar.vue` no longer owns HUD quick actions; HUD editing controls live in the HUD-specific canvas/panel flow.

### 缂栬緫鍣ㄩ泦鎴愶紙6173锛?
**鍙充晶 HUD 缂栬緫闈㈡澘鏂板 Tab**锛?- **"缁戝畾" Tab**锛坄DataBindingEditor.vue`锛?  - 閫夋嫨缁戝畾妯″紡锛堥潤鎬?璺熼殢閫変腑/鎸囧畾瀵硅薄锛?  - 娣诲姞灞炴€ф槧灏勶紙婧愬睘鎬?鈫?鐩爣瀛楁 鈫?鍊煎彉鎹級锛涙簮灞炴€ф潵鑷?`PathSelector.vue`锛屼娇鐢?`getGroupedPaths()` 杩斿洖鐨?`{ group, paths }` 鏁扮粍缁撴瀯
  - 澶氬瓧娈靛璞¤鎯呬紭鍏堜娇鐢?`object-info-panel` 缁勪欢锛涙瘡涓瓧娈电殑缁戝畾鐩爣褰㈠ `data.fields.0.value`锛岄€傚悎 `context-selected` 鍦烘櫙瀵硅薄淇℃伅灞曠ず銆?  - 鍦烘櫙瀵硅薄涓氬姟瀛楁淇濆瓨鍦?`object.userData.customProperties`锛屽睘鎬ч潰鏉垮彲缂栬緫锛岀粦瀹氳矾寰勪负 `custom.<key>`锛屽悗绔?`SceneObject.customProperties` 浼氭寔涔呭寲銆?  - 瀵硅薄閫夋嫨鍣ㄥ拰璺緞閫夋嫨鍣ㄤ笅鎷?
- **"鍔ㄤ綔" Tab**锛坄ActionsEditor.vue`锛?  - 姣忔潯鍔ㄤ綔閰嶇疆锛氳Е鍙戝櫒 + 鍔ㄤ綔绫诲瀷 + 鐩爣妯″紡 + 鍙€夊弬鏁?  - 鏀寔澶氭潯鍔ㄤ綔閾?
**Viewport.vue 闆嗘垚**锛?- `BindingManager` 鍦ㄥ満鏅姞杞藉悗鍒濆鍖栵紝write-back 鍚敤
- 鐩戝惉 `hudConfig` 鍙樺寲鑷姩 `rebindAll()`
- 璁㈤槄 `binding:value-updated` 浜嬩欢锛屾帹閫佸疄鏃舵暟鎹埌 `hudStore`
- `setNestedVal()` 宸ュ叿鍑芥暟鏀寔鐐硅矾寰勮祴鍊?
**浜嬩欢鍙戝皠**锛堥€氳繃 SceneManager锛夛細
- `object:selected` 鈥?閫変腑瀵硅薄鏃跺彂鍑?- `object:transform` 鈥?鍙樻崲瀹屾垚鎴栧睘鎬ч潰鏉夸慨鏀规椂鍙戝嚭
- `object:renamed` 鈥?鍚嶇О淇敼鏃跺彂鍑?- `object:visibility` 鈥?鍙鎬у彉鍖栨椂鍙戝嚭
- `object:added/removed` 鈥?瀵硅薄娣诲姞/鍒犻櫎鏃跺彂鍑?
### 闂ㄦ埛闆嗘垚锛?177锛?
**SceneViewerView.vue**锛?- 鍦烘櫙鍔犺浇鍚庡垱寤?`BindingManager`锛堝彧璇绘ā寮?`allowWriteBack: false`锛?- `liveWidgetData` 鍝嶅簲寮忓璞℃帴鏀跺疄鏃剁粦瀹氭暟鎹紝骞舵敮鎸佺偣璺緞瀛楁鍐欏叆
- 璁㈤槄 `binding:value-updated` 浜嬩欢锛屽彧闇€璇诲彇鏃犻渶鍐欏洖
- 鐩戝惉 `scene-click` 骞跺彂鍑?`object:selected`锛岃 `context-selected` 缁戝畾闅忕敤鎴风偣鍑诲満鏅璞″埛鏂?
**HudOverlay.vue**锛?- 鏂板 props锛歚bindingManager`銆乣liveData`
- `mergedWidget()` 娣卞害鍚堝苟鍘熷 widget 閰嶇疆 + 瀹炴椂缁戝畾鏁版嵁锛堜笉鐮村潖鍘熷 hudConfig锛?- `onWidgetClick()` 鍒嗗彂 click 瑙﹀彂鍣ㄥ埌 `bindingManager.dispatchWidgetTrigger()`
- Portal 杩愯鎬佸繀椤婚樆姝?HUD pointer/click 浜嬩欢缁х画绌块€忓埌 3D canvas锛岄伩鍏?widget 鐐瑰嚮鍚屾椂瑙﹀彂鍦烘櫙鎺у埗鍣?灏勭嚎妫€娴嬨€?- HUD 鐨?`highlight-object` 鍔ㄤ綔浼樺厛浣跨敤 `HighlightManager` 鏉愯川楂樹寒锛涗笉瑕侀粯璁よ蛋 `OutlineManager`锛屽ぇ鍦烘櫙鍚庡鐞嗗鏄撹灞曠ず椤靛崱椤裤€?
**鍔熻兘**锛氬彂甯冨満鏅悗锛岄棬鎴锋樉绀鸿鍦烘櫙鐨?HUD Widget锛學idget 涓殑缁戝畾鏁版嵁瀹炴椂璺熻釜 3D 瀵硅薄灞炴€э紱鐐瑰嚮 Widget 鍙Е鍙戦珮浜?鑱氱劍绛夊姩浣溿€?
### 鏍稿績 API

```javascript
// 鍒濆鍖?const bm = new BindingManager({
  sceneManager,
  hudConfigProvider: () => hudConfig,
  selectionProvider: () => selectedObject,
  objectResolver: (uuid) => sceneManager.getObjectByUUID(uuid),
  allowWriteBack: true,
  onEvent: (type, payload) => { /* binding:value-updated绛変簨浠?*/ }
});

// 鐢熷懡鍛ㄦ湡
bm.start();           // 寮€濮嬬粦瀹氫笌浜嬩欢鐩戝惉
bm.rebindAll();       // 閲嶆柊瑙ｆ瀽鎵€鏈?widget 缁戝畾
bm.rebindWidget(id);  // 閲嶆柊瑙ｆ瀽鍗曚釜 widget
bm.stop();            // 鍋滄骞舵竻鐞?bm.dispose();         // 瀹屽叏閲婃斁

// 鍚屾
bm.syncRead(widgetId);           // 鎵嬪姩鍚屾璇?widget 鐨勬墍鏈夎鏄犲皠
bm.applyWidgetInput(widgetId, { field: value });  // 搴旂敤 widget 杈撳叆锛堝啓鏄犲皠锛?
// 鍔ㄤ綔
bm.dispatchWidgetTrigger(widgetId, 'click', { /* eventData */ });

// 鏌ヨ
bm.getWidgetStatus(widgetId);       // 杩斿洖 OK/DEGRADED/ERROR
bm.getWidgetRuntimeData(widgetId);  // 鑾峰彇鍚粦瀹氭暟鎹殑瀹屾暣 widget.data
bm.validateConfig(hudConfig);       // 楠岃瘉閰嶇疆鏈夋晥鎬?```

### 鏁版嵁妯″瀷鎵╁睍

**Scene.hudConfig** 鏂板瀛楁锛?```javascript
{
  widgets: [{
    id: 'w_xxx',
    type: 'stat-card',
    name: '浣嶇疆 X',
    x: 10, y: 10, width: 20, height: 15,
    data: { title: '浣嶇疆', value: 0 },
    style: { ... },

    // 鏂板锛氭暟鎹粦瀹氶厤缃?    dataBinding: {
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

    // 鏂板锛氬姩浣滈厤缃?    actions: [{
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
- `SceneObject.material` 字段已从严格子 schema 改为 `mongoose.Schema.Types.Mixed`，以保证 `emissive`、`emissiveIntensity`、`opacity`、`alphaTest`、`flatShading` 等属性能正确持久化和反序列化。旧 schema 会静默丢弃未声明字段导致 portal 渲染缺失。
- Portal 对 `gaussian-splat-trigger` 对象施加视觉增强：`depthTest:false`、`transparent:true`、`opacity:0.85`、复制 color 到 emissive（强度 0.6）、`renderOrder:999`，确保触发对象在远距离相机视角下可见可点击。

### Gaussian Splat Integration

- InteriorGS data is served through the main Express backend under `/api/gaussian-scenes`, not through a browser-facing standalone Python service.
- `INTERIOR_GS_DATA_ROOT` points to the InteriorGS dataset. The LAN default is `/home/jr/GS_Data/InteriorGS/InteriorGS_dataset`; Docker maps this read-only to `/data/interiorgs`.
- Only the dedicated geometry item `高斯泼溅` can bind Gaussian splats. It is saved as an octahedron with `object.userData.objectRole = "gaussian-splat-trigger"`.
- Newly dropped Gaussian trigger octahedrons use radius `1.15`; legacy saved trigger octahedrons should be restored at least this large so they remain easy to select.
- Gaussian trigger objects persist click actions in `object.userData.actions.onClick`. Gaussian actions use `type: "open-gaussian-viewer"` and `payload: { sceneId, title, source: "interiorgs" }`.
- The editor Properties panel owns Gaussian association editing, but it must only show this section for `gaussian-splat-trigger` objects. Scene save/load must preserve `objectRole` and `actions` alongside `customProperties`.
- Gaussian association selection should not auto-lock to the first dataset. The scene dropdown must remain selectable after loading; choosing any dataset should enable/update the action and clear a saved default view only when the `sceneId` actually changes.
- Gaussian trigger actions can store a per-object default viewer position in `payload.defaultView`. The editor modal may write this through its "设为居中" control; the portal must only read and apply it.
- `payload.defaultView` stores the viewer mode plus orbit and fly camera state so reopening the same trigger restores the saved viewpoint. The modal "居中" button should prefer this saved view and fall back to automatic AABB/occupancy framing when it is absent or invalid.
- `GaussianSplatModal.vue` embeds PlayCanvas from `src/vendor/playcanvas.mjs`; keep this vendor file in both scene-editor and portal src/vendor folders unless the viewer is moved into a shared package.
- Editor and Portal object clicks use the existing `scene-click` flow. Unbound objects keep normal selection/object-info behavior and must not open the modal.
- Portal may add a Sprite label to Gaussian trigger objects, but the label must be hidden by default and only shown when the camera is close to the trigger. Keep the label just above the octahedron, not high above the scene.
- Gaussian .ply downloads should show progress in both editor and portal modals. The modal fetches the file as a stream, displays bytes/percent, then hands a local Blob URL to PlayCanvas for parsing.
- Gaussian file streaming should keep Accept-Ranges and set long-lived cache headers for 3dgs_compressed.ply; repeated opens should benefit from browser HTTP cache where possible.
- Do not rely only on HTTP cache for Gaussian models. The modal also stores downloaded model Blobs in browser Cache Storage (jr3d-gaussian-models-v1) and should read from it before issuing a network request.
- Closing the Gaussian modal must destroy the PlayCanvas app, unload the gsplat asset, and remove pointer/keyboard listeners to avoid WebGL leaks and portal freezes.

### Code Change Guardrails

- Keep Vue code in the existing Vue 3 Composition API and `<script setup>` style.
- Prefer existing Manager, Command, Pipeline, and Persistence patterns before adding new abstractions.
- Be careful with global renderer settings, camera near/far values, coordinate transforms, and persistence schemas; these can affect existing saved scenes.
- Before adding dependencies, check whether an existing package already solves the problem and document why the new dependency is needed.
- Only modify lockfiles after a real dependency install or upgrade.


---

## Infrastructure Dependencies

| 鏈嶅姟 | 榛樿閰嶇疆 | 鐢ㄩ€?|
|------|---------|------|
| MongoDB | `127.0.0.1:27017`, db: `meteor3d`, user: `root` | 鍦烘櫙/璧勪骇/搴旂敤鏁版嵁鎸佷箙鍖?|
| Redis | `127.0.0.1:6379` | Bull 浠诲姟闃熷垪鍚庣 |
| Upyun CDN | `youpaiyun.meteor3d.cn` | 澶勭悊鍚庤祫浜т簯瀛樺偍 |
| Node.js | >= 20.19.0 / >= 22.12.0 | 鍓嶇 Vite 7 涓庡悗绔繍琛屾椂 |
| pnpm | >= 10.2 | 鍖呯鐞嗗櫒 |
