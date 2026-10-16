// @vitest-environment jsdom
import { describe, expect, it, afterEach, vi } from 'vitest';
import * as Tooltip from '@radix-ui/react-tooltip';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { IconButton } from '@/ui/primitives';
import { HistoryButtons, ReloadButton } from '@/features/layout/TopBar';
import { isFeedBusy } from '@/data/feed/types';
import type { ChartRenderer } from '@/engine/renderer/ChartRenderer';
import type { ChartSeries } from '@/features/market/useChartSeries';

/**
 * 四期-C4b：顶栏图标的两态。
 * - `disabled` 的读数来自引擎历史栈（`canUndo`/`canRedo`，纯栈形态见 drawing-history-flags，
 *   门面委托见 drawing-interactions），本文件钉的是**引擎读数 → DOM 置灰**这一段接线；
 * - `loading` 的读数来自 `series.status`，本文件钉的是谓词与它在按钮上的产物。
 * 沿用 C3a 的 jsdom + createRoot + act 形态，不为样式判断引入渲染测试依赖；
 * 本文件用 .tsx（而非 C3a 的 createElement）是因为要套 Radix Provider 与图标 children，
 * JSX 是传 children 的正规写法，createElement 只能靠 `children:` 键（oxlint 报警）。
 */

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Root[] = [];

/** 生产环境的 Provider 参数（src/App.tsx:212）：Radix Tooltip 缺 Provider 会直接抛，
 *  故所有渲染都套同一层，参数照抄不改——本文件钉的是按钮两态，不是 tooltip 行为。 */
function render(node: React.ReactElement) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  act(() => {
    root.render(
      <Tooltip.Provider delayDuration={400} skipDelayDuration={100}>
        {node}
      </Tooltip.Provider>,
    );
  });
  return host;
}

afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});

function button(host: HTMLElement, label: string): HTMLButtonElement {
  const b = host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  if (!b) throw new Error(`未找到按钮：${label}`);
  return b;
}

/** 只填本批用到的四个成员；其余成员对置灰读数不可达，故不做完整替身 */
function makeStubRenderer(flags: { undo: boolean; redo: boolean }) {
  const state = { ...flags };
  const listeners = new Set<() => void>();
  const stub = {
    get canUndo() {
      return state.undo;
    },
    get canRedo() {
      return state.redo;
    },
    onDrawingsChanged(cb: () => void) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    undoDrawing: vi.fn(),
    redoDrawing: vi.fn(),
    /** 改栈后由测试调用，模拟引擎广播 */
    emit(next: Partial<{ undo: boolean; redo: boolean }>) {
      Object.assign(state, next);
      for (const cb of listeners) cb();
    },
    get offCount() {
      return listeners.size;
    },
  };
  return { stub, asRenderer: stub as unknown as ChartRenderer };
}

function makeSeries(status: ChartSeries['status'], mode: ChartSeries['mode'] = 'live') {
  return { status, mode, reload: vi.fn() } as unknown as ChartSeries;
}

describe('isFeedBusy：在途谓词真值表', () => {
  it('loading / reconnecting 为在途', () => {
    expect(isFeedBusy('loading')).toBe(true);
    expect(isFeedBusy('reconnecting')).toBe(true);
  });

  it('idle / live / error 不在途（idle 不该把按钮按住）', () => {
    expect(isFeedBusy('idle')).toBe(false);
    expect(isFeedBusy('live')).toBe(false);
    expect(isFeedBusy('error')).toBe(false);
  });
});

describe('IconButton：两态的渲染产物', () => {
  /** `<i/>` 是图标的替身：断言转圈时它被包住而非被换掉 */
  const glyph = <i />;
  const props = { onClick: () => {}, title: '复原' };

  it('缺省（两态都不给）＝可点、指针光标、无转圈包裹', () => {
    const host = render(<IconButton {...props}>{glyph}</IconButton>);
    const b = button(host, '复原');
    expect(b.disabled).toBe(false);
    expect(b.style.cursor).toBe('pointer');
    expect(b.style.color).toBe('var(--text-dim)');
    expect(host.querySelector('.spin')).toBeNull();
    expect(b.querySelector('i')).not.toBeNull();
  });

  it('disabled：原生置灰 + 指针变默认 + 颜色降到 --text-faint', () => {
    const host = render(
      <IconButton {...props} disabled>
        {glyph}
      </IconButton>,
    );
    const b = button(host, '复原');
    expect(b.disabled).toBe(true);
    expect(b.style.cursor).toBe('default');
    expect(b.style.color).toBe('var(--text-faint)');
    expect(host.querySelector('.spin')).toBeNull();
  });

  it('disabled 时点击不落到 onClick（原生 disabled 屏蔽激活行为，而非组件内自行吞掉）', () => {
    const onClick = vi.fn();
    const host = render(
      <IconButton {...props} onClick={onClick} disabled>
        {glyph}
      </IconButton>,
    );
    act(() => button(host, '复原').click());
    expect(onClick).not.toHaveBeenCalled();
  });

  it('loading：转圈 + 按住 + 保留原色（在途不是「不可用」）', () => {
    const host = render(
      <IconButton {...props} loading>
        {glyph}
      </IconButton>,
    );
    const b = button(host, '复原');
    expect(b.disabled).toBe(true);
    expect(b.getAttribute('aria-busy')).toBe('true');
    expect(b.style.color).toBe('var(--text-dim)');
    const wrap = host.querySelector('.spin');
    expect(wrap).not.toBeNull();
    expect(wrap?.parentElement).toBe(b);
    expect(wrap?.firstElementChild?.tagName).toBe('I'); // 图标被包住，不是被换掉
  });

  it('active 与 disabled 同时为真时 disabled 优先（不会残留强调色实心）', () => {
    const host = render(
      <IconButton {...props} active disabled>
        {glyph}
      </IconButton>,
    );
    const b = button(host, '复原');
    expect(b.style.background).not.toBe('var(--accent)');
    expect(b.style.background).toBe('transparent');
  });
});

describe('HistoryButtons：引擎读数 → 顶栏置灰', () => {
  it('按当前栈深播种：可复原不可重做', () => {
    const { asRenderer } = makeStubRenderer({ undo: true, redo: false });
    const host = render(<HistoryButtons renderer={asRenderer} />);
    expect(button(host, '复原').disabled).toBe(false);
    expect(button(host, '重做').disabled).toBe(true);
  });

  it('对照：空历史时两颗都灰（读数为假即不可点，不靠样式蒙）', () => {
    const { asRenderer } = makeStubRenderer({ undo: false, redo: false });
    const host = render(<HistoryButtons renderer={asRenderer} />);
    expect(button(host, '复原').disabled).toBe(true);
    expect(button(host, '重做').disabled).toBe(true);
  });

  it('renderer 为 null（多格布局）＝两颗都灰', () => {
    const host = render(<HistoryButtons renderer={null} />);
    expect(button(host, '复原').disabled).toBe(true);
    expect(button(host, '重做').disabled).toBe(true);
  });

  it('画线变更广播后读数翻转——灰态跟着引擎走，而非停在首帧', () => {
    const { stub, asRenderer } = makeStubRenderer({ undo: false, redo: false });
    const host = render(<HistoryButtons renderer={asRenderer} />);
    expect(button(host, '复原').disabled).toBe(true);

    act(() => stub.emit({ undo: true }));
    expect(button(host, '复原').disabled).toBe(false);

    act(() => stub.emit({ undo: false, redo: true }));
    expect(button(host, '复原').disabled).toBe(true);
    expect(button(host, '重做').disabled).toBe(false);
  });

  it('可点时按下调用引擎写口（证明置灰不只是样式，接线也在）', () => {
    const { stub, asRenderer } = makeStubRenderer({ undo: true, redo: true });
    const host = render(<HistoryButtons renderer={asRenderer} />);
    act(() => button(host, '复原').click());
    act(() => button(host, '重做').click());
    expect(stub.undoDrawing).toHaveBeenCalledTimes(1);
    expect(stub.redoDrawing).toHaveBeenCalledTimes(1);
  });

  it('卸载时退订（不留悬挂监听）', () => {
    const { stub, asRenderer } = makeStubRenderer({ undo: true, redo: false });
    render(<HistoryButtons renderer={asRenderer} />);
    expect(stub.offCount).toBe(1);
    act(() => roots.pop()?.unmount());
    expect(stub.offCount).toBe(0);
  });
});

describe('ReloadButton：series.status → 在途态', () => {
  it('loading：转圈且拒绝重复点击，标题仍按数据态取值', () => {
    const series = makeSeries('loading');
    const host = render(<ReloadButton series={series} />);
    const b = button(host, '重新加载历史数据');
    expect(b.disabled).toBe(true);
    expect(host.querySelector('.spin')).not.toBeNull();
    expect(series.reload).not.toHaveBeenCalled();
  });

  it('reconnecting 同在途（谓词两侧一致）', () => {
    const host = render(<ReloadButton series={makeSeries('reconnecting')} />);
    expect(button(host, '重新加载历史数据').disabled).toBe(true);
  });

  it('live 不在途：可点且按下调用 series.reload', () => {
    const series = makeSeries('live');
    const host = render(<ReloadButton series={series} />);
    const b = button(host, '重新加载历史数据');
    expect(b.disabled).toBe(false);
    expect(host.querySelector('.spin')).toBeNull();
    act(() => b.click());
    expect(series.reload).toHaveBeenCalledTimes(1);
  });

  it('mock 降级态用另一条标题（重新连接实时数据），且在途判定不变', () => {
    const host = render(<ReloadButton series={makeSeries('error', 'mock')} />);
    expect(button(host, '重新连接实时数据').disabled).toBe(false);
  });
});
