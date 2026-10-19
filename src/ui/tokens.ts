/** 设计令牌：间距 / 圆角 / 字阶 / 图标尺寸 / 控件高度 / 层级 / 阴影。
 *  颜色沿用 global.css 的 CSS 变量（--bg/--panel/--text/--accent/...），此处只收拢散落的魔数。
 *
 *  圆角四档（TV 规格）：xs 3 = tooltip/轴标签/徽章；sm 4 = 按钮/输入框/小控件；
 *  md 6 = 下拉菜单/flyout/浮层；lg 8 = 模态对话框/大弹窗。
 *  图标四档：sm 12 = 微标（旗标/排序箭头/行内提示）；md 14 = 菜单项/面板控件；
 *  lg 16 = 顶栏与面板头部按钮；xl 18 = 画线工具/右侧图标轨。
 *  阴影四档：tooltip < popover < menu < modal，按浮层级配。 */

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  /** tooltip / 轴标签 / 徽章 */
  xs: 3,
  /** 按钮 / 输入框 / 小控件 */
  sm: 4,
  /** 下拉菜单 / flyout / 浮层 */
  md: 6,
  /** 模态对话框 / 大弹窗 */
  lg: 8,
} as const;

/** 字号阶梯：对齐 TradingView（正文 14 / 密集行 13 / 元信息 12 / 微标签 11） */
export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  lg: 14,
  xl: 15,
} as const;

/** 字重三档（四期-C5b 收敛：站点只允许引这三档，禁止裸磅值与 `<strong>` 隐式 700）。
 *  收敛前实测 19 个站点、四档并存——按磅值出现次数 400×6 / 500×2 / 600×12 / 700×1
 *  （17 处直接磅值 + 2 处三元式），另有 5 处 `<strong>` 走浏览器默认 700。
 *  处置：500 与 600 同语义 ⇒ 并入 emphasis；面板头的 4 处 `<strong>` 显式钉 emphasis
 *  （此前与 Pine 编辑器等标题的 600 同角色异档）；brand 只留给品牌名与当前品种代码。 */
export const fontWeight = {
  /** 正文 / 行内说明 */
  body: 400,
  /** 面板与对话框标题、数据强调 */
  emphasis: 600,
  /** 品牌名 / 当前品种代码 */
  brand: 700,
} as const;

/** 图标尺寸四档（lucide-react size 属性统一引用，禁止散落魔数） */
export const icon = {
  /** 微标：旗标 / 排序箭头 / 行内提示图标 */
  sm: 12,
  /** 菜单项 / 面板控件图标 */
  md: 14,
  /** 顶栏与面板头部按钮图标 */
  lg: 16,
  /** 画线工具 / 右侧图标轨图标 */
  xl: 18,
} as const;

/** 控件高度 */
export const control = {
  hSm: 22,
  h: 26,
  hLg: 30,
  iconBtn: 28,
} as const;

/** 层级（与现有组件对齐） */
export const zIndex = {
  toolbar: 15,
  panel: 16,
  dropdown: 30,
  modal: 60,
  /** 对话框内的下拉菜单：必须压在 modal 壳之上才能点。
   *  探针读数（改前）：菜单 z=30、对话框 z=60 ⇒ 打开的菜单项 `elementFromPoint` 命中的是
   *  遮罩层（hitInsideMenu=false），Playwright 报「`<div data-state="open" aria-hidden="true">`
   *  intercepts pointer events」。`dropdown` 不能整体上移——它还承着侧栏/图例等
   *  与对话框无关的浮层次序；故单开一层，只给「会出现在 Dialog 里」的下拉用。 */
  menu: 61,
  toast: 70,
} as const;

export const shadow = {
  /** tooltip：最轻，贴附触发元素 */
  tooltip: '0 1px 4px rgba(0, 0, 0, 0.3)',
  /** 小浮层：flyout / 指标面板 */
  popover: '0 2px 4px rgba(0, 0, 0, 0.2)',
  /** 下拉菜单 */
  menu: '0 4px 16px rgba(0, 0, 0, 0.35)',
  /** 模态对话框：最深，与页面分层 */
  modal: '0 8px 32px rgba(0, 0, 0, 0.45)',
} as const;

/** 数值显示统一用等宽数字（价格/盈亏/数量列对齐） */
export const numeric: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum"',
};
