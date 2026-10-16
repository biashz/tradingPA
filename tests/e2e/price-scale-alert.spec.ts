import { test, expect, type Page } from '@playwright/test';

/**
 * 四期-C2：价格轴「+」跟随光标建警报入口的行为取证。
 *
 * 三条承重事实各自成测，且每条都配「被测物不存在时采样位是干净的」对照读数
 * （四期-E1d 教训：不先证明采样位无同色常驻物，像素断言只是碰巧没红）：
 * ① 只在光标悬停于价格轴时绘制 ⇒ 默认视图/离开后该区域零 accent 像素；
 * ② 只在主价格面板内绘制 ⇒ 副图（VOL）刻度区不出现——警报源只有 `price`，
 *    副图那格读到的是指标值，按价格建会写错源（口径登记在 SPEC-TV-ALIGNMENT）；
 * ③ 绘制、命中、光标共用 priceScalePlusRect ⇒ 在框上按下出对话框，
 *    预填价格随光标 y 单调下降（取框心而非光标 y）。
 * 「自动」按钮与「+」同条居中、由构造互斥，故另有一测先把面板切到手动。
 */

const ACCENT = '#2962ff'; // theme.accent（src/engine/theme.ts:68,99）
const AXIS_W = 64;
const PLUS_X0 = 23; // 框左缘 = chartW + (64 − 18)/2
const PLUS_X1 = 41; // 框右缘（含）

async function boot(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByText(/[1-9][0-9,]* 根/)).toBeVisible({ timeout: 20_000 });
}

/** 夹带区域内与 color 同色的像素数（CSS 逻辑坐标；只用公开 `screenshot()`，不碰内部 canvas） */
function accentPixels(page: Page, region: { x0: number; x1: number; y0: number; y1: number }): Promise<number> {
  return page.evaluate(
    (a) => {
      const c = (window as unknown as { __chartRenderer?: { screenshot(): string } }).__chartRenderer;
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
          const el = document.querySelector('canvas') as HTMLCanvasElement;
          const sx = img.width / el.clientWidth; // DPR 折算：截图是设备像素，入参是 CSS 像素
          const sy = img.height / el.clientHeight;
          const target = [1, 3, 5].map((i) => parseInt(a.color.slice(i, i + 2), 16));
          let n = 0;
          for (let py = Math.round(a.y0 * sy); py <= Math.round(a.y1 * sy); py++) {
            for (let px = Math.round(a.x0 * sx); px <= Math.round(a.x1 * sx); px++) {
              const d = ctx.getImageData(px, py, 1, 1).data;
              if ([0, 1, 2].every((k) => Math.abs(d[k] - target[k]) <= 8)) n++;
            }
          }
          resolve(n);
        };
        img.onerror = () => reject(new Error('截图解码失败'));
      });
    },
    { ...region, color: ACCENT },
  );
}

/** 画布几何 + 悬停夹带（框心上下 11px：框高 18，留 2px 抗锯齿余量） */
async function geom(page: Page): Promise<{
  box: { x: number; y: number };
  chartW: number;
  chartH: number;
  mainBottom: number;
  bandAt: (y: number) => { x0: number; x1: number; y0: number; y1: number };
  plusCenterX: number;
}> {
  const box = (await page.locator('canvas').first().boundingBox())!;
  const chartW = box.width - AXIS_W;
  const chartH = box.height - 24;
  return {
    box: { x: box.x, y: box.y },
    chartW,
    chartH,
    mainBottom: (chartH * 3) / 4, // 默认布局主图:副图 = 3:1（settings.spec 同口径）
    bandAt: (y) => ({ x0: chartW + PLUS_X0, x1: chartW + PLUS_X1, y0: y - 11, y1: y + 11 }),
    plusCenterX: chartW + (PLUS_X0 + PLUS_X1) / 2,
  };
}

test('价格轴「+」只在悬停主图轴条时出现，离开即消失（默认零像素）', async ({ page }) => {
  await boot(page);
  const g = await geom(page);
  const y = g.chartH * 0.35;

  // 对照：光标停在画布外（不在轴上）时同一夹带必须干净，否则下面的正读数没有意义
  await page.mouse.move(4, 4);
  await expect.poll(() => accentPixels(page, g.bandAt(y))).toBe(0);

  // 悬停轴条 → 框出现（18×18 填充减去白色十字描边，实测远大于阈值下限）
  await page.mouse.move(g.box.x + g.plusCenterX, g.box.y + y);
  await expect.poll(() => accentPixels(page, g.bandAt(y))).toBeGreaterThan(150);

  // 移开（回到图表区）→ 框消失
  await page.mouse.move(g.box.x + g.chartW / 2, g.box.y + y);
  await expect.poll(() => accentPixels(page, g.bandAt(y))).toBe(0);
});

test('副图刻度区不出现「+」（警报源只有 price，副图值是指标值）', async ({ page }) => {
  await boot(page);
  const g = await geom(page);
  const y = g.chartH * 0.87; // VOL 副图内

  // 扫整条主图轴（不只是光标那一行）：钳位会把框压到主图底部，只读光标行会漏判
  await page.mouse.move(g.box.x + g.plusCenterX, g.box.y + y);
  await expect
    .poll(() => accentPixels(page, { x0: g.chartW + PLUS_X0, x1: g.chartW + PLUS_X1, y0: 0, y1: g.mainBottom }))
    .toBe(0);

  // 同一次悬停换到主图 → 出现：证明上一条零读数来自「副图」分支，不是采样位读错
  const yMain = g.mainBottom - 60;
  await page.mouse.move(g.box.x + g.plusCenterX, g.box.y + yMain);
  await expect.poll(() => accentPixels(page, g.bandAt(yMain))).toBeGreaterThan(150);
});

test('点击「+」打开警报对话框，预填价格随光标 y 下降；创建后落盘', async ({ page }) => {
  await boot(page);
  const g = await geom(page);
  const priceAt = async (y: number): Promise<number> => {
    await page.mouse.move(g.box.x + g.plusCenterX, g.box.y + y);
    await page.mouse.click(g.box.x + g.plusCenterX, g.box.y + y);
    const dialog = page.getByRole('dialog', { name: /添加警报/ });
    await expect(dialog).toBeVisible();
    const v = Number(await page.getByLabel('警报价格').inputValue());
    await page.getByRole('button', { name: '取消' }).click();
    await expect(dialog).toBeHidden();
    return v;
  };

  const high = await priceAt(g.chartH * 0.25);
  const low = await priceAt(g.chartH * 0.6);
  expect(high).toBeGreaterThan(0);
  expect(low).toBeGreaterThan(0);
  expect(low).toBeLessThan(high); // y 越大价格越低：预填取的是框心价格

  // 创建：走的是既有 add() 链（source: price），落盘到 tradingpa.alerts 的 version 2 存档
  const y = g.chartH * 0.4;
  await page.mouse.move(g.box.x + g.plusCenterX, g.box.y + y);
  await page.mouse.click(g.box.x + g.plusCenterX, g.box.y + y);
  const p = Number(await page.getByLabel('警报价格').inputValue());
  await page.getByRole('button', { name: '创建' }).click();
  await expect(page.getByText(/已创建 .* 警报/)).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((want) => {
        const raw = localStorage.getItem('tradingpa.alerts');
        const saved = raw
          ? (JSON.parse(raw) as { alerts?: Array<{ threshold: number; source: { type: string } }> })
          : {};
        const last = (saved.alerts ?? []).at(-1);
        return last && last.source.type === 'price' && last.threshold === want ? 'ok' : JSON.stringify(last ?? null);
      }, p),
    )
    .toBe('ok');
});

test('手动价格域后「+」给「自动」按钮让位（同条居中，由构造互斥）', async ({ page }) => {
  await boot(page);
  const g = await geom(page);

  // 先把主图切到手动：在轴条内、框之外按下并纵向拖动（右缘 50px 处，避开 23–41 的框）
  const dragX = g.box.x + g.chartW + 52;
  await page.mouse.move(dragX, g.box.y + g.chartH * 0.3);
  await page.mouse.down();
  await page.mouse.move(dragX, g.box.y + g.chartH * 0.3 + 40);
  await page.mouse.up();

  // 「自动」按钮行（by = 主图高 − 16 − 4，行心 = 主图底 − 12）：悬停此处 → 「+」不出现
  const btnRow = g.mainBottom - 12;
  await page.mouse.move(g.box.x + g.plusCenterX, g.box.y + btnRow);
  await expect.poll(() => accentPixels(page, g.bandAt(btnRow))).toBe(0);

  // 往上 60px → 出现：证明上一条零读数不是「手动态整个入口失效」
  const above = btnRow - 60;
  await page.mouse.move(g.box.x + g.plusCenterX, g.box.y + above);
  await expect.poll(() => accentPixels(page, g.bandAt(above))).toBeGreaterThan(150);
});

/**
 * 四期-C4c：对话框里的「条件」原本是原生 `<select>`，现收敛到 `ToolbarSelect`。
 * 这条钉的是收敛后的**整链**——菜单能开（浏览器真实指针事件，jsdom 打不开 Radix 菜单，
 * 理由见 `tests/unit/toolbar-select.test.tsx` 头注）、点项回调的是该项 value、
 * 且该 value 一路写进落盘存档；「不动条件」的那次创建是同一条链的对照读数。
 */
test('警报对话框的「条件」菜单：默认上穿为对照，选「价格下穿」后落盘 condition 跟着变', async ({ page }) => {
  await boot(page);
  const g = await geom(page);
  const y = g.chartH * 0.4;
  const openDialog = async (): Promise<void> => {
    await page.mouse.move(g.box.x + g.plusCenterX, g.box.y + y);
    await page.mouse.click(g.box.x + g.plusCenterX, g.box.y + y);
    await expect(page.getByRole('dialog', { name: /添加警报/ })).toBeVisible();
  };
  /** 关掉对话框必须等到真正卸载：Radix 的遮罩还在时，下一次画布点击落在遮罩上而不是「+」，
   *  表现为对话框根本不出现（本轮实测：不加这一步，第二次 openDialog 5s 等不到元素） */
  const closeDialog = async (): Promise<void> => {
    await expect(page.getByRole('dialog', { name: /添加警报/ })).toBeHidden();
  };
  const lastAlert = () =>
    page.evaluate(() => {
      const raw = localStorage.getItem('tradingpa.alerts');
      const saved = raw ? (JSON.parse(raw) as { alerts?: Array<{ condition: string; source: { type: string } }> }) : {};
      const last = (saved.alerts ?? []).at(-1);
      return last ? `${last.source.type}:${last.condition}` : 'none';
    });

  await openDialog();
  // 同一个可读名下 role 从 combobox 变 button ⇒ 原生件确实不在了（不是新加了一个重复入口）
  await expect(page.getByRole('combobox', { name: '警报条件' })).toHaveCount(0);
  const cond = page.getByRole('button', { name: '警报条件' });
  await expect(cond).toHaveText('价格上穿'); // 当前项文案上触发器
  await page.getByRole('button', { name: '创建' }).click();
  await closeDialog();
  await expect.poll(lastAlert).toBe('price:crossUp');

  await openDialog();
  await page.getByRole('button', { name: '警报条件' }).click();
  await page.getByRole('menuitem', { name: '价格下穿' }).click();
  await expect(cond).toHaveText('价格下穿');
  await page.getByRole('button', { name: '创建' }).click();
  await closeDialog();
  await expect.poll(lastAlert).toBe('price:crossDown');
});
