/**
 * Widget 类型定义 — 自由布局 HUD 系统
 */

// ── Widget 类型常量 ──
export const WIDGET_TYPES = {
  // 基础
  TEXT_LABEL: 'text-label',
  IMAGE: 'image',
  CONTAINER: 'container',
  BUTTON: 'button',
  DIVIDER: 'divider',
  // 数据展示
  PROGRESS_BAR: 'progress-bar',
  STAT_CARD: 'stat-card',
  GAUGE_CHART: 'gauge-chart',
  BAR_CHART: 'bar-chart',
  LINE_CHART: 'line-chart',
  PIE_CHART: 'pie-chart',
  DATA_TABLE: 'data-table',
  ALERT_LIST: 'alert-list',
}

// ── 类型分类 ──
export const WIDGET_CATEGORIES = {
  basic: {
    label: '基础',
    types: [
      WIDGET_TYPES.TEXT_LABEL,
      WIDGET_TYPES.CONTAINER,
      WIDGET_TYPES.IMAGE,
      WIDGET_TYPES.BUTTON,
      WIDGET_TYPES.DIVIDER,
    ]
  },
  data: {
    label: '数据展示',
    types: [
      WIDGET_TYPES.STAT_CARD,
      WIDGET_TYPES.PROGRESS_BAR,
      WIDGET_TYPES.GAUGE_CHART,
    ]
  },
  chart: {
    label: '图表',
    types: [
      WIDGET_TYPES.BAR_CHART,
      WIDGET_TYPES.LINE_CHART,
      WIDGET_TYPES.PIE_CHART,
    ]
  },
  list: {
    label: '列表',
    types: [
      WIDGET_TYPES.DATA_TABLE,
      WIDGET_TYPES.ALERT_LIST,
    ]
  }
}

// ── 类型元信息 ──
export const WIDGET_META = {
  [WIDGET_TYPES.TEXT_LABEL]: { label: '文本', icon: '📝', defaultW: 15, defaultH: 5 },
  [WIDGET_TYPES.IMAGE]: { label: '图片', icon: '🖼️', defaultW: 15, defaultH: 15 },
  [WIDGET_TYPES.CONTAINER]: { label: '面板', icon: '📦', defaultW: 18, defaultH: 30 },
  [WIDGET_TYPES.BUTTON]: { label: '按钮', icon: '🔘', defaultW: 8, defaultH: 5 },
  [WIDGET_TYPES.DIVIDER]: { label: '分割线', icon: '➖', defaultW: 20, defaultH: 1 },
  [WIDGET_TYPES.PROGRESS_BAR]: { label: '进度条', icon: '📊', defaultW: 16, defaultH: 4 },
  [WIDGET_TYPES.STAT_CARD]: { label: '统计卡片', icon: '🔢', defaultW: 10, defaultH: 10 },
  [WIDGET_TYPES.GAUGE_CHART]: { label: '仪表盘', icon: '⏲️', defaultW: 14, defaultH: 18 },
  [WIDGET_TYPES.BAR_CHART]: { label: '柱状图', icon: '📶', defaultW: 18, defaultH: 20 },
  [WIDGET_TYPES.LINE_CHART]: { label: '折线图', icon: '📈', defaultW: 18, defaultH: 20 },
  [WIDGET_TYPES.PIE_CHART]: { label: '饼图', icon: '🍩', defaultW: 16, defaultH: 20 },
  [WIDGET_TYPES.DATA_TABLE]: { label: '数据表', icon: '📋', defaultW: 18, defaultH: 22 },
  [WIDGET_TYPES.ALERT_LIST]: { label: '报警列表', icon: '🚨', defaultW: 16, defaultH: 20 },
}

// ── 每种类型的默认 data ──
export const WIDGET_DEFAULTS = {
  [WIDGET_TYPES.TEXT_LABEL]: {
    text: '标题文本',
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  [WIDGET_TYPES.IMAGE]: {
    url: '',
    fit: 'contain',
  },
  [WIDGET_TYPES.CONTAINER]: {
    title: '信息面板',
    showHeader: true,
  },
  [WIDGET_TYPES.BUTTON]: {
    label: '按钮',
    icon: '⚙️',
    variant: 'default',
  },
  [WIDGET_TYPES.DIVIDER]: {
    color: 'rgba(0,212,255,0.3)',
    thickness: 1,
    direction: 'horizontal',
  },
  [WIDGET_TYPES.PROGRESS_BAR]: {
    label: '温感报警器',
    value: 1550,
    max: 2000,
    unit: '',
    color: '#00d4ff',
  },
  [WIDGET_TYPES.STAT_CARD]: {
    label: '总车位',
    value: 780,
    unit: '',
    icon: '🅿️',
    color: '#00d4ff',
  },
  [WIDGET_TYPES.GAUGE_CHART]: {
    label: '用电负荷',
    value: 65,
    min: 0,
    max: 100,
    unit: '%',
    color: '#00d4ff',
  },
  [WIDGET_TYPES.BAR_CHART]: {
    title: '能耗统计',
    categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
    series: [{ name: '耗能', data: [120, 200, 150, 80, 70, 110] }],
    color: '#00d4ff',
  },
  [WIDGET_TYPES.LINE_CHART]: {
    title: '趋势分析',
    categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
    series: [{ name: '数值', data: [120, 132, 101, 134, 90, 230] }],
    color: '#00d4ff',
  },
  [WIDGET_TYPES.PIE_CHART]: {
    title: '分类占比',
    data: [
      { name: '类别A', value: 335 },
      { name: '类别B', value: 310 },
      { name: '类别C', value: 234 },
      { name: '类别D', value: 135 },
    ],
  },
  [WIDGET_TYPES.DATA_TABLE]: {
    title: '设备状态',
    columns: ['设备', '在线', '总数'],
    rows: [
      { icon: '📹', values: ['硬盘录相机', '155台', '550台'] },
      { icon: '🎥', values: ['球相机', '200台', '300台'] },
      { icon: '📷', values: ['枪相机', '350台', '500台'] },
    ],
  },
  [WIDGET_TYPES.ALERT_LIST]: {
    title: '防盗报警',
    items: [
      { label: '状态', value: '撤防', color: '#52c41a' },
      { label: '总数', value: '56个', color: '#00d4ff' },
      { label: '报警', value: '13个', color: '#ff4d4f' },
      { label: '故障', value: '2个', color: '#faad14' },
    ],
  },
}

// ── 默认样式 ──
const DEFAULT_STYLE = {
  opacity: 1,
  background: 'rgba(6,30,60,0.85)',
  borderColor: 'rgba(0,212,255,0.4)',
  borderWidth: 1,
  borderRadius: 4,
  shadow: false,
}

/**
 * 创建新 widget 实例（自由定位）
 */
export function createWidget(type, overrides = {}) {
  const meta = WIDGET_META[type]
  const defaults = WIDGET_DEFAULTS[type]
  if (!meta || !defaults) throw new Error(`Unknown widget type: ${type}`)

  return {
    id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    name: meta.label,
    locked: false,
    x: overrides.x ?? 10,
    y: overrides.y ?? 10,
    width: overrides.width ?? meta.defaultW,
    height: overrides.height ?? meta.defaultH,
    data: { ...defaults, ...(overrides.data || {}) },
    dataBinding: { type: 'static' },
    style: { ...DEFAULT_STYLE, ...(overrides.style || {}) },
    actions: [],
  }
}

/**
 * 创建默认 HUD 配置
 */
export function createDefaultHudConfig() {
  return {
    enabled: false,
    widgets: [],
  }
}
