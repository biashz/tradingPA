import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MIN_PRICE_TICKS, PRICE_TICK_PITCH, PriceScale, priceTickBudget } from '@/engine/scale/PriceScale';
import { drawGrid, drawPriceAxis } from '@/engine/renderer/drawAxes';
import { Viewport } from '@/engine/viewport/Viewport';
import { asCtx, callsOf, createMockCtx, fillTexts } from './helpers/mock-ctx';

/**
 * 价格刻度密度随面板高度（四期-C1a）。
 *
 * 钉三件事：① 预算 = 高 / 间距（单一来源常量，取下限）；② `ticks()` 缺省走该预算、显式传参
 * 仍与高度无关（既有单测的 `ticks(6)` 语义不受本批影响）；③ 同一价格域下矮面板确实变稀。
 * 域刻意取 ±30 的**指标副图量级**：主图量级（30000 级）在 776px 下预算恰回到改动前的 6，
 * 用它是证不出「变稀」的——那正是本批要的像素中性，由黄金面把关（实测仅 ⑥ ma-macd 位移）。
 */

// drawGrid 读 window.devicePixelRatio；node 环境打桩为 1（与视觉回归锁定的 DPR 一致）
beforeEach(() => {
  vi.stubGlobal('window', { devicePixelRatio: 1 });
});
afterAll(() => {
  vi.unstubAllGlobals();
});

/** 指标副图量级：留白后实际域约 -41.76..41.76 */
const scaleAt = (height: number): PriceScale => {
  const ps = new PriceScale();
  ps.setSize(height);
  ps.autoScale(-30, 30);
  return ps;
};

describe('priceTickBudget：轴高 → 条数预算', () => {
  it('默认主图高度（黄金基线 776px）预算 = 改动前写死的 6，故主图侧观感不动', () => {
    expect(priceTickBudget(776)).toBe(6);
    expect(priceTickBudget(660)).toBe(6); // round(5.5) = 6（JS 半值入上）
    expect(priceTickBudget(899)).toBe(7);
    expect(priceTickBudget(1200)).toBe(10);
  });

  it('矮面板由下限 3 托住（两条读不出步长），194px 副图预算 = 3', () => {
    expect(priceTickBudget(194)).toBe(3); // round(1.62) = 2 → 取下限
    expect(priceTickBudget(120)).toBe(MIN_PRICE_TICKS);
    expect(priceTickBudget(0)).toBe(MIN_PRICE_TICKS);
    expect(priceTickBudget(480)).toBe(4);
  });

  it('间距常量为单一来源：预算恒等于「高 / PRICE_TICK_PITCH」四舍五入后取下限', () => {
    for (const h of [0, 60, 120, 194, 300, 480, 776, 1200, 2000]) {
      expect(priceTickBudget(h)).toBe(Math.max(MIN_PRICE_TICKS, Math.round(h / PRICE_TICK_PITCH)));
    }
  });
});

describe('PriceScale.ticks()：缺省走轴高预算', () => {
  it('缺省与显式传预算等价（同一价格域、同一 height）', () => {
    for (const h of [194, 480, 776]) {
      const ps = scaleAt(h);
      expect(ps.ticks()).toEqual(ps.ticks(priceTickBudget(h)));
    }
  });

  it('显式传参仍与 height 无关（改动前语义保留）', () => {
    expect(scaleAt(194).ticks(6)).toEqual(scaleAt(776).ticks(6));
  });

  it('同一价格域下矮面板条数少于高面板，且少于改动前的固定 6 条预算', () => {
    const tall = scaleAt(776).ticks();
    const short = scaleAt(194).ticks();
    expect(tall).toHaveLength(9); // step=10
    expect(short).toHaveLength(5); // step=20（预算 3 经 nice-step 向下取整）
    expect(short.length).toBeLessThan(tall.length);
  });
});

describe('落到画布的刻度：轴标签与横向网格线共用同一条口径', () => {
  /** 源码另有 y<10 / y>chartH-2 的越界剔除，故画布条数 ≤ 预算条数 */
  const labelCount = (height: number): number => {
    const ctx = createMockCtx();
    drawPriceAxis(asCtx(ctx), scaleAt(height), 2, { chartW: 460, chartH: height }, false, 'right');
    return fillTexts(ctx).length;
  };
  const gridLineCount = (height: number): number => {
    const ctx = createMockCtx();
    drawGrid(asCtx(ctx), new Viewport(460), scaleAt(height), { chartW: 460, chartH: height }, 'horizontal');
    return callsOf(ctx, 'moveTo').filter((a) => Number(a[0]) === 0).length;
  };

  it('194px 副图：网格 5 条、标签 4 条（越界剔除后，与黄金面 ⑥ 实测同值）；776px 主图各 9 条', () => {
    expect(gridLineCount(194)).toBe(5);
    expect(labelCount(194)).toBe(4);
    expect(labelCount(776)).toBe(9);
    expect(gridLineCount(776)).toBe(9);
  });

  it('两枝同源于一次 ticks()：网格线 = 全长，标签 = 越界剔除后的子集', () => {
    for (const h of [120, 194, 300, 480, 776]) {
      const ps = scaleAt(h);
      const all = ps.ticks();
      expect(gridLineCount(h)).toBe(all.length);
      expect(labelCount(h)).toBe(all.filter((t) => ps.priceToY(t) >= 10 && ps.priceToY(t) <= h - 2).length);
    }
  });
});
