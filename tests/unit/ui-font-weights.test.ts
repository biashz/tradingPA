import { describe, expect, it } from 'vitest';
import { fontWeight } from '@/ui/tokens';

/**
 * 字重三档单一来源（四期-C5b）。
 * 审计行记的是「四档并存」，故这里钉的是**档位数与档位间关系**，不是具体磅值：
 * 加第四档 ⇒ 键数断言报红；把某档改成中间磅值（550/650）⇒ 大小关系或集合断言报红。
 * 站点侧的完整性用可复现的 grep 读数取证（`fontWeight: [0-9]` 在 src 内零命中），
 * 不在这里造一个扫描源码的新机制。
 */

describe('fontWeight 令牌三档', () => {
  it('恰好三档', () => {
    expect(Object.keys(fontWeight)).toEqual(['body', 'emphasis', 'brand']);
  });

  it('严格递增，且相邻档至少差 100（防「500 与 600 同语义并存」复发）', () => {
    expect(fontWeight.body).toBeLessThan(fontWeight.emphasis);
    expect(fontWeight.emphasis).toBeLessThan(fontWeight.brand);
    expect(fontWeight.emphasis - fontWeight.body).toBeGreaterThanOrEqual(100);
    expect(fontWeight.brand - fontWeight.emphasis).toBeGreaterThanOrEqual(100);
  });

  it('三档值即收敛后的磅值集合 {400,600,700}', () => {
    expect(Object.values(fontWeight).sort((a, b) => a - b)).toEqual([400, 600, 700]);
  });
});
