import { test, expect, type Page } from '@playwright/test';

/** DEV 调试句柄窄接口（Chart.tsx 在 dev 构建挂 window.__chartRenderer） */
interface ChartRendererLike {
  pipeline: { draw: () => void };
  invalidate(): void;
}

interface FaultProbe {
  has: boolean;
  throws: number;
  okFrames: number;
}

/**
 * 二期-C1 事故的浏览器级回归：谐波比率标签越界抛错时，rAF 循环把
 * `requestAnimationFrame` 排在帧体之后，一次异常就永久冻死整张画布——
 * 用户侧表现为「ABCD 分类下所有画线工具没效果」，须刷新页面。
 * 这里在真实浏览器里注入绘制异常，验证循环存活且后续帧照常绘制（单测走假帧队列，此处补真帧）。
 */
test('绘制异常不冻结画布：注入帧内抛错后 rAF 循环仍继续', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  await page.goto('/');
  await expect(page.getByText(/[1-9][0-9,]* 根/)).toBeVisible({ timeout: 20_000 });

  const probe = await page.evaluate<FaultProbe>(async () => {
    const r = (window as unknown as { __chartRenderer?: ChartRendererLike }).__chartRenderer;
    if (!r) return { has: false, throws: 0, okFrames: 0 };
    const pipeline = r.pipeline;
    const orig = pipeline.draw;
    const THROWS = 3;
    let throws = 0;
    let okFrames = 0;
    // 前 THROWS 帧抛错、之后放行：异常不得吞（上抛到 window.onerror），循环必须继续挂帧并恢复绘制
    pipeline.draw = () => {
      if (throws < THROWS) {
        throws++;
        throw new TypeError('e2e 注入：绘制越界');
      }
      orig.call(pipeline);
      okFrames++;
    };
    // 持续施加重绘压力（等价行情推送）：dirty 一次性消费，不补 invalidate 帧体不会反复进入 draw
    const pump = setInterval(() => r.invalidate(), 20);
    await new Promise((res) => setTimeout(res, 900));
    clearInterval(pump);
    pipeline.draw = orig;
    return { has: true, throws, okFrames };
  });

  test.skip(!probe.has, '无 DEV 调试句柄（仅 dev 构建暴露 window.__chartRenderer）');
  expect(probe.throws).toBe(3); // 连续 3 帧确实抛了（第一帧抛错即旧实现的死点）
  expect(probe.okFrames).toBeGreaterThan(0); // 循环没断：后续帧照常绘制完成
  expect(pageErrors.length).toBeGreaterThanOrEqual(3); // 异常未被静默吞
});

/** 左工具栏 flyout：TV 交互模型——按住 300ms 展开、已激活组单击展开、caret 即时开关、热键选工具 */
test('画线工具 flyout 交互与 TV 一致', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/[1-9][0-9,]* 根/)).toBeVisible({ timeout: 20_000 });

  const groupBtn = page.getByRole('button', { name: '趋势线', exact: true });
  await expect(groupBtn).toBeVisible();
  const box = (await groupBtn.boundingBox())!;
  const center = { x: box.x + box.width / 2 - 4, y: box.y + box.height / 2 };

  // 1) 按住 > 300ms 展开 flyout，松开后保持打开
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.waitForTimeout(600);
  await page.mouse.up();
  const hlineItem = page.getByRole('menuitem', { name: /水平线/ });
  await expect(hlineItem).toBeVisible();
  // 选中行带快捷键提示
  await expect(page.getByText('Alt + H')).toBeVisible();
  await hlineItem.click();
  await expect(page.getByRole('button', { name: '水平线', exact: true })).toBeVisible();

  // 2) 已激活组单击 → 展开 flyout（TV 行为），Esc 关闭
  await page.getByRole('button', { name: '水平线', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: /水平线/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menuitem', { name: /水平线/ })).toBeHidden();

  // 3) caret 即时开关（无需等待）
  const caret = page.locator('button[data-role="menu-handle"]').first();
  await caret.click();
  await expect(page.getByRole('menuitem', { name: /射线/ })).toBeVisible();
  await caret.dispatchEvent('click'); // caret 自身 handler：切换关闭
  await expect(page.getByRole('menuitem', { name: /射线/ })).toBeHidden();

  // 4) 外部点击关闭
  await caret.click();
  await expect(page.getByRole('menuitem', { name: /射线/ })).toBeVisible();
  await page.mouse.click(600, 400);
  await expect(page.getByRole('menuitem', { name: /射线/ })).toBeHidden();

  // 5) 未激活组快速单击 = 直接激活，不弹菜单（矩形组此时未激活）
  await page.getByRole('button', { name: '矩形', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: /射线/ })).toBeHidden();
  await expect(page.getByRole('button', { name: '矩形', exact: true })).toHaveAttribute('aria-pressed', 'true');

  // 6) TV 热键 Alt+H 选水平线
  await page.keyboard.press('Alt+h');
  await expect(page.getByRole('button', { name: '水平线', exact: true })).toBeVisible();
});

/** 引擎历史栈读数 + 画线数量（四期-C4b 端到端用；同样只经 DEV 句柄的公开面） */
interface HistoryLike {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  listDrawings(): unknown[];
}

function readHistory(page: Page): Promise<{ canUndo: boolean; canRedo: boolean; n: number }> {
  return page.evaluate(() => {
    const c = (window as unknown as { __chartRenderer?: HistoryLike }).__chartRenderer;
    if (!c) throw new Error('无 DEV 引擎句柄 window.__chartRenderer');
    return { canUndo: c.canUndo, canRedo: c.canRedo, n: c.listDrawings().length };
  });
}

/**
 * 四期-C4b：顶栏「复原 / 重做」的置灰由引擎历史栈读数驱动，端到端钉整条链
 * （栈 → `canUndo`/`canRedo` → `onDrawingsChanged` 广播 → React state → 原生 disabled）。
 * 单测各自钉了一段（纯栈形态 / 门面委托 / 替身渲染），这段的意义是**真引擎与真 React 之间的
 * 那根线**：把 `HistoryButtons` 的订阅摘掉或把读数写死，本用例即红。
 */
test('顶栏复原/重做置灰跟随引擎历史栈', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/[1-9][0-9,]* 根/)).toBeVisible({ timeout: 20_000 });

  const undo = page.getByRole('button', { name: '复原', exact: true });
  const redo = page.getByRole('button', { name: '重做', exact: true });
  const canvas = page.locator('canvas').first();

  // 空栈（重载后历史必为空，与是否有既存画线无关）：两颗都灰
  const base = await readHistory(page);
  expect(base.canUndo).toBe(false);
  expect(base.canRedo).toBe(false);
  await expect(undo).toBeDisabled();
  await expect(redo).toBeDisabled();

  // 落一条水平线：复原亮、重做仍灰，且 DOM 的置灰与引擎读数同向
  await page.keyboard.press('Alt+h');
  await canvas.click({ position: { x: 400, y: 300 } });
  await expect(undo).toBeEnabled();
  await expect(redo).toBeDisabled();
  const afterPlace = await readHistory(page);
  expect(afterPlace.n).toBe(base.n + 1);
  expect({ undoDisabled: await undo.isDisabled(), redoDisabled: await redo.isDisabled() }).toEqual({
    undoDisabled: !afterPlace.canUndo,
    redoDisabled: !afterPlace.canRedo,
  });

  // 按复原：画线退回、重做接手——读数跟着广播回来，不停在首帧
  await undo.click();
  await expect(undo).toBeDisabled();
  await expect(redo).toBeEnabled();
  expect((await readHistory(page)).n).toBe(base.n);

  // 按重做：回到「可复原、不可重做」
  await redo.click();
  await expect(undo).toBeEnabled();
  await expect(redo).toBeDisabled();
  expect((await readHistory(page)).n).toBe(base.n + 1);

  // 同一读数的第二处消费者：对象树头部那颗原生按钮（无 aria-label，按 title 命中）
  await page.getByRole('button', { name: '对象树' }).click();
  const treeUndo = page.locator('button[title="撤销 (Ctrl+Z)"]');
  const treeRedo = page.locator('button[title="重做 (Ctrl+Y)"]');
  await expect(treeUndo).toBeEnabled();
  await expect(treeRedo).toBeDisabled();
  await treeUndo.click();
  await expect(treeUndo).toBeDisabled();
  await expect(treeRedo).toBeEnabled();
  // 两处消费者读的是同一个栈：顶栏跟着退回「不可复原」
  await expect(undo).toBeDisabled();
});
