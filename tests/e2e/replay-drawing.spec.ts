import { test, expect, type Page } from '@playwright/test';

/**
 * 四期-E1：回放态画线的行为取证（把 `AUDIT-TV-FEATURE-GAP`「回放中画线未验证」钉成被测事实）
 *
 * 本文件**只描述现状，不主张应当如此**：游标之右（未揭示的未来 bar）可以画线、磁吸开时
 * 会把线吸附到那根未来 bar 的 OHLC、回放中右键命中画线则两个菜单都不出现——这三条是不是
 * 期望行为待用户裁决（PLAN-PHASE4 §2-E1「再决定要不要限制」）。若日后加钳制，本文件即 tripwire。
 *
 * 只经 `ChartController` 的公开面取值（`replayIndex` / `lastBarTime` / `listDrawings()` /
 * `setReplayIndex()` / `removeDrawing()` / `dataWindowSnapshot` / `screenshot()`）；未来 bar 的
 * OHLC 一律先把游标推过去、再从数据窗口读回，不在落笔前偷看序列内部。
 */

interface EngBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}
interface EngDrawing {
  id: string;
  type: string;
  points: Array<{ time: number; price: number }>;
  style: { color: string };
}
interface EngLike {
  readonly replayIndex: number | null;
  readonly lastBarTime: number;
  readonly magnetMode: 'weak' | 'strong';
  listDrawings(): EngDrawing[];
  setReplayIndex(index: number | null): void;
  removeDrawing(id: string): void;
  readonly dataWindowSnapshot: { index: number; bar: EngBar | null };
  screenshot(): string;
}

/** 句柄缺失即抛——不用 test.skip 把断言悄悄吞掉（守卫写在每个 evaluate 体内：
 *  Playwright 不把函数当参数序列化，故无法集中成一个页内 helper） */
interface FlatDrawing {
  id: string;
  type: string;
  /** 首锚点（本文件用例只断言首锚；趋势线的次锚另读） */
  time: number;
  price: number;
  color: string;
  points: number;
}
interface EngState {
  replayIndex: number | null;
  lastBarTime: number;
  magnetMode: 'weak' | 'strong';
  drawings: FlatDrawing[];
}
interface RevealRow {
  index: number;
  bar: EngBar;
}

function read(page: Page): Promise<EngState> {
  return page.evaluate(() => {
    const c = (window as unknown as { __chartRenderer?: EngLike }).__chartRenderer;
    if (!c) throw new Error('无 DEV 引擎句柄 window.__chartRenderer');
    return {
      replayIndex: c.replayIndex,
      lastBarTime: c.lastBarTime,
      magnetMode: c.magnetMode,
      drawings: c.listDrawings().map((d) => ({
        id: d.id,
        type: d.type,
        time: d.points[0].time,
        price: d.points[0].price,
        color: d.style.color,
        points: d.points.length,
      })),
    };
  });
}

function cursorBarTime(page: Page): Promise<number> {
  return page.evaluate(() => {
    const c = (window as unknown as { __chartRenderer?: EngLike }).__chartRenderer;
    if (!c) throw new Error('无 DEV 引擎句柄 window.__chartRenderer');
    // 鼠标已离开画布（parkMouse）→ 十字光标清空，数据窗口回落回放游标
    return c.dataWindowSnapshot.bar?.time ?? -1;
  });
}

function setCursor(page: Page, index: number) {
  return page.evaluate((i) => {
    const c = (window as unknown as { __chartRenderer?: EngLike }).__chartRenderer;
    if (!c) throw new Error('无 DEV 引擎句柄 window.__chartRenderer');
    c.setReplayIndex(i);
  }, index);
}

function removeDrawing(page: Page, id: string) {
  return page.evaluate((d) => {
    const c = (window as unknown as { __chartRenderer?: EngLike }).__chartRenderer;
    if (!c) throw new Error('无 DEV 引擎句柄 window.__chartRenderer');
    c.removeDrawing(d);
  }, id);
}

/** 逐根揭示：index → bar（未来 bar 的 OHLC 只能这样公开地拿到；含游标当前根） */
function revealForward(page: Page, from: number, to: number): Promise<RevealRow[]> {
  return page.evaluate(
    (r) => {
      const c = (window as unknown as { __chartRenderer?: EngLike }).__chartRenderer;
      if (!c) throw new Error('无 DEV 引擎句柄 window.__chartRenderer');
      const out: RevealRow[] = [];
      for (let i = r.from; i <= r.to; i++) {
        c.setReplayIndex(i);
        const bar = c.dataWindowSnapshot.bar;
        if (bar) out.push({ index: i, bar });
      }
      return out;
    },
    { from, to },
  );
}

/** 画布某列上与 color 同色的像素行数（只用公开 `screenshot()`，不碰内部 canvas） */
function columnHits(page: Page, color: string, x: number): Promise<number> {
  return page.evaluate(
    (a) => {
      const c = (window as unknown as { __chartRenderer?: EngLike }).__chartRenderer;
      if (!c) throw new Error('无 DEV 引擎句柄 window.__chartRenderer');
      const img = new Image();
      img.src = c.screenshot();
      return new Promise<number>((resolve, reject) => {
        img.onload = () => {
          const cv = document.createElement('canvas');
          cv.width = img.width;
          cv.height = img.height;
          const ctx = cv.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const target = [1, 3, 5].map((i) => parseInt(a.color.slice(i, i + 2), 16));
          const el = document.querySelector('canvas') as HTMLCanvasElement;
          const px = Math.round(a.x * (img.width / el.clientWidth));
          let hits = 0;
          for (let py = 0; py < cv.height; py++) {
            const d = ctx.getImageData(px, py, 1, 1).data;
            if ([0, 1, 2].every((k) => Math.abs(d[k] - target[k]) <= 8)) hits++;
          }
          resolve(hits);
        };
        img.onerror = () => reject(new Error('截图解码失败'));
      });
    },
    { color, x },
  );
}

async function boot(page: Page) {
  await page.goto('/');
  await expect(page.getByText(/[1-9][0-9,]* 根/)).toBeVisible({ timeout: 20_000 });
}

/** 鼠标离开画布：十字光标清空后，数据窗口读数才回落到回放游标 */
async function parkMouse(page: Page) {
  await page.mouse.move(4, 4);
  await page.waitForTimeout(60);
}

/** 进入回放：点顶栏「回放」→ 点图表定游标（落点即该 bar，故游标像素 ≈ 点击 x） */
async function enterReplay(page: Page, x = 500, y = 300) {
  await page.getByRole('button', { name: /回放：点击后/ }).click();
  await page.locator('canvas').first().click({ position: { x, y } });
  await parkMouse(page);
}

const canvasOf = (page: Page) => page.locator('canvas').first();
const hline = (page: Page, x: number, y: number) =>
  page.keyboard.press('Alt+h').then(() => canvasOf(page).click({ position: { x, y } }));
const trendline = (page: Page, a: [number, number], b: [number, number]) =>
  page.keyboard
    .press('Alt+t')
    .then(() => canvasOf(page).click({ position: { x: a[0], y: a[1] } }))
    .then(() => canvasOf(page).click({ position: { x: b[0], y: b[1] } }));

/** 未来 bar 的 time 单调；取 time ≤ 锚点的最后一根。调用方须先证明表格覆盖到了锚点，
 *  否则末行会冒充命中（`covers` 即为此而设） */
const rowAtOrBefore = (table: RevealRow[], time: number) =>
  table.filter((r) => r.bar.time <= time).slice(-1)[0] ?? null;
const covers = (table: RevealRow[], time: number) => table.length > 0 && table[table.length - 1].bar.time >= time;
const inOhlc = (price: number, bar: EngBar) => [bar.open, bar.high, bar.low, bar.close].includes(price);

test('回放中画线不限左右：游标之右的锚点落在未揭示的未来 bar 上，且游标推进不移动锚点', async ({ page }) => {
  await boot(page);
  await enterReplay(page, 500, 300);

  const start = await read(page);
  expect(start.replayIndex).not.toBeNull();
  const cursorIndex = start.replayIndex!;
  const cursorTime = await cursorBarTime(page);

  await hline(page, 300, 300); // 游标左（已揭示区）
  await hline(page, 650, 320); // 游标右（未揭示区；游标就在 x=500）

  const s = await read(page);
  expect(s.drawings).toHaveLength(2);
  expect(s.drawings[0].time).toBeLessThan(cursorTime);
  expect(s.drawings[1].time).toBeGreaterThan(cursorTime);

  const table = await revealForward(page, cursorIndex + 1, cursorIndex + 60);
  expect(covers(table, s.drawings[1].time), '揭示表格须覆盖到右锚点').toBe(true);
  const future = rowAtOrBefore(table, s.drawings[1].time);
  expect(future, '右锚点应落在游标之右的某根未来 bar 上').not.toBeNull();
  expect(future!.index).toBeGreaterThan(cursorIndex);
  // 磁吸关时落点时刻是两根 bar 之间的插值（`coords.ts` 的 `magnet === 'off'` 分支），
  // 故锚点不等于任何一根 bar 的 time——这条也必须钉住，否则日后改成对齐 bar 会无人察觉
  expect(
    table.some((r) => r.bar.time === s.drawings[1].time),
    '未开磁吸时锚点不该正落在某根 bar 上',
  ).toBe(false);

  // 锚点是 time 制：把游标推到锚点左侧那根，线不跟着走
  const before = s.drawings[1];
  await setCursor(page, future!.index);
  const after = await read(page);
  expect(after.drawings[1].time).toBe(before.time);
  expect(after.drawings[1].price).toBe(before.price);
  expect(await cursorBarTime(page)).toBe(future!.bar.time);
});

test('磁吸开：在游标之右画线会吸附到那根未揭示 bar 的 OHLC（未来价读数泄露）；磁吸关为对照', async ({ page }) => {
  await boot(page);
  await enterReplay(page, 500, 300);
  const cursorIndex = (await read(page)).replayIndex!;

  // 强磁铁：始终吸附（弱档只在 50px 内生效，会把取证变成碰运气）
  await page.getByRole('button', { name: '磁吸', exact: true }).click();
  await page.getByRole('button', { name: '磁吸模式' }).click();
  await page.getByRole('menuitem', { name: /强磁铁/ }).click();
  // 档位链两端都要证明落地，再解读吸附结果：UI 侧（store）与引擎侧各一条——
  // 「弱/强」只写进 store、不下发引擎的断链曾被这条断言抓到过
  await expect(page.getByRole('button', { name: '磁吸', exact: true })).toHaveAttribute('title', '磁吸（强磁铁）');
  expect((await read(page)).magnetMode, '强磁铁档应已下发到引擎').toBe('strong');

  await hline(page, 620, 330);
  const magnetLine = (await read(page)).drawings.slice(-1)[0];
  const table = await revealForward(page, cursorIndex + 1, cursorIndex + 60);
  expect(covers(table, magnetLine.time), '揭示表格须覆盖到磁吸锚点').toBe(true);
  const magnetBar = rowAtOrBefore(table, magnetLine.time);
  expect(magnetBar, '磁吸落点应锚在未来 bar 上').not.toBeNull();
  expect(magnetBar!.bar.time, '磁吸开时锚点时刻正落在该 bar 上').toBe(magnetLine.time);
  expect(
    inOhlc(magnetLine.price, magnetBar!.bar),
    `吸附价 ${magnetLine.price} 应等于该未来 bar 的 OHLC 之一（用户此刻看不到这些数字）`,
  ).toBe(true);

  // 对照：磁吸关，同区域再画一条 → 既不正落在 bar 上、价格也不命中任何 OHLC
  //（证明上一条的相等来自磁吸而非巧合）
  await page.getByRole('button', { name: '磁吸', exact: true }).click();
  expect(await page.getByRole('button', { name: '磁吸', exact: true }).getAttribute('aria-pressed')).toBe('false');

  await hline(page, 700, 340);
  const plainLine = (await read(page)).drawings.slice(-1)[0];
  expect(plainLine.id).not.toBe(magnetLine.id);
  const plainBar = rowAtOrBefore(table, plainLine.time);
  expect(plainBar, '对照落点也该在未来区').not.toBeNull();
  expect(
    table.some((r) => r.bar.time === plainLine.time),
    '磁吸关时锚点时刻应是两根 bar 之间的插值',
  ).toBe(false);
  expect(inOhlc(plainLine.price, plainBar!.bar), `自由落点价 ${plainLine.price} 不该命中 OHLC`).toBe(false);
});

test('回放中右键命中画线：画线菜单与下单浮窗都不出现（非回放同点出画线菜单为对照）', async ({ page }) => {
  await boot(page);
  await enterReplay(page, 500, 300);
  const box = (await canvasOf(page).boundingBox())!;

  // 磁吸默认关：y=300 落笔的水平线就画在 y=300，右键同像素必命中该线
  await hline(page, 300, 300);
  expect((await read(page)).drawings).toHaveLength(1);

  await page.mouse.move(box.x + 300, box.y + 300);
  await page.mouse.down({ button: 'right' });
  await page.mouse.up({ button: 'right' });
  await page.waitForTimeout(150);
  await expect(page.locator('[role="menu"]')).toHaveCount(0);
  await expect(page.locator('[data-testid="chart-order-menu"]')).toHaveCount(0);

  // 同帧对照：空白处右键 → 下单浮窗出现（证明检测子能看见浮窗，上一条断言不是选择器空转）
  await page.mouse.move(box.x + 640, box.y + 430);
  await page.mouse.down({ button: 'right' });
  await page.mouse.up({ button: 'right' });
  await expect(page.locator('[data-testid="chart-order-menu"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="chart-order-menu"]')).toContainText('点击价');

  // 退出回放后重画一条并右键同像素 → 画线菜单出现（差异只发生在回放态）
  await page.mouse.click(box.x + 60, box.y + 60);
  await page.getByTitle('退出回放').click();
  await parkMouse(page);
  await hline(page, 300, 500);
  await page.mouse.move(box.x + 300, box.y + 500);
  await page.mouse.down({ button: 'right' });
  await page.mouse.up({ button: 'right' });
  await expect(page.locator('[role="menu"]')).toHaveCount(1);
  await expect(page.locator('[role="menu"]')).toContainText('锁定');
});

test('先选画线工具再点回放：第一次点击被「选择K线」消费（不落成画线）', async ({ page }) => {
  await boot(page);
  await page.keyboard.press('Alt+h');
  await page.getByRole('button', { name: /回放：点击后/ }).click();
  await canvasOf(page).click({ position: { x: 500, y: 300 } });

  const afterFirst = await read(page);
  expect(afterFirst.replayIndex).not.toBeNull(); // 游标设上了
  expect(afterFirst.drawings).toHaveLength(0); // 但这一笔没画出去：选线模式分支优先于工具分支

  await canvasOf(page).click({ position: { x: 300, y: 300 } });
  await parkMouse(page);
  expect((await read(page)).drawings).toHaveLength(1); // 工具仍激活，下一次点击才落成
});

test('游标之右越过序列末的点击：锚点钳到最后一根 bar 的时间（不拒绝、不落空）', async ({ page }) => {
  await boot(page);
  await enterReplay(page, 400, 300);
  const last = (await read(page)).lastBarTime;

  await hline(page, 780, 300); // 图表区内、序列末之右
  const s = await read(page);
  expect(s.drawings).toHaveLength(1);
  expect(s.drawings[0].time).toBe(last);
});

test('未来空白区真的被绘制：游标之右落笔的线在该列画出笔画色（移除后归零为对照）', async ({ page }) => {
  await boot(page);
  await enterReplay(page, 500, 300);
  const cursorIndex = (await read(page)).replayIndex!;
  const cursorTime = await cursorBarTime(page);

  await hline(page, 650, 320);
  const s = await read(page);
  expect(s.drawings).toHaveLength(1);
  expect(s.drawings[0].time).toBeGreaterThan(cursorTime);
  const color = s.drawings[0].color;

  // 渲染证明由水平线承担：它整列实色，像素判定可靠。趋势线逐列被抗锯齿混成中间色，
  // 「同色行数」会归零（第一轮就因此误判过），故下面只钉它的落点数据。
  const hits = await columnHits(page, color, 700); // x=700：游标（x=500）之右的未来区
  expect(hits, `未来空白区应渲染出这条 ${color} 的线`).toBeGreaterThan(0);

  await removeDrawing(page, s.drawings[0].id);
  await page.waitForTimeout(120);
  expect(await columnHits(page, color, 700), '对照：移除后该列不该留有线色').toBe(0);

  await trendline(page, [640, 250], [760, 360]); // 两端都在游标之右
  const t = (await read(page)).drawings.slice(-1)[0];
  expect(t.type).toBe('trendline');
  expect(t.points).toBe(2);
  expect(t.time).toBeGreaterThan(cursorTime);
  const table = await revealForward(page, cursorIndex + 1, cursorIndex + 80);
  expect(covers(table, t.time), '揭示表格须覆盖到趋势线首锚').toBe(true);
  expect(rowAtOrBefore(table, t.time), '首锚点应是未揭示的未来 bar').not.toBeNull();
});
