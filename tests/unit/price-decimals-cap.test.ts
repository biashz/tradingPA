import { describe, expect, it } from 'vitest';
import { PriceScale } from '@/engine/scale/PriceScale';
import { decimalsFor, MAX_PRICE_DECIMALS } from '@/data/format';

/**
 * 四期-C1b 的裁决落地：轴宽维持 64，改在**入口**钳小数位上限。
 * 取证的唯一可达溢出 = 手工写进 localStorage 的 `instrument.decimals`
 * （`store/watchlistPersist.ts:39-40` 只校验「有限数」，无上下界）。
 * `decimalsFor` 是 `instrument.decimals` 在全仓的唯一收口
 * （顶栏 `TopBar.tsx:119`、自选行 `WatchlistRow.tsx:55`、右键菜单
 * `ChartContextMenu.tsx:78/:129/:264`、轴标签 `App.tsx:67` 全走它），故钳一次覆盖全链。
 */
describe('decimalsFor 的精度钳位', () => {
  it('上限 8：落盘写 20 位也不再透传', () => {
    expect(MAX_PRICE_DECIMALS).toBe(8);
    expect(decimalsFor(1234.5, 20)).toBe(8);
    expect(decimalsFor(1234.5, 100)).toBe(8);
    // value 非有限/为 0 的那条早退分支同样受钳——早退时返回的就是 fallback
    expect(decimalsFor(0, 20)).toBe(8);
    expect(decimalsFor(Number.NaN, 20)).toBe(8);
  });

  it('下限 0：负数 fallback 不再流进 toFixed（那会每帧抛 RangeError）', () => {
    expect(decimalsFor(1234.5, -5)).toBe(1); // 钳到 0 后仍按报价实际位数（1 位）取较大值
    expect(decimalsFor(0, -5)).toBe(0); // 早退分支直接返回钳后的 fallback
    const scale = new PriceScale();
    expect(() => scale.toLabel(100, decimalsFor(0, -5))).not.toThrow();
    // 对照：不钳就是真缺陷——负位直接落到 toFixed 上必抛
    expect(() => scale.toLabel(100, -5)).toThrow(RangeError);
  });

  it('合法来源逐条不变：6 位（币安/Gate 非 USDT 对）、3 位（东财期货上限）、2 位默认、0 位标记', () => {
    expect(decimalsFor(0.00345678, 6)).toBe(6);
    expect(decimalsFor(3053.5, 3)).toBe(3);
    expect(decimalsFor(3053.5, 0)).toBe(1); // 静态标记 0 位但报价有 1 位 → 取较大值（既有语义）
    expect(decimalsFor(178.9, 2)).toBe(2);
    expect(decimalsFor(3053, 0)).toBe(0);
  });

  it('actual 侧的 4 位上限不受本次改动影响', () => {
    expect(decimalsFor(1.23456789, 2)).toBe(4);
    expect(decimalsFor(1.23456789, 8)).toBe(8);
  });

  it('端到端一条：被污染的 decimals 经 decimalsFor 后，轴标签小数位最多 8 位', () => {
    const scale = new PriceScale();
    const label = scale.toLabel(1234.5, decimalsFor(1234.5, 20));
    expect(label.split('.')[1] ?? '').toHaveLength(MAX_PRICE_DECIMALS);
    // 对照：不钳时同一条链路给出 20 位小数（墨宽 ~138px，压穿 64px 轴条）
    expect(scale.toLabel(1234.5, 20).split('.')[1]).toHaveLength(20);
  });
});
