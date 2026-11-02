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

/**
 * 画布某列上与 color 同色的像素**行号**（只用公开 `screenshot()`，不碰内部 canvas）。
 * `band` 是 CSS 逻辑像素的 y 夹带：默认画线色与主题跌色同为 `#ef5350`
 * （`src/engine/palette.ts:31`、`theme.ts:57`），而**最新价虚线横贯整个主图**
 * （`src/engine/renderer/drawAxes.ts:184-195`，按涨跌取 `theme.up/down` + `[2,2]` 虚线），
 * 不夹带就会把那条常驻虚线当成「线残留」——它命中哪一列取决于虚线相位与价签行 y，
 * 故不夹带的对照断言必然间歇红（2026-10-16 四期-E1d 探针实测：画线前该列已有 1 行同色）。
 */
function columnRows(page: Page, color: string, x: number, band?: [number, number]): Promise<number[]> {
  return page.evaluate(
    (a) => {
      const c = (window as unknown as { __chartRenderer?: EngLike }).__chartRenderer;
      if (!c) throw new Error('无 DEV 引擎句柄 window.__chartRenderer');
      const img = new Image();
      img.src = c.screenshot();
      return new Promise<number[]>((resolve, reject) => {
        img.onload = () => {
          const cv = document.createElement('canvas');
          cv.width = img.width;
          cv.height = img.height;
          const ctx = cv.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const target = [1, 3, 5].map((i) => parseInt(a.color.slice(i, i + 2), 16));
          const el = document.querySelector('canvas') as HTMLCanvasElement;
          const px = Math.round(a.x * (img.width / el.clientWidth));
          const py0 = a.band ? Math.round(a.band[0] * (img.height / el.clientHeight)) : 0;
          const py1 = a.band ? Math.round(a.band[1] * (img.height / el.clientHeight)) : cv.height - 1;
          const rows: number[] = [];
          for (let py = py0; py <= py1; py++) {
            const d = ctx.getImageData(px, py, 1, 1).data;
            if ([0, 1, 2].every((k) => Math.abs(d[k] - target[k]) <= 8)) rows.push(py);
          }
          resolve(rows);
        };
        img.onerror = () => reject(new Error('截图解码失败'));
      });
    },
    { color, x, band },
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

/** 未来 bar 的 time 单调；取 time ≤ 锚点的最后一根。序列末之右的 index 会被 dataWindow 钳成
 *  「重复的最后一根」（探针读数：游标 768、距末根 ≈105 根、揭示 cursor+400 仍得 400 行），
 *  所以越过末根的锚点拿到的就是那最后一根——这正是钳位现状要的形状 */
const rowAtOrBefore = (table: RevealRow[], time: number) =>
  table.filter((r) => r.bar.time <= time).slice(-1)[0] ?? null;
const inOhlc = (price: number, bar: EngBar) => [bar.open, bar.high, bar.low, bar.close].includes(price);

/**
 * 序列相邻步长，口径与 `src/engine/drawing/coords.ts:54` 逐字相同（序列头部两根相减）。
 * 不用「游标右侧相邻两根」：1 分序列每交易日断两次、周末再断一次，2026-10-19 探针实测同一批
 * 801 根里 index 77/318/559 的间隔是 91 分、197/438 是 1110 分、679 是 3990 分——跨缺口那两根
 * 相减会把步长放大几十倍，下面 `assertInFutureBand` 的上界与 `assertSubBarPrecision` 的 frac
 * 量法会同时失去意义。
 */
async function seriesIv(page: Page): Promise<number> {
  await parkMouse(page); // 悬停未清空时快照读的是 min(悬停 index, 回放游标)（dataWindow.ts:85-87），走表会停在悬停那根
  return page.evaluate(() => {
    const c = (window as unknown as { __chartRenderer?: EngLike }).__chartRenderer;
    if (!c) throw new Error('无 DEV 引擎句柄 window.__chartRenderer');
    const keep = c.replayIndex;
    const at = (i: number): number => {
      c.setReplayIndex(i);
      return c.dataWindowSnapshot.bar?.time ?? 0;
    };
    const iv = at(1) - at(0);
    c.setReplayIndex(keep);
    return iv;
  });
}

/**
 * 从 `from` 起逐根揭示**到序列末为止**（含末根）。停止条件 = 读回的 bar.time 与上一行相同，
 * 即 index 越界被 dataWindow 钳成「重复的最后一根」（钳位现状见 `rowAtOrBefore` 的注释）。
 *
 * 这里替掉的是旧 `futureSpan(cursorTime, lastBarTime, iv)`：它拿墙钟分钟差除以步长当**根数**，
 * 而带缺口的序列两者不等。2026-10-19 全量 E2E 三条翻红的读数就是这条换算——游标落在周末缺口
 * 左侧时，墙钟差算出 4023 根、而缺口右侧真实只剩 32 根（游标 768、全长 801），2000 的上界被冲穿；
 * 上界没错，**错在单位**。
 * 「窗口有界」改由末行是否走到末根来钉（下面那条 expect）。
 *
 * 走到末根这件事还揭掉第二层遮蔽：`dataWindow.ts:85-87` 读的是 `min(悬停 index, 回放游标)`，
 * 鼠标还停在画布上时走表在悬停那一根就断掉。旧 `revealForward` 不判重复、静默把短表交出去，
 * 所以三条用例一直拿着「以为到末根、实际到悬停根」的表格——本次先加末行判据，当场翻红三条，
 * 读数 `Expected 1792382280000 / Received 1792379760000`（差 42 根）。三个走表 helper 因此统一先 `parkMouse`。
 *
 * 两条变异读数（先证落地再解读，2026-10-19 各跑整文件）：
 * - **MUT-2 循环上限 5000 改 50** ⇒ 1 红 6 绿，红的正是尾表 122 根的新用例；旧三条此刻的尾
 *   只有 ≈32 根，50 够不着。⇒ 末行判据的强度取决于游标之右真实剩多少根，别当成四条都钉住。
 * - **MUT-3 只删本函数的 parkMouse** ⇒ 7 绿。调用序里 `seriesIv` 先清空了悬停，这条 park 是
 *   防「日后有人在落笔之后直接走表」的前置条件，删掉不翻红；两处一起删才回到上面的三条红。
 */
async function revealToSeriesEnd(page: Page, from: number): Promise<RevealRow[]> {
  await parkMouse(page); // 同 seriesIv：悬停未清空时快照读 min(悬停 index, 游标)，走表会停在悬停那根
  const out = await page.evaluate((f) => {
    const c = (window as unknown as { __chartRenderer?: EngLike }).__chartRenderer;
    if (!c) throw new Error('无 DEV 引擎句柄 window.__chartRenderer');
    const rows: RevealRow[] = [];
    for (let i = f; i < f + 5000; i++) {
      c.setReplayIndex(i);
      const bar = c.dataWindowSnapshot.bar;
      if (!bar) break;
      if (rows.length > 0 && rows[rows.length - 1].bar.time === bar.time) break;
      rows.push({ index: i, bar });
    }
    // 与循环同一个 JS 回合内读末根时间：中途不会有新 bar 插进来把对照打歪
    return { rows, lastBarTime: c.lastBarTime };
  }, from);
  const last = out.rows[out.rows.length - 1];
  expect(
    last ? last.bar.time : -1,
    `游标之右的揭示窗口须在循环上限内走到序列末（起 index=${from}、读到 ${out.rows.length} 行、末根 time=${out.lastBarTime}）`,
  ).toBe(out.lastBarTime);
  return out.rows;
}

/** 序列全长（index 0 → 末根）的 time 表；根数由此成为 `revealToSeriesEnd` 的另一条独立读路 */
async function seriesTimes(page: Page): Promise<number[]> {
  await parkMouse(page); // 同 revealToSeriesEnd：先清空悬停，否则走表停在悬停那一根
  return page.evaluate(() => {
    const c = (window as unknown as { __chartRenderer?: EngLike }).__chartRenderer;
    if (!c) throw new Error('无 DEV 引擎句柄 window.__chartRenderer');
    const keep = c.replayIndex;
    const times: number[] = [];
    for (let i = 0; i < 5000; i++) {
      c.setReplayIndex(i);
      const t = c.dataWindowSnapshot.bar?.time;
      if (t === undefined || (times.length > 0 && times[times.length - 1] === t)) break;
      times.push(t);
    }
    c.setReplayIndex(keep);
    return times;
  });
}

/**
 * 锚点落在「游标之右、序列末 + 1 根」这条带内。
 * 替掉的是旧判据 `covers(table, time)`——它假设表格盖得到锚点，而 `coords.ts:43-51` 在
 * `roundIdx` 恰为末根时给的是「末根 time + 小数×iv」，锚点**合法地**越过末根，于是 `covers`
 * 红得与画线行为无关（2026-10-16 `--repeat-each=3/4` 各抓到一次，读数同点）。
 * 「末行冒充命中」这个旧 `covers` 想防的洞改由两处一起堵：表格由 `revealToSeriesEnd` 走到末根，
 * 加上这里带上界。
 */
function assertInFutureBand(
  time: number,
  p: { cursorTime: number; lastBarTime: number; iv: number },
  label: string,
): void {
  expect(time, `${label}：应在游标之右（cursorTime=${p.cursorTime}）`).toBeGreaterThan(p.cursorTime);
  expect(
    time,
    `${label}：不该越过序列末一根 bar 以上（lastBarTime=${p.lastBarTime}、iv=${p.iv}、上界=${p.lastBarTime + p.iv}）`,
  ).toBeLessThanOrEqual(p.lastBarTime + p.iv);
}

/** 落一次笔、回读这根、随即删掉它（数量须回到落笔前）——采样不留对象，故同 y 可反复使用 */
async function sampleFree(page: Page, x: number, y: number): Promise<FlatDrawing> {
  const before = await read(page);
  await hline(page, x, y);
  const list = (await read(page)).drawings;
  expect(
    list.length,
    `自由落点未新增画线（${before.drawings.length} → ${list.length}，x=${x} y=${y}）——多半是命中了已有对象`,
  ).toBe(before.drawings.length + 1);
  const d = list[list.length - 1];
  await removeDrawing(page, d.id);
  expect((await read(page)).drawings.length, `采样线 ${d.id} 未删除干净`).toBe(before.drawings.length);
  return d;
}

/**
 * 磁吸关的「小数位置精度」（`coords.ts` 的 `magnet === 'off'` 分支：time = 该根 time + 小数偏移 × iv）。
 *
 * 量法是**先复位游标、再扫一批 x 采样**，不是先标定 bar 像素宽。像素标定没有公开读口：
 * `dataWindowSnapshot.index` 只在鼠标正悬停时才是像素读数，`parkMouse` 后即回落到回放游标，
 * 而空点图表也不移动游标（那要先把回放工具装上）——旧版拿相隔 100px 的两次空点反推 barW，
 * 两次都读回同一个游标根（767），标定当场失败。
 *
 * 采样改用只依赖序列步长 `iv`（调用方经 `seriesIv` 按引擎口径取）的量：frac = ((time − t0)/iv)
 * 的小数部分。小数精度为真 ⇒ 必有采样落在两根 bar 之间（frac ≠ 0）；量成 bar 网格 ⇒ 每个 frac
 * 恒为 0。全程不碰像素几何，所以可视区宽窄、此刻加载了多少根都翻不了它的脸。
 * 收盘缺口也不翻它的脸：缺口长度（91/1110/3990 分）都是 iv 的整数倍，跨缺口的整根 bar 仍算得 frac 0。
 *
 * 三处会被现状翻脸的地方，都在这儿处理：
 * 1) **复位**：建表时游标已被推到序列末、可视区跟着滚，复位前 x=620 早已越过序列末，
 *    每个落点都钳到最后一根（实测 10 次得到同一个 1792134000000，2026-10-16 全量 E2E 首现翻红即此）；
 * 2) **钳位样本另计**：钳位的 frac 也归 0，与「量成网格」同形，故用公开 `lastBarTime` 挑出来，
 *    只在序列内样本里找 frac；整批皆钳位则带全部读数失败。「越过序列末钳到最后一根」本身
 *    另有用例钉现状（下方「游标之右越过序列末的点击」），本函数不替它表态；
 * 3) **未来区按时钟判**：复位后可视区怎么滚是不可知的，x=540 可能落在游标之左，
 *    故 `future` 用复位后重读的 `cursorBarTime` 判，不看像素。
 * 每条采样画完即删（`sampleFree`）：水平线横贯整个宽度，同 y 的第二次落笔会命中上一根线。
 */
async function assertSubBarPrecision(page: Page, table: RevealRow[], restoreTo: number, y: number, iv: number) {
  const t0 = table[0].bar.time;
  await setCursor(page, restoreTo);
  await parkMouse(page); // 复位游标 + 清空悬停：这样 cursorBarTime 读到的才是游标根，而不是上一动作留下的悬停根
  const cursorTime = await cursorBarTime(page);
  const lastBarTime = (await read(page)).lastBarTime;

  const samples: Array<{ x: number; drawing: FlatDrawing; frac: number; clamped: boolean; future: boolean }> = [];
  for (let i = 0; i < 8; i++) {
    const x = 540 + i * 36;
    const d = await sampleFree(page, x, y);
    const rel = (d.time - t0) / iv;
    samples.push({
      x,
      drawing: d,
      frac: rel - Math.floor(rel),
      clamped: d.time >= lastBarTime,
      future: d.time > cursorTime,
    });
  }

  const readings = JSON.stringify(
    samples.map((s) => ({
      x: s.x,
      time: s.drawing.time,
      frac: +s.frac.toFixed(4),
      clamped: s.clamped,
      future: s.future,
    })),
  );
  expect(
    samples.some((s) => !s.clamped),
    `8 个采样点全被钳到序列末（lastBarTime=${lastBarTime}，游标根=${cursorTime}）：${readings}`,
  ).toBe(true);
  const offGrid = samples.filter((s) => !s.clamped && s.frac > 1e-6 && s.frac < 1 - 1e-6);
  expect(
    offGrid.length,
    `序列内采样点应至少有两个落在两根 bar 之间（量成 bar 网格则 frac 恒为 0）：${readings}`,
  ).toBeGreaterThan(1);
  const futureOff = offGrid.filter((s) => s.future);
  expect(futureOff.length, `上述 off-grid 采样里须有落在游标之右的未来区：${readings}`).toBeGreaterThan(0);
  await parkMouse(page); // 采样把鼠标留在画布上，数据窗口会读悬停根而不是游标根（下游 cursorBarTime 依赖清空）
  await setCursor(page, restoreTo);
  return futureOff[futureOff.length - 1].drawing;
}

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

  // 揭示窗口按「游标之右还剩多少根」给：起点在游标右侧第一根，终点由序列末的钳位决定
  // （旧算法拿墙钟差换算根数，缺口会把窗口算穿——见 revealToSeriesEnd 的注释）
  const iv = await seriesIv(page);
  const table = await revealToSeriesEnd(page, cursorIndex + 1);
  assertInFutureBand(s.drawings[1].time, { cursorTime, lastBarTime: start.lastBarTime, iv }, '右锚点');
  const future = rowAtOrBefore(table, s.drawings[1].time);
  expect(future, '右锚点应落在游标之右的某根未来 bar 上').not.toBeNull();
  expect(future!.index).toBeGreaterThan(cursorIndex);
  // 磁吸关时落点带半根 bar 的小数精度（`coords.ts` 的 `magnet === 'off'` 分支）——
  // 这条必须钉住，否则日后改成对齐 bar 会无人察觉；量法见 assertSubBarPrecision
  await assertSubBarPrecision(page, table, cursorIndex, 360, iv);

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
  const start = await read(page);
  const cursorIndex = start.replayIndex!;
  const cursorTime = await cursorBarTime(page); // 此刻鼠标已 park，读到的就是游标根

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
  // 表格含游标当前根：磁吸关的对照落点可能就在「游标根 ↔ 下一根」之间，
  // 从 +1 起建表会让 rowAtOrBefore 读空（2026-10-16 翻红即此，与精度无关）
  const iv = await seriesIv(page);
  const band = { cursorTime, lastBarTime: start.lastBarTime, iv };
  const table = await revealToSeriesEnd(page, cursorIndex);
  assertInFutureBand(magnetLine.time, band, '磁吸锚点');
  const magnetBar = rowAtOrBefore(table, magnetLine.time);
  expect(magnetBar, '磁吸落点应锚在未来 bar 上').not.toBeNull();
  expect(magnetBar!.index, '吸附的那根须在游标之右（表格含游标当前根，故这条要显式钉住）').toBeGreaterThan(cursorIndex);
  expect(magnetBar!.bar.time, '磁吸开时锚点时刻正落在该 bar 上').toBe(magnetLine.time);
  expect(
    inOhlc(magnetLine.price, magnetBar!.bar),
    `吸附价 ${magnetLine.price} 应等于该未来 bar 的 OHLC 之一（用户此刻看不到这些数字）`,
  ).toBe(true);

  // 对照：磁吸关。两条判据合起来证明上一条的相等来自磁吸而非巧合——
  // 时间侧用「相差半根 bar 的两点」量小数精度（旧的「锚点 ≠ 任何 bar.time」会被序列末端钳位翻脸），
  // 价格侧仍要求自由落点命不中任何 OHLC
  await page.getByRole('button', { name: '磁吸', exact: true }).click();
  expect(await page.getByRole('button', { name: '磁吸', exact: true }).getAttribute('aria-pressed')).toBe('false');

  const plainLine = await assertSubBarPrecision(page, table, cursorIndex, 400, iv);
  expect(plainLine.id).not.toBe(magnetLine.id);
  assertInFutureBand(plainLine.time, band, '磁吸关的对照落点');
  const plainBar = rowAtOrBefore(table, plainLine.time);
  expect(plainBar, '对照落点也该在未来区').not.toBeNull();
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
  const start = await read(page);
  const cursorIndex = start.replayIndex!;
  const cursorTime = await cursorBarTime(page);

  await hline(page, 650, 320);
  const s = await read(page);
  expect(s.drawings).toHaveLength(1);
  expect(s.drawings[0].time).toBeGreaterThan(cursorTime);
  const color = s.drawings[0].color;

  // 渲染证明由水平线承担：它整列实色，像素判定可靠。趋势线逐列被抗锯齿混成中间色，
  // 「同色行数」会归零（第一轮就因此误判过），故下面只钉它的落点数据。
  // 采样必须夹带：默认画线色 `#ef5350` 与主题跌色同值，而最新价虚线横贯整幅主图
  // （`drawAxes.ts:184-195`），不夹带时那条常驻虚线会把「移除后归零」打成间歇红——
  // 探针实测画线之前列 700 就已有 1 行同色（y≈113~116，随行情漂移）。
  // 带取落笔 y=320 上下 2px：带内非空 = 线真画出来了，带内归零 = 线真被移除。
  const band: [number, number] = [318, 322];
  const hits = await columnRows(page, color, 700, band); // x=700：游标（x=500）之右的未来区
  expect(hits.length, `未来空白区应在落笔行渲染出这条 ${color} 的线（带 ${band}）`).toBeGreaterThan(0);

  await removeDrawing(page, s.drawings[0].id);
  // 对照断言用 poll：`removeDrawing` 只改模型，重绘走 invalidate → rAF，机器忙时那一帧可能还没跑。
  // 等的是同一条不变量——落笔行所在带内无线色，断言强度不降。
  await expect
    .poll(() => columnRows(page, color, 700, band).then((r) => r.length), {
      message: '对照：移除后落笔行所在带不该留有线色',
      timeout: 5_000,
    })
    .toBe(0);

  await trendline(page, [640, 250], [760, 360]); // 两端都在游标之右
  const t = (await read(page)).drawings.slice(-1)[0];
  const lastBarTime = (await read(page)).lastBarTime;
  expect(t.type).toBe('trendline');
  expect(t.points).toBe(2);
  // 首锚点须是「游标之右、序列末 +1 根」带内的某根真实未来 bar。
  // 旧判据 `covers(table, t.time)` 会红得与画线无关：表格按写死的根数建，而 x=640 落在第几根
  // 由此刻加载了多少根决定，落点还可能合法地越过末根一根（`coords.ts:43-51` 的小数项）——
  // 2026-10-16 `--repeat-each=3/4` 各抓到一次同点翻红。改法见 revealToSeriesEnd / assertInFutureBand。
  const iv = await seriesIv(page);
  assertInFutureBand(t.time, { cursorTime, lastBarTime, iv }, '趋势线首锚');
  const table = await revealToSeriesEnd(page, cursorIndex + 1);
  const first = rowAtOrBefore(table, t.time);
  expect(first, '首锚点应是未揭示的未来 bar').not.toBeNull();
  expect(first!.index).toBeGreaterThan(cursorIndex);
});

/**
 * 揭示窗口的单位是**根**，不是墙钟分钟。
 * 2026-10-19 全量 E2E 三条翻红的根因就在这儿：旧 `futureSpan` 用
 * `(lastBarTime − cursorTime)/iv` 当根数，而默认标的（腾讯财经 1 分序列）每个交易日断两次、
 * 周末再断一次。探针读数：同一批 801 根里 index 77/318/559 隔 91 分、197/438 隔 1110 分、
 * 679 隔 3990 分；把游标摆到缺口左侧一根，本用例实测到的是**尾部表 122 根 vs 墙钟估算 4147 根**。
 * 缺口右侧的根数永远小于墙钟换算，故这条用例把「按根数走到末根」钉住，缺口就是它的反例。
 *
 * 变异读数（先证落地再解读，2026-10-19）：
 * - MUT-1 把 `estimated` 直接写成 `rows.length` ⇒ 该条翻红，文本「墙钟估算=122、真实=122、缺口=3990」。
 * - MUT-6 只把比较方向翻过来 ⇒ 该条翻红，文本带出真实读数「墙钟估算=4147、真实=122」。
 * - MUT-7b `seriesIv` 改从跨缺口那两根相减 ⇒ 该条翻红（缺口退化成 0.278 个步长）⇒ 「步长取序列头部」
 *   这条口径在此有牙；对照 MUT-7（改取 index 799/798）读数 7 绿——那两根仍在同一交易段内，
 *   是个**值不变的中性变异**，既不能当证据也不能当反证。
 * - MUT-4/MUT-5 动 `expectedRows`：差 1 根 ⇒ 绿（±1 容差把它吞了，这是该对照的灵敏度上限）；
 *   差 5 根 ⇒ 红「尾部表读到 122 根，全长表算出 118 根」。
 * 覆盖边界：若供料降级为连续 mock 序列（无缺口），上面第一条 expect 当场翻红并带出状态条文本，
 * 不会静默变成一条空对照。
 */
test('揭示窗口按游标之右的真实根数给（收盘缺口会让墙钟换算多算一个数量级）', async ({ page }) => {
  await boot(page);
  await enterReplay(page, 500, 300);
  const start = await read(page);
  const iv = await seriesIv(page);
  const times = await seriesTimes(page);

  // 在「右侧还留着至少两根 bar」的间隔里取最宽的一处非步长间隔 = 收盘/周末缺口。
  // 不取最右那处：它通常是实时推送追加 bar 留下的小间隔（探针读数 21~32 分），右侧只剩一根，
  // 尾部表会退化成一行，取证强度不够。
  let gapIdx = -1;
  let gapSteps = 0;
  for (let i = 1; i < times.length; i++) {
    const dt = times[i] - times[i - 1];
    if (dt !== iv && times.length - i >= 2 && dt / iv > gapSteps) {
      gapSteps = dt / iv;
      gapIdx = i;
    }
  }
  const status = await page.locator('text=/根 ·/').first().textContent();
  expect(
    gapIdx,
    `序列里应有一处右侧留有 bar 的收盘缺口（供料若降级为连续 mock 序列，本用例的读数失去意义）。状态条：${status}`,
  ).toBeGreaterThan(0);

  // 把游标摆到缺口左侧一根——正是翻红那次的形状，与「此刻 x=500 落在第几根」无关
  const cursorIndex = gapIdx - 1;
  await setCursor(page, cursorIndex);
  await parkMouse(page);
  const rows = await revealToSeriesEnd(page, cursorIndex + 1);

  // 两条独立走表（全长表从 0 起、尾部表从 cursorIndex+1 起）的根数须对得上；
  // ±1 容差 = 两次 evaluate 之间可能追加一根实时 bar（墙钟换算的超出量是几千，不受这根影响）
  const expectedRows = times.length - cursorIndex - 1;
  expect(
    Math.abs(rows.length - expectedRows),
    `尾部表读到 ${rows.length} 根，全长表算出 ${expectedRows} 根（允许 ±1 根实时追加）`,
  ).toBeLessThanOrEqual(1);

  const estimated = Math.ceil((start.lastBarTime - times[cursorIndex]) / iv) + 2;
  expect(
    estimated - rows.length,
    `墙钟估算=${estimated}、真实=${rows.length}、缺口=${gapSteps} 个步长：估算的超出量至少该覆盖这段缺口`,
  ).toBeGreaterThanOrEqual(gapSteps - 2);
});
