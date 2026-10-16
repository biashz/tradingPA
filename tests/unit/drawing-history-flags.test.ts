import { describe, expect, it } from 'vitest';
import { DrawingLayer } from '@/engine/drawing/DrawingLayer';
import type { DrawingPoint } from '@/engine/drawing/types';

/**
 * 四期-C4b：历史栈可用性读数 `canUndo` / `canRedo` 的形态（DrawingLayer 层）。
 * 顶栏与对象树的置灰只读这两个布尔，故它们必须等价于「按下会不会真的改画线集」——
 *  ChartController 门面侧的委托与广播刷新见 `drawing-interactions.test.ts` 的同名 describe。
 */

const P = (time: number, price: number): DrawingPoint => ({ time, price });

describe('DrawingLayer 历史可用性读数', () => {
  it('新层：两态皆 false，且按下 undo/redo 无副作用', () => {
    const layer = new DrawingLayer();
    expect(layer.canUndo).toBe(false);
    expect(layer.canRedo).toBe(false);

    layer.undo();
    layer.redo();
    expect(layer.list()).toHaveLength(0);
    expect(layer.canUndo).toBe(false);
    expect(layer.canRedo).toBe(false);
  });

  it('落一条线：canUndo 转真、canRedo 仍假', () => {
    const layer = new DrawingLayer();
    layer.add('hline', [P(1, 100)]);
    expect(layer.canUndo).toBe(true);
    expect(layer.canRedo).toBe(false);
  });

  it('撤销到底：canUndo 归假、canRedo 转真；重做后反向', () => {
    const layer = new DrawingLayer();
    layer.add('hline', [P(1, 100)]);

    layer.undo();
    expect(layer.list()).toHaveLength(0);
    expect(layer.canUndo).toBe(false);
    expect(layer.canRedo).toBe(true);

    layer.redo();
    expect(layer.list()).toHaveLength(1);
    expect(layer.canUndo).toBe(true);
    expect(layer.canRedo).toBe(false);
  });

  it('有可重做项时再落笔清空重做栈（重做不可复原被丢弃的那步）', () => {
    const layer = new DrawingLayer();
    layer.add('hline', [P(1, 100)]);
    layer.add('hline', [P(2, 200)]);
    layer.undo();
    expect(layer.canRedo).toBe(true);

    layer.add('hline', [P(3, 300)]);
    expect(layer.canRedo).toBe(false);
    expect(layer.canUndo).toBe(true);
  });

  it('只改选中态不入栈：读数不变，且一次 undo 直接回到空集', () => {
    const layer = new DrawingLayer();
    const a = layer.add('hline', [P(1, 100)]);
    const before = layer.canUndo;

    layer.select(null);
    layer.toggleSelect(a.id);
    expect(layer.canUndo).toBe(before);
    expect(layer.canRedo).toBe(false);

    // 若选择也被记进历史，这一次 undo 只会退掉「选择」而线仍在
    layer.undo();
    expect(layer.list()).toHaveLength(0);
  });

  it('栈深上限 50：截断后读数仍真，退到底时为假且余 10 条未被抹掉', () => {
    const layer = new DrawingLayer();
    for (let i = 0; i < 60; i++) layer.add('hline', [P(i + 1, 100 + i)]);
    expect(layer.list()).toHaveLength(60);

    // 50 层可退（最早那 10 条的落笔快照已被 shift 丢弃）
    for (let i = 0; i < 50; i++) {
      expect(layer.canUndo).toBe(true);
      layer.undo();
    }
    expect(layer.canUndo).toBe(false);
    expect(layer.list()).toHaveLength(10);
    expect(layer.canRedo).toBe(true);

    // 读数为假时再按是 no-op（置灰的依据正来自这条）
    layer.undo();
    expect(layer.list()).toHaveLength(10);
  });
});
