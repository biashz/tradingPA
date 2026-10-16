/** 数值格式化：画布轴与 UI 共用一套，避免同一个价格两处显示不一致 */

/** 紧凑数字格式（副图数值轴/图例/成交量列）：1.2K / 3.4M / 5.6B */
export function formatCompact(v: number): string {
  const a = Math.abs(v);
  const trim = (n: number) => String(Number(n.toFixed(1)));
  if (a >= 1e9) return `${trim(v / 1e9)}B`;
  if (a >= 1e6) return `${trim(v / 1e6)}M`;
  if (a >= 1e3) return `${trim(v / 1e3)}K`;
  if (a >= 1 || v === 0) return String(Number(v.toFixed(2)));
  return String(Number(v.toPrecision(3)));
}

/** 价格：千分位 + 固定小数。无有效价格时显示占位符而不是 0.00 */
export function formatPrice(value: number, decimals: number, placeholder = '—'): string {
  if (!Number.isFinite(value) || value === 0) return placeholder;
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** 带符号数值：+1.23 / -0.45 */
export function formatSigned(value: number, decimals: number, placeholder = '—'): string {
  if (!Number.isFinite(value)) return placeholder;
  const s = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${value > 0 ? '+' : value < 0 ? '-' : ''}${s}`;
}

/** 涨跌幅：+1.23% */
export function formatPct(value: number, placeholder = '—'): string {
  if (!Number.isFinite(value)) return placeholder;
  const s = Math.abs(value).toFixed(2);
  return `${value > 0 ? '+' : value < 0 ? '-' : ''}${s}%`;
}

/**
 * 价格小数位的显示上限。合法来源最高给 6 位（币安/Gate 的非 USDT 交易对，
 * `sources/binance.ts:89`、`sources/gate.ts:182`），东财期货侧 `decimalsOf` 自己钳到 3。
 * 留 2 位余量取 8，同时钳下限到 0：`Number.prototype.toFixed` 只在 [0,100] 内合法，
 * 而自选落盘校验（`store/watchlistPersist.ts:39-40`）只要求「有限数」，手工写进
 * localStorage 的 -5 或 200 会原样流到这里 —— 前者每帧抛 RangeError，后者把轴标签
 * 推到 20+ 字符压穿定宽 64px 的轴条（四期-C1b 取证的唯一可达溢出）。
 */
export const MAX_PRICE_DECIMALS = 8;

/**
 * 实际小数位：品种的静态小数位可能小于行情给出的位数
 * （如螺纹钢主连标记 0 位，但报价 3053.5），取两者较大值避免截断真实精度。
 * 本函数是 `instrument.decimals` 的唯一收口（顶栏 / 自选行 / 右键菜单 / 轴标签全走它），
 * 所以精度上限只在这里钳一次即可覆盖全链。
 */
export function decimalsFor(value: number, fallback: number): number {
  const fb = Math.min(MAX_PRICE_DECIMALS, Math.max(0, fallback));
  if (!Number.isFinite(value) || value === 0) return fb;
  const s = String(value);
  const dot = s.indexOf('.');
  const actual = dot < 0 ? 0 : Math.min(4, s.length - dot - 1);
  return Math.max(fb, actual);
}

export type Direction = 'up' | 'down' | 'flat';

export function directionOf(value: number): Direction {
  if (!Number.isFinite(value) || value === 0) return 'flat';
  return value > 0 ? 'up' : 'down';
}

/** 涨跌对应的 CSS 变量；平盘用暗灰 */
export function directionVar(dir: Direction): string {
  return dir === 'up' ? 'var(--up)' : dir === 'down' ? 'var(--down)' : 'var(--text-faint)';
}
