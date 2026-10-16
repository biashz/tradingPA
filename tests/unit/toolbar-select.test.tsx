// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ToolbarSelect, type ToolbarOption } from '@/ui/ToolbarSelect';

/**
 * 四期-C4c：`ChartContextMenu:314` / `PineEditorPanel:69,86` / `ReplayBar:198` 四处原生 select
 * 收敛到本组件。这里钉的是**收敛所依赖的三条组件契约**：
 * ① 触发器是 `button` 且文档内不再有 `select`；② `title` 透传（additive，缺省不写属性）；
 * ③ `value` 不在选项内时靠 `label` 显文案——Pine 那两处「动作提示」型全靠这条。
 * 沿用 C3a/C4b 的 jsdom + createRoot + act 形态，不为此引入渲染测试依赖。
 *
 * **菜单展开这一段刻意不在本文件测**：Radix Menu 的 Trigger 不响应 `click`，它在 effect 里
 * 延迟挂一个 **document 级 `pointerup`** 监听来开合（本轮实测：`dispatchEvent(click)` 后
 * `aria-expanded` 仍为 `false`）。jsdom 里补这条链要靠伪造时序，钉住的是 Radix 内部实现而非
 * 本项目行为 ⇒ 展开态（选项列表 / 当前项勾选 / 点击回调 value）改由三条 E2E 覆盖，走浏览器真实
 * 指针事件：`price-scale-alert.spec.ts`（条件 → 落盘 crossDown）、`interactions.spec.ts`（倍速
 * 1x → 4x）、`pine.spec.ts`（两只动作菜单载入与删除）。
 */

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

function render(node: React.ReactElement): HTMLElement {
  // Radix Popper 的 useRect 会 new ResizeObserver，jsdom 没有 ⇒ 空实现即可（本文件不测避让几何）
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  act(() => root.render(node));
  return host;
}

afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

const OPTIONS: ToolbarOption[] = [
  { value: 'a', label: '甲' },
  { value: 'b', label: '乙' },
  { value: 'c', label: '丙' },
];

const trigger = (host: HTMLElement) => host.querySelector('button')!;

describe('ToolbarSelect：原生 select 收敛后的组件契约', () => {
  it('触发器是 button，文档内不再有 select 元素', () => {
    const host = render(<ToolbarSelect ariaLabel="测试下拉" value="a" options={OPTIONS} onChange={() => {}} />);
    expect(trigger(host).tagName).toBe('BUTTON');
    expect(document.querySelector('select')).toBeNull();
    expect(trigger(host).getAttribute('aria-label')).toBe('测试下拉');
  });

  it('title 透传到触发器；未传时不写该属性', () => {
    const withTitle = render(
      <ToolbarSelect ariaLabel="播放倍速" title="播放倍速" value="1" options={OPTIONS} onChange={() => {}} />,
    );
    expect(trigger(withTitle).getAttribute('title')).toBe('播放倍速');
    const without = render(<ToolbarSelect ariaLabel="无提示" value="a" options={OPTIONS} onChange={() => {}} />);
    expect(trigger(without).hasAttribute('title'), '缺省时不该凭空长出一个空 title').toBe(false);
  });

  it('value 命中 ⇒ 显当前项文案；未命中 + label ⇒ 显 label；未命中无 label ⇒ 显原值', () => {
    const hit = render(<ToolbarSelect ariaLabel="x" value="b" options={OPTIONS} onChange={() => {}} />);
    expect(trigger(hit).textContent).toContain('乙');

    // Pine 的「动作提示」型：value 恒为 ''，选项里没有 ''，触发器文案完全由 label 承载
    const action = render(
      <ToolbarSelect ariaLabel="已保存脚本" value="" label="已保存（2）…" options={OPTIONS} onChange={() => {}} />,
    );
    expect(trigger(action).textContent).toContain('已保存（2）…');

    const fallback = render(<ToolbarSelect ariaLabel="x" value="zz" options={OPTIONS} onChange={() => {}} />);
    expect(trigger(fallback).textContent).toContain('zz');
  });
});
