// @vitest-environment jsdom
import { describe, expect, it, afterEach } from 'vitest';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { DrawingToolButton } from '@/features/drawings/DrawingToolButton';
import { toolCellTone } from '@/features/drawings/drawingToolbarStyles';
import { GROUPS } from '@/features/drawings/drawingToolGroups';

/**
 * 四期-C3a：flyout 展开时主按钮要有高亮（此前只看 active/hovered，展开态原样）。
 * 取色上移为 `toolCellTone` 纯函数（与四期-C2「几何上移为纯函数」同一口径：
 * 绘制处与用例读的是同一个表达式），本文件同时钉纯函数真值表与渲染产物。
 */

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** GROUPS[1] = 趋势线组（多变体 ⇒ hasFlyout，caret 会渲染） */
const GROUP = GROUPS[1];

const roots: Root[] = [];

function render(props: Partial<React.ComponentProps<typeof DrawingToolButton>> = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  act(() => {
    root.render(
      createElement(DrawingToolButton, {
        group: GROUP,
        activeTool: null,
        hovered: false,
        open: false,
        onHover: () => {},
        onActivate: () => {},
        onMainPointerDown: () => {},
        onMainPointerUp: () => {},
        onMainPointerLeave: () => {},
        onOpenFlyout: () => {},
        onCloseFlyout: () => {},
        ...props,
      }),
    );
  });
  const cell = host.querySelector<HTMLElement>('[data-role="main-cell"]');
  if (!cell) throw new Error('主按钮格未渲染');
  return { cell, style: cell.getAttribute('style') ?? '' };
}

afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});

describe('toolCellTone：三态取色（纯函数真值表）', () => {
  it('激活 > 展开/悬停：active 为真时 open/hovered 都不改色', () => {
    expect(toolCellTone({ active: true, hovered: false, open: false })).toEqual({
      background: 'var(--accent)',
      color: 'var(--text-on-accent)',
    });
    expect(toolCellTone({ active: true, hovered: true, open: true })).toEqual({
      background: 'var(--accent)',
      color: 'var(--text-on-accent)',
    });
  });

  it('展开与悬停同档（TV 的展开态就是「按住」那一档，不新增第三色）', () => {
    const hover = toolCellTone({ active: false, hovered: true, open: false });
    const open = toolCellTone({ active: false, hovered: false, open: true });
    expect(open).toEqual({ background: 'var(--panel-2)', color: 'var(--text)' });
    expect(open).toEqual(hover);
  });

  it('三态全假＝原样：底色透明、图标不覆写颜色（继承 mainBtnStyle 的 --text-dim）', () => {
    expect(toolCellTone({ active: false, hovered: false, open: false })).toEqual({
      background: 'transparent',
      color: undefined,
    });
  });
});

describe('DrawingToolButton：渲染产物跟随 toolCellTone', () => {
  it('flyout 展开（未激活、未悬停）→ 主按钮格高亮', () => {
    expect(render({ open: true }).style).toContain('var(--panel-2)');
  });

  it('对照：同一组件 open=false 时不亮（证明上一条读的是 open 而非渲染噪声）', () => {
    expect(render().style).not.toContain('var(--panel-2)');
    expect(render().style).toContain('transparent');
  });

  it('对照：hovered 单态仍亮（本批未回退既有行为）', () => {
    expect(render({ hovered: true }).style).toContain('var(--panel-2)');
  });

  it('激活态优先级：active + open 同时为真仍是强调色实心', () => {
    const { style } = render({ activeTool: 'trendline', open: true });
    expect(style).toContain('var(--accent)');
    expect(style).not.toContain('var(--panel-2)');
  });
});
