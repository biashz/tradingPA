import { describe, expect, it } from 'vitest';
import { pctChipColors } from '@/features/watchlist/watchlistShared';
import { directionOf } from '@/data/format';

/**
 * 涨跌幅 chip 的「底色 + 前景色」配对（四期-C5a）。
 * 承重性质不是具体色值，而是**平盘档的字色必须与平盘底成对**：
 * 修复前浅色主题平盘 chip 走 `--on-updown`（白）压 `--elevated`（浅灰 #e0e3eb），
 * 实测对比度 1.28:1（深色主题走同一段代码是 11.36:1，所以这是一条只在浅色现形的缺陷）。
 * 浅色侧的两个令牌值由 `tests/e2e/watchlist.spec.ts` 的主题令牌用例钉住。
 */

describe('pctChipColors 的字色配对', () => {
  it('涨/跌档：涨跌底 + 反白字', () => {
    expect(pctChipColors('up', true)).toEqual({ color: 'var(--on-updown)', background: 'var(--up)' });
    expect(pctChipColors('down', true)).toEqual({ color: 'var(--on-updown)', background: 'var(--down)' });
  });

  it('平盘档：走 elevated 成对令牌，不沿用涨跌档的白字', () => {
    const chip = pctChipColors('flat', true);
    expect(chip).toEqual({ color: 'var(--on-elevated)', background: 'var(--elevated)' });
    // 这条是本批的原始缺陷面：字色退回 --on-updown 即浅色平盘不可读
    expect(chip.color).not.toBe('var(--on-updown)');
  });

  it('无报价：底透明、字走 --text-faint，且与方向无关', () => {
    for (const dir of ['up', 'down', 'flat'] as const) {
      expect(pctChipColors(dir, false)).toEqual({ color: 'var(--text-faint)', background: 'transparent' });
    }
  });

  it('平盘档可达：涨跌幅恰为 0 即判 flat', () => {
    expect(directionOf(0)).toBe('flat');
  });
});
