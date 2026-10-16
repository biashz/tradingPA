import { test, expect, type Page } from '@playwright/test';

/**
 * 研究图例行悬停按钮（TV 图例路径）：图例由画布绘制，按钮位置随图例文本宽度变化。
 * 从左向右扫过主图首个研究行（y=28、行高 16，取行中 y=36），光标在按钮区变 pointer；
 * 每个扫描位连移两拍——引擎悬停光标滞后 pointermove 一拍（updateHoverCursor 先于
 * hover.update 执行），第二拍消化该滞后；命中按钮区后按 16px 按钮宽推算目标按钮
 * 中心（0=眼睛/隐藏 1=齿轮/设置 2=移除）。
 */
async function clickStudyLegendButton(page: Page, box: { x: number; y: number }, btn: number): Promise<void> {
  const rowY = 36;
  let btnLeft = -1;
  for (let x = 8; x <= 800; x += 8) {
    await page.mouse.move(box.x + x, box.y + rowY);
    await page.mouse.move(box.x + x, box.y + rowY);
    const cursor = await page.evaluate(() => (document.querySelector('canvas') as HTMLCanvasElement).style.cursor);
    if (cursor === 'pointer') {
      btnLeft = x;
      break;
    }
  }
  expect(btnLeft, '应扫到研究图例悬停按钮区').toBeGreaterThan(0);
  await page.mouse.click(box.x + btnLeft + btn * 16 + 8, box.y + rowY);
}

/** Pine 编辑器：编译自定义指标并添加到图表；坏脚本在控制台报错 */
test('Pine 编辑器编译自定义指标', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/[1-9][0-9,]* 根/)).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Pine 编辑器' }).click();
  await expect(page.getByLabel('Pine 脚本源码')).toBeVisible();

  // 子集边界文案（三期-D3①）：徽标悬浮说明必须列出实测边界，避免用户按完整 Pine 写脚本
  const badge = page.getByLabel('Pine v5 子集边界说明');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText('Pine v5 子集');
  const tooltip = await badge.getAttribute('title');
  expect(tooltip).toContain('x[n]');
  expect(tooltip).toContain('需为常量');
  expect(tooltip).toContain('request.security');

  await page.getByRole('button', { name: /添加到图表/ }).click();

  // 指标已挂主图（图例为画布绘制，不在 DOM 中）：经引擎 listIndicators 验证
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __chartRenderer?: { listIndicators(): Array<{ name: string }> } }).__chartRenderer
            ?.listIndicators()
            .some((i) => i.name === '双均线交叉') ?? false,
      ),
    )
    .toBe(true);

  // 设置入口（TV 图例路径）：悬停主图研究行行尾悬停按钮，点齿轮打开指标设置
  const box = (await page.locator('canvas').first().boundingBox())!;
  await clickStudyLegendButton(page, box, 1);

  // 设置对话框的输入页由 input.* 自动生成
  await page.getByRole('button', { name: '输入', exact: true }).click();
  await expect(page.getByText('快线周期')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // 坏脚本：编译期报错进控制台，不污染图表
  await page.getByLabel('Pine 脚本源码').fill('indicator("坏", overlay=false)\nplot(ta.foo(close, 3), "X")');
  await page.getByRole('button', { name: /运行/ }).click();
  await expect(page.getByText(/不支持的函数/)).toBeVisible();
});

/**
 * 四期-C4c：Pine 编辑器顶栏那两只「动作提示」型下拉（`已保存（N）…` 载入 / `删除…`）原本是
 * `value=""` + 空值占位 `<option>` 的原生 select，收敛到 `ToolbarSelect` 后靠 `label` prop 承载
 * 触发器文案、`value` 恒为空串（选项里没有 ''，所以勾选永不落项）。这条钉四点：
 * ① 未保存时两只都不渲染（条件渲染语义未变）；② 触发器文案来自 label 而非当前项；
 * ③ 菜单项点击确实回灌 store（先把编辑器改脏，再从菜单点回来）；
 * ④ 删除链同一条，且落盘存档同步清空。
 * role 从 combobox 变 button 是原生件不存在的读数。
 */
test('Pine 编辑器的两只动作菜单：载入与删除', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/[1-9][0-9,]* 根/)).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Pine 编辑器' }).click();
  const editor = page.getByLabel('Pine 脚本源码');
  await expect(editor).toBeVisible();

  const savedNames = () =>
    page.evaluate(() => {
      const raw = localStorage.getItem('tradingpa.pine.scripts');
      const list = raw ? (JSON.parse(raw) as Array<{ name: string }>) : [];
      return list.map((s) => s.name).join(',');
    });
  const loadBtn = page.getByRole('button', { name: '已保存脚本' });
  const delBtn = page.getByRole('button', { name: '删除脚本' });

  // ① 默认无已保存脚本 ⇒ 两只菜单都不渲染（且没有任何 combobox 残留）
  await expect.poll(savedNames).toBe('');
  await expect(loadBtn).toHaveCount(0);
  await expect(delBtn).toHaveCount(0);

  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect.poll(savedNames).toBe('双均线交叉');

  // ② 触发器文案来自 label（value 恒 ''，选项里没有 ''）
  await expect(loadBtn).toHaveText('已保存（1）…');
  await expect(delBtn).toHaveText('删除…');
  await expect(page.getByRole('combobox', { name: '已保存脚本' })).toHaveCount(0);

  // ③ 载入：先把编辑器改脏，再从菜单点回来 ⇒ 菜单项确实回灌 store，不只是列了个名字
  await editor.fill('indicator("临时", overlay=true)\nplot(close, "T")');
  await loadBtn.click();
  await page.getByRole('menuitem', { name: '双均线交叉' }).click();
  await expect(editor).toHaveValue(/双均线交叉/);
  await expect(loadBtn).toHaveText('已保存（1）…'); // 动作提示型：用完不变成「已选项」

  // ④ 删除走另一只同列表的菜单，落盘同步清空 ⇒ 两只菜单一起消失
  await delBtn.click();
  await page.getByRole('menuitem', { name: '双均线交叉' }).click();
  await expect.poll(savedNames).toBe('');
  await expect(loadBtn).toHaveCount(0);
  await expect(delBtn).toHaveCount(0);
});
