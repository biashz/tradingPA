import { PriceScale } from '../scale/PriceScale';
import type { IndicatorInstance } from '@/indicators/core/instance';
import type { PaneButtonRects } from './drawAxes';

/** 画布几何常量（图表区 = 画布 - 价格轴/时间轴；跨模块共享，随模型定义） */
export const AXIS_WIDTH = 64;
export const AXIS_HEIGHT = 24;
export const PANE_GAP = 0;

/** 价格轴位置（TV Scales 页）：右 / 左 / 无 */
export type PriceAxisPos = 'right' | 'left' | 'none';

/** 默认价格轴位置（右）：ChartState 字段初值视口初宽同源，保证默认路径零像素变化 */
export const DEFAULT_PRICE_AXIS_POS: PriceAxisPos = 'right';

/**
 * 图表区宽（画布宽 - 价格轴宽）。
 * right/left：轴占据画布一侧 64px，图表区 = 画布 - 轴宽；
 * none：无价格轴，图表区全宽（视口可见 bar 数随之变化）。
 */
export function chartAreaWidth(canvasW: number, pos: PriceAxisPos): number {
  return pos === 'none' ? canvasW : canvasW - AXIS_WIDTH;
}

/** 图表区左边界画布 x：left = 价格轴在左，图表区右移一个轴宽；right/none = 0 */
export function chartAreaOffsetX(pos: PriceAxisPos): number {
  return pos === 'left' ? AXIS_WIDTH : 0;
}

export type PaneKind = 'price' | 'indicator';

/** 画布坐标系下的命中矩形（轴内小部件用） */
export interface AxisHitRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 价格轴「+」入口边长：与价格轴标签同高（crosshairOverlay 的 h = 18），贴轴条居中 */
export const PRICE_SCALE_PLUS_SIZE = 18;

/**
 * 价格轴「+」（跟随光标建警报）命中区纯函数——绘制、命中、光标三处共用同一几何，
 * 不存在「看得见点不着 / 点得着看不见」的分裂。返回 null = 本帧不绘制也不吃点击。
 *
 * 三条 null 分支各有其故：
 * - `axisPos = 'none'`：没有轴条可贴。
 * - 光标不在主价格面板内：副图面板的刻度是该指标的值，按「价格」建警报会写错源
 *   （警报对话框当前只出 `source: { type: 'price' }`）；该边界登记在 SPEC-TV-ALIGNMENT。
 * - 与「自动」按钮竖直相交：二者都由同一 64px 轴条居中（autoBtn 的 bx = axisX +
 *   (AXIS_WIDTH − bw)/2，见 PaneRenderer 的自动按钮），水平必然重叠，故只比竖直带。
 *   排除后两个部件由构造互斥，命中顺序不承重。
 */
/** 画布坐标点是否落在命中矩形内（含边界）：光标决策与按下路由共用，二者判定必然同构 */
export function hitAxisRect(r: AxisHitRect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function priceScalePlusRect(input: {
  hoverY: number | null;
  axisPos: PriceAxisPos;
  chartW: number;
  paneY: number;
  paneHeight: number;
  autoBtn: AxisHitRect | null;
}): AxisHitRect | null {
  const { hoverY, axisPos, chartW, paneY, paneHeight } = input;
  if (hoverY === null || axisPos === 'none') return null;
  if (hoverY < paneY || hoverY > paneY + paneHeight) return null;
  const size = PRICE_SCALE_PLUS_SIZE;
  // 画布坐标下的轴条左缘：右轴 = 图表区右缘，左轴 = 0（与 chartAreaOffsetX 同口径）
  const stripX = axisPos === 'left' ? 0 : chartW;
  const y = Math.min(Math.max(hoverY - size / 2, paneY), paneY + paneHeight - size);
  const btn = input.autoBtn;
  if (btn) {
    const btnTop = paneY + btn.y;
    if (y < btnTop + btn.h && y + size > btnTop) return null;
  }
  return { x: stripX + (AXIS_WIDTH - size) / 2, y, w: size, h: size };
}

export interface PaneState {
  id: string;
  kind: PaneKind;
  heightRatio: number;
  priceScale: PriceScale;
  indicators: IndicatorInstance[];
  y: number;
  height: number;
  /** 手动价格域：上下拖动/价格轴拖动后锁定，不再自动适配 */
  manual: boolean;
  /** “自动”按钮命中区（面板局部坐标） */
  autoBtn: { x: number; y: number; w: number; h: number } | null;
  /** 面板头部操作按钮命中区（设置/移除，选中指标面板时绘制） */
  headerBtns: PaneButtonRects | null;
}

export function createPane(id: string, kind: PaneKind, heightRatio: number): PaneState {
  return {
    id,
    kind,
    heightRatio,
    priceScale: new PriceScale(),
    indicators: [],
    y: 0,
    height: 0,
    manual: false,
    autoBtn: null,
    headerBtns: null,
  };
}
