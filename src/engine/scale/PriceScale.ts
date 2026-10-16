import type { PriceScaleOptions } from '@/types/market';

const DEFAULTS: PriceScaleOptions = {
  paddingTop: 0.08,
  paddingBottom: 0.08,
};

/**
 * 价格刻度密度基准（CSS 像素/条）：把原先两处写死的 `ticks(6)` 换成按面板高度推导的条数预算。
 *
 * 120 的取法是**自参照标定，不是 TV 实测**：仓内既无 TV 刻度规则可引，也不伪造一个。
 * 它让默认视图的主面板（黄金基线 `axis-price-closeup` 实测高 776px）预算四舍五入回到 6，
 * 即 `height ∈ [660, 900)` 的面与改动前同一条约束——主图观感不动；
 * 变化只发生在原先被 6 条挤到的矮面板（194px 的 MACD 副图轴实测由 9 条降到 4 条）。
 *
 * 下限 3：`rough = span / n` 之后要除，n 不能为 0；取 3 而非 2 是「两条读不出步长」。
 * **本口径不保证最小像素间距**——nice-step 向下取整会让实际条数多于预算，故极矮面板
 * （<~120px）仍可能挤；这是改动前就有的性质，本批只做「随高度变稀」这一件事。
 */
export const PRICE_TICK_PITCH = 120;
export const MIN_PRICE_TICKS = 3;

/** 给定轴高的价格刻度条数预算（供 ticks 缺省取值，也供单测直接校密度口径） */
export function priceTickBudget(height: number): number {
  return Math.max(MIN_PRICE_TICKS, Math.round(height / PRICE_TICK_PITCH));
}

/**
 * 价格坐标：price <-> y 像素换算，支持线性/对数模式。
 */
export class PriceScale {
  private min = 0;
  private max = 1;
  private height = 0;
  private logMode = false;
  /** 百分比坐标基准价（首根可见 bar 收盘）；百分比是价格的仿射变换，几何不变只换标签 */
  private percentBase: number | null = null;
  private options: PriceScaleOptions = { ...DEFAULTS };

  setSize(height: number): void {
    this.height = height;
  }

  setLogMode(on: boolean): void {
    this.logMode = on;
  }

  get isLog(): boolean {
    return this.logMode;
  }

  setPercentBase(base: number | null): void {
    this.percentBase = base;
  }

  /** 轴/标签读数：百分比模式显示相对基准价的涨跌幅 */
  toLabel(price: number, decimals: number): string {
    if (this.percentBase === null || this.percentBase === 0) return price.toFixed(decimals);
    const pct = (price / this.percentBase - 1) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  }

  setOptions(options: Partial<PriceScaleOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /** 根据可见 K 线的最低价/最高价自动适配价格范围（对数模式用乘法留白） */
  autoScale(low: number, high: number): void {
    if (this.logMode && low > 0 && high > 0) {
      this.min = low * (1 - 0.1);
      this.max = high * (1 + 0.1);
      return;
    }
    const span = high - low || Math.max(1e-9, high * 0.001);
    const pad = span * 0.1;
    this.min = low - pad;
    this.max = high + pad;
    this.applyPadding();
  }

  private applyPadding(): void {
    const span = this.max - this.min || 1e-9;
    const padTop = span * this.options.paddingTop;
    const padBottom = span * this.options.paddingBottom;
    this.min -= padBottom;
    this.max += padTop;
  }

  get range(): { min: number; max: number } {
    return { min: this.min, max: this.max };
  }

  /** 平移价格域（不重新留白，供拖拽用） */
  shift(delta: number): void {
    this.min += delta;
    this.max += delta;
  }

  /** 直接设置价格域（不留白，供价格轴缩放用） */
  setRange(min: number, max: number): void {
    this.min = min;
    this.max = max;
  }

  private get usable(): boolean {
    return this.logMode && this.min > 0 && this.max > 0;
  }

  priceToY(price: number): number {
    const { min, max } = this;
    if (this.usable) {
      const lmin = Math.log(min);
      const lmax = Math.log(max);
      const ratio = (Math.log(Math.max(price, 1e-9)) - lmin) / (lmax - lmin || 1e-9);
      return this.height * (1 - ratio);
    }
    const ratio = (price - min) / (max - min || 1e-9);
    return this.height * (1 - ratio);
  }

  yToPrice(y: number): number {
    const ratio = 1 - y / (this.height || 1);
    if (this.usable) {
      const lmin = Math.log(this.min);
      const lmax = Math.log(this.max);
      return Math.exp(lmin + ratio * (lmax - lmin));
    }
    return this.min + ratio * (this.max - this.min);
  }

  /**
   * 生成美观的价格轴刻度值（约 targetCount 个）。
   * 省略 targetCount = 按当前轴高取预算（`priceTickBudget(this.height)`），即密度随面板高度变；
   * 显式传入（既有单测走这条）则与本类的尺寸无关。
   */
  ticks(targetCount?: number): number[] {
    const n = targetCount ?? priceTickBudget(this.height);
    const { min, max } = this;
    if (this.usable) {
      // 对数模式：在 log 空间取整刻度再映射回价格
      const lmin = Math.log(min);
      const lmax = Math.log(max);
      const rough = (lmax - lmin) / n;
      const mag = Math.pow(10, Math.floor(Math.log10(rough)));
      const norm = rough / mag;
      const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
      const ticks: number[] = [];
      for (let v = Math.ceil(lmin / step) * step; v <= lmax; v += step) {
        ticks.push(Number(Math.exp(v).toPrecision(12)));
      }
      return ticks;
    }
    const span = max - min;
    if (span <= 0 || this.height <= 0) return [];
    const rough = span / n;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const norm = rough / mag;
    const step = (norm >= 5 ? 5 : norm >= 2 ? 2 : 1) * mag;
    const first = Math.ceil(min / step) * step;
    const ticks: number[] = [];
    for (let v = first; v <= max; v += step) {
      ticks.push(Number(v.toPrecision(12)));
    }
    return ticks;
  }

  /** 根据数值动态选择小数位 */
  static decimalsFor(price: number): number {
    if (price >= 1000) return 2;
    if (price >= 1) return 3;
    return 6;
  }
}
