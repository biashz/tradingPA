# 四期开发规划（PLAN-PHASE4）

> 状态：**已裁决取向，开工中（四期-E1 与 C 批的 C1a / C1b' / C2 已交付，C 批进行中）**。§4 决策点现列六个（D7–D12）：**D7（取向 = 先 A+E1，再走 C 长尾）与 D10（手续费/滑点 = 做真模型）已由用户于 2026-10-15 裁决**，落档见 `docs/decisions/OPEN-DECISIONS.md` 对应两行；**D8（多格入口形态）因 D7 未排 B 批而触发条件未成立、继续 OPEN**，**D9（内容长尾目标）仍待裁**——D9 裁决前不排四期-D，其余批次可按 §5 排期推进。**D11（回放态「画在未来」是否要限制）已由用户于 2026-10-16 裁为 (a) 不限制、口径入册**，两条已知语义写进 `docs/SPEC-TV-ALIGNMENT.md`，零代码零像素（见 §2-E 末与 §4）。**D12（价格轴「+」是否改 TV 常驻态）于 C2 交付后新增、仍 OPEN**——裁 (b) 需重产 27 面，不裁不阻塞 C3–C5。**C1b（轴宽单向自适应）裁法已定 = 单向只增不减，但本轮取证把它的真实成本与可达收益量化到失衡**（见 §1.3 行「价格轴·宽度」与 §2-C 的 C1b 核查）——**2026-10-16 同日已重裁并交付：取 (b) 入口 `decimals` 钳位（C1b'），轴宽维持 64、单向只增不减登记为不实施**。**用例侧同日再交付两条**：E1c（符号搜索两条用例改走固定桩，用户裁决「现在打桩」）与 E1d（回放画线像素对照改夹带采样，并**勘正 E1b 那条「固定 sleep」的根因判读**——真因是默认画线色与主题跌色同值 + 最新价虚线常驻该列，见 §2-E 末两条）。
> 取证日期：2026-10-15。前置：三期（含 2026-10-15 的 E/F 重排批次）已按 `docs/PLAN-PHASE3.md` §5「三期收口判据」全部满足，本期候选范围只能来自新的四处，逐项实读核实。
> **取证纪律（沿用三期）**：本轮**不沿用任何审计文档的行号**——每条「现状」论断由本轮重新执行 Read/Grep 得出，出处为 `路径:行号`。两份 AUDIT 表写于 2026-09-28，其间历经二期收尾、三期 A–F 与多次清偿批次，**多数 P1/P2 行已过期**（见 §1.1），这本身是本期第一个交付物。

## 0. 定位与取证来源

| 来源 | 内容 | 核实方式 |
|---|---|---|
| `docs/AUDIT-TV-UI-GAP.md` / `docs/AUDIT-TV-FEATURE-GAP.md` | 复刻差距表——但行级结论已大面积过期 | 逐行重读原差距描述 → 到代码里找该行为的当前实现处 |
| `docs/PLAN-PHASE3.md` 各批次「**登记（非遗漏）**」清单 | 交付时显式让路的边界（B0 ②、B2 ③、B3 ④⑤ 三处同一主题） | 逐条回读 + 到代码核实边界是否仍成立 |
| 源码内「待分化 / 属后续增强」注释 | 唯一的仓内 TODO 型自认（`theme.ts:72,103`） | Grep + 读消费点 |
| `docs/decisions/OPEN-DECISIONS.md` 仍 OPEN 的行 | aggTrades 精确 delta、oxlint 指令抑制半径机制 | 全文 59 行逐行核对状态列。**登记时（2026-10-15 取证）两行皆 OPEN；本期已就地关闭后者**（四期-A3，机制定位见 §2-A 交付记录与 README 台账机制段），余下 aggTrades 与本期新增的 D8/D9 三行仍 OPEN |

## 1. 本轮重新查阅的四个结论

### 1.1 结论一：两份审计表的 P1/P2 行大面积过期——**抽验 15 行（14 行 UI 表 + 1 行 FEATURE 表），主差距 15 行全部已交付，其中 11 行整行闭合、4 行只剩余项**

这不是坏消息，而是**排期基线失真**：如果照审计表排四期，会把这 11 件已完成的事重新排一遍。逐条核实结果（**A1 交付时把计数从首版「13 已交付 / 2 小尾巴」订正为上式**：首版漏了「图表右键·警报模型」一行，且把「阴影 1 处硬编码残留」与「快捷键 P2 半」两条余项折进了「已交付」而不单列）：

> **行号口径（四期-A1 交付后就地订正）**：本表原以 `AUDIT-TV-UI-GAP.md` 的**物理行号**（`:24`、`:25`…）标识审计行。A1 在表内追加复核标注后那些行号整体位移，照抄即成指错——现全部改为**行标签**（「UI 区域」列名，稳定标识）。原物理行号属 2026-09-28 版快照，只在标注历史里出现，不再作为引用。
> 另有一处**取证自身的勘正**：本轮 §1.1 首版把图表右键菜单记为「12 项，差 2 项属 TV 独有子菜单」，A1 逐项清点后实为 **12/14，仍缺 4 项**（见下表该行与审计文档的复核标注）；`ChartContextMenu.tsx` 的项位行号首版亦有一处偏移（`:133/:147/:164/…`），已按 A1 实读值（`:132/:146/:163/…`）订正。**这是本轮第二条「先写后核」被抓出的例子**（第一条是 §1.2 的行号随批次位移），印证规划纪律「任何条目未经行号核实不写入本文」。

| 审计行（UI 区域） | 原差距（`AUDIT-TV-UI-GAP`） | 现状（A1 复核实读出处） | 判定 |
|---|---|---|---|
| 十字光标·价格标签 `9999` 魔数 | 应改面板高度钳制 | `crosshairOverlay.ts:48` `maxY: paneY + paneHeight - 18`；`src/engine/renderer/*.ts` 内 `9999` **grep 零命中**。⚠️ 勘正：`drawCrosshair.ts` **仍在**，但已只剩再导出壳（`export { drawCrosshair } from './crosshairOverlay'` + `drawLegend` / `legendTypes`），本表原引的 `:91/:120-165/:209-247/:255-280` 等实现行号随实现迁走而失效 | **已交付** |
| 十字光标·多面板 **悬停副图时价格标签用主轴刻度（P1 功能错误）** | 需按命中面板传对应 priceScale | `RenderPipeline.ts:195` 求 `hoveredPane` + `:225/:228/:229` 传其 `priceScale` / `y` / `height` | **已交付** |
| 十字光标·时间标签右边界无钳制 | 溢出画布 | `crosshairOverlay.ts:57` `maxX` + `:86` `Math.min(bx, bounds.maxX - w)` | **已交付** |
| 图例·状态点/日涨跌 市场状态圆点 | 无开闭市圆点 | `drawLegend.ts:62-63`（圆点）+ `RenderPipeline.ts:241`（`isMarketOpen` 每帧算）+ `marketHours.ts:41-47`（浏览器本地时区口径，偏差已入 SPEC §9） | **已交付**（该行的「日涨跌」另一半仍缺，见 §1.3） |
| 价格轴·标签对齐 左对齐贴分隔线（**P1**） | TV 右对齐贴轴右缘 | `drawAxes.ts:89`、`:217` `textAlign = pos === 'left' ? 'left' : 'right'` | **已交付** |
| 图表右键菜单 仅 5 项（**P1**） | 缺 9 项 | `ChartContextMenu.tsx:111,118,125,132,146,163,176,188,199,209,220,230` 共 12 项 | **已交付**（相对 TV 14 项**仍缺 4 项**：粘贴 / Trade / Watchlist 子菜单+Create new list… / 按时间锁定垂直光标；后者全仓 grep 零命中，本轮未排期） |
| 图表右键·警报模型 右键警报无对话框（**P1**） | 直接建两条警报 | `ChartContextMenu.tsx:252` 起接 `ChartAlertDialog`（价格预填 + 条件选择） | **已交付** |
| 快捷键面板 无（**P1**） | 散落无出处 | `src/features/settings/ShortcutsDialog.tsx` | **已交付** |
| 快捷键覆盖 缺 Alt+A/R/L/P/W（**P1**） | 高频快捷键缺 | `useTvShortcuts.ts:123/126/132/135/138/150`（a / w / r / l / p / Enter），另有 n、s、d、g | **已交付**（`Ctrl+Alt+H`、`Alt+C`、`Alt+I`、数字键切周期、字母键切品种仍不在该 handler，属 P2 半） |
| 对话框动效 无 | Radix 默认无动画 | `src/styles/global.css:58` 进入 `tv-dialog-in 150ms ease-out` + `:60` `[data-state='closed']` 150ms 退出 | **已交付** |
| 加载状态 首次加载画布全空白（**P1**） | 无任何反馈 | `ChartWorkspace.tsx:232`（`idle/loading/reconnecting` 三态覆盖层）、文案 `:240` | **已交付** |
| Toast 反馈 无全局 Toast（**P2**） | `zIndex.toast` 预留但无组件 | `src/features/ui/Toast.tsx` + `toastModel.ts`，消费点 `ChartContextMenu.tsx:81,152,289` | **已交付** |
| 阴影 Token 仅一个（**P1**） | 需 flat/ring/raised | `tokens.ts:67-76` 按用途四档（tooltip/popover/menu/modal，非 TV 三名）；残留硬编码仅 **1 处** `ChartOrderMenu.tsx:148`（与 `shadow.menu` 逐字相同） | **已交付**（残留归 §2-C4 的微项） |
| 底部面板 缺预设条/齿轮/导航（**P1**） | 仅 UTC + 三个开关 | `StatusBar.tsx:34-42` `RANGES` 八档、`:26-30` control_bar 导航组、`:22` 底部齿轮、`:45` 起时区标 | **已交付**（「前往日期」在右键菜单 `ChartContextMenu.tsx:118` 与顶栏，原列为底栏缺口属位置误记） |
| Volume Profile（`AUDIT-TV-FEATURE-GAP` §1 行） Session VP 时间分段 | 无 | `volumeProfile.ts:18/:55/:223` `mode: 'range' \| 'session'` + `PaneRenderer.ts:122` 分发 | **已交付**（二期-G） |

⇒ 由此产生 **四期-A**（纯文档 + 一处脚本）：**把过期行就地标注**，让后续任何重排不再基于失真基线。这与三期-A 对 `SPEC-PHASE1-FEATURE-BREADTH` 的处置同一口径（**加标注、不改写历史**）。

### 1.2 结论二：真功能缺口高度集中在一个主题——**多图表布局是「演示态」**

三期把单图（`layout === 1`）这条路做透了；本轮核实：**多格布局下的每一处「深度」都停留在壳层**。六条独立证据，全部指向同一主题：

| # | 现状（本轮实读） | 后果 |
|---|---|---|
| 1 | `ChartCell.tsx:49-52` 单元格数据来自 `generateSeededMockBars(symbol, 5000, 60_000)` + `aggregateBars`，**不经 `useChartSeries`/`dataRegistry`** | 多图表看的是种子模拟行情，不是真实数据；切品种=切随机种子 |
| 2 | `TopBar.tsx:192`（Compare）、`:193-228`（周期 / 图表类型 / 回放整块）、`:242-251`（复原 / 重做）、`:276-280`（重新加载）全部包在 `layout === 1` 里 | 多格布局下周期、类型、回放、撤销重做、重载**五个入口从顶栏消失**；单元格标题栏只有三个原生 `<select>`（`ChartCell.tsx:109,121,133`） |
| 3 | `ChartSettingsDialog.tsx:80-89` 七项画布/时区/交易偏好的唯一下发路径写死 `p.renderer`（主图渲染器） | 多格布局下「图表设置」只改主图，其余格不变——且该边界被三期**自认了三次**（`PLAN-PHASE3.md:158` B2 ③、`:188` B3 ④） |
| 4 | `App.tsx:71` `useAlertWatcher(activeInstrument?.symbol, bars, lastPrice)` 单点采样 | 多格布局下**单元格品种的警报永不触发**（`useAlertWatcher.ts:146` 按 `a.symbol === symbol` 过滤） |
| 5 | `App.tsx:73` 单一 `renderer` state + `RightSide.tsx:97,99`（对象树 / 数据窗口只接这一个 renderer） | 右轨面板永远读主图，与用户正在看的那一格无关 |
| 6 | `App.tsx:218` `layout === 1 ?` 整块分支 | 上述 3/5 不是遗漏而是**结构选择**：主工作区（状态栏 / 回放 / 右轨）只在单图装配 |

三期登记表里同一条边界出现三次却三次都写「另立项」——本轮曾把它升级为**本期唯一的大批次**（四期-B），因为它是一次改造能顺带关闭三处登记的那种缺口。**2026-10-15 D7 裁决：B 批本轮不排**（取向取「先 A+E1，再走 C 长尾」）；上面六条证据与本节结论**原样保留**，作为未来重排 B 批时的现成取证（重排时只需裁 D8，取证不必重做）。

**E2E 风险实查（决定该批次真实成本）**：`tests/e2e/harness/visual-harness.ts:194-197` 的 `setLayout(2)` 走 harness 自有 `mountCell`，**不经 React `ChartCell`** ⇒ 黄金面 ⑨ `layout-2-grid` 对 B 批次结构性免疫（与 `aggregatePath` 那批的「harness 路径结构性豁免」同一形态，见 `docs/PLAN-TECH-DEBT-CLOSEOUT.md` §3.1）。真正的成本在另一处：**单元格一旦接真实数据链路，E2E 就必须继续离线确定化**（README:86 已把「外网依赖已切断、67 例 `--retries=0` 零失败」立为基线；该基线行随批次记录增长会漂移，2026-10-16 复核现落在 :86，且「外网依赖已切断」这条已在同日被本仓库自纠勘正为**只覆盖期货分类用例**——见 README「已知状态与待办」的符号搜索条），否则新增的多图面会立刻把基线打回 flaky。这条约束写进 B1 的验收，不许用 `test.skip` 绕。

### 1.3 结论三：其余缺口是分散的复刻精度长尾（每条都小，合计不小）

| 审计行（UI 区域） | 差距 | 现状出处 | 量级 |
|---|---|---|---|
| 图例·状态点/日涨跌 后半 | 图例涨跌是**单根** `close-open`（`src/engine/renderer/drawLegend.ts:84-96`），非日内周期的「最后一日变化值」；底栏有 `dayChangePct`（`src/features/market/StatusBar.tsx:12`、渲染分支 `:113-117`）而图例无 | 两处口径并存 | 0.5 |
| 价格轴·宽度 | 价格轴固定宽（`AXIS_WIDTH = 64`，`src/engine/renderer/chartPanes.ts:6`），长价/低价数字余量不均 | 三期-B5 只收敛了魔数，自适应未做 | 1〔**C1b 核查改判（2026-10-16，读数见 §2-C）**：原估 1 人日不成立。① 溢出阈值实测：文字右基线在轴条左缘起算 58px，黄金面 ⑩ 逐带墨宽读数 8 字符 = 46px ⇒ **5.75px/字符** ⇒ **≥10 字符抵到轴条左缘分隔线、≥11 字符越出轴条压到 K 线**；本仓可达配置里 2 位小数要价 ≥10⁷、6 位小数要价 ≥10⁴、percent 模式要 ≥1000%（越出需 ≥10000%）；② 真做自适应要把 `AXIS_WIDTH` 从常量变成每帧派生值，牵动 8 个消费点 + `chartAreaWidth`/`chartAreaOffsetX` 两个纯函数签名，而**轴宽 → 图表区宽 → 可见 bar 数 → 价格域 → 标签 → 轴宽**是一条闭环（zoom 中会抖）；③ 还需 harness 新增 `decimals` 开关才能产出宽标签黄金面（现无，`visual-harness.ts:78,86` 两处硬编码 2）。**唯一已证可达的溢出路径是自选落盘校验 `Number.isFinite(i.decimals)` 无上限**（`src/store/watchlistPersist.ts:39-41`，手工改 localStorage 写 decimals 20 ⇒ 24 字符）——那条用**入口钳位**一行可治 | 待重裁 → **已重裁（2026-10-16，取 (b) 入口 decimals 钳位）**：轴宽维持 64 不动，「单向只增不减」按上述成本读数登记为**不实施**；交付与四条变异读数见 §2-C 的「C1b 裁决回写 + C1b' 交付记录」，残留边界（价 ≥10⁷ 配合法小数位仍会顶到轴条）已写入 `docs/SPEC-TV-ALIGNMENT.md` §12〕 |
| 刻度密度 | 固定 6 条（`drawAxes.ts:29`、`:93`；`src/engine/scale/PriceScale.ts:112` `ticks(targetCount = 6)`），不随面板高度变 | 面板高度已可得（`pane.height`） | 0.5〔**C1a 已交付（2026-10-16）**：两处改 `ticks()` 缺省派生，`PRICE_TICK_PITCH = 120` + `MIN_PRICE_TICKS = 3`。规划原句「固定 6 条」是被本轮 PNG 逐带读数推翻的近似——真实形态是**目标 6 条经 nice-step 向下取整 ⇒ 主图实渲 9 条 / 间距 89px**，故 120 的标定取「让 776px 主面板预算回到 6」而非「复现 9 条」；交付记录与 7 项变异、逐面重基线读数见 §2-C〕 |
| 价格轴·快捷入口 | 无「+」：轴区唯一命中件是「自动」按钮（`PaneRenderer.ts:192-210` 绘、`PanZoomGesture.ts:106` 命中） | 需引擎 additive 命中件 + 回调 | 1〔**2026-10-16 已交付**，见下方「C2 交付记录」。本行原估口径就是「+」这一件；`AUDIT-TV-UI-GAP:37` 同行还列了第二件「齿轮（更多价格坐标设置）」，**不在本行范围、现登记为未排期**〕 |
| 画线右键菜单 | 缺「设为默认」——全仓 `设为默认\|setAsDefault` **0 命中**（本轮复跑 `grep -rn` 计数为 0） | `src/features/drawings/DrawingContextMenu.tsx` 现有设置/复制/粘贴/锁定/克隆/移除/视觉顺序 | 0.5 |
| 画线工具栏 | flyout 展开时主按钮不高亮：`src/features/drawings/DrawingToolButton.tsx:59` 底色三元只看 `active`/`hovered`，`open` 只用于 caret 透明度 `:71`、`aria-expanded` `:75` 与旋转 `:100` | 一行表达式 | 0.25 |
| 顶栏图标态 | `IconButton`（`src/ui/primitives.tsx:112-122`）props 仅 `active/onClick/title/children`，**无 disabled/loading** | 顶栏按钮态缺两态 | 0.5 |
| 原生控件 | 原生 `<select>` 仍 **7 处**（`src/features/layout/ChartCell.tsx:109,121,133`、`src/features/market/ChartContextMenu.tsx:313`、`src/features/pine/PineEditorPanel.tsx:69,86`、`src/features/replay/ReplayBar.tsx:198`，本轮 `grep -rn "<select"` 复核计数）；checkbox 已 TV 化（`src/ui/controls.tsx:137,174`） | `ToolbarSelect` 可复用 | 1 |
| 深浅主题一致性（tooltip 底色行） | 「两处 tooltip 底色不一致」需**重新表述而非修复**：引擎 `tooltipBg` 现只服务十字光标轴标签（唯一消费点 `src/engine/renderer/crosshairOverlay.ts:88`），与 UI tooltip 是两个表面、两套语义 | 审计表的同因归并错了 | 0.25（改文档） |
| 深浅主题一致性（elevated 行） | 浅色 `--elevated:#e0e3eb` 与 `--border:#e0e3eb` 同值（`src/styles/global.css:141` vs `:125`），消费点 `src/features/watchlist/WatchlistRow.tsx:189` | 层次弱 | 0.25 |
| —（仓内 TODO 型自认，非审计行） | `theme.infoLabelBg` **两主题同值 `#2a2e39`**，代码自注「浅色主题待分化」（`src/engine/theme.ts:72`、`:103`），消费点 `measureRender.ts:49`、`textRender.ts:182` | 唯一 TODO 型自认 | 0.5 |
| 字体字重 | 字重四档并存（400 / 500 / 600 / `<strong>`700；实测 500 仅 1 处、600 共 5 处） | 收敛为三档 | 0.5 |

### 1.4 结论四：两处「已知边界」登记已不成立，应就地勘正

| 登记处 | 原文 | 本轮反证 |
|---|---|---|
| `OPEN-DECISIONS.md` 2026-09-29 AVWAP 行 Resolution 末句 | 「已知边界：图表重挂需重新落点」 | `useChartCommands.ts:85` 下发含 `params: des.params`，`Chart.tsx:216-222` 落锚写回 store——**重建/布局切换不丢锚的链路双向都在** |
| `SPEC-PHASE1-CLOSEOUT.md:67` 已知边界「对比仅最近 500 根」 | 一次性 500 根、无翻页 | `compareModel.ts:26` `COMPARE_LIMIT` 是**每页**量，`:123-131` 已实现 `barsBefore` 向左翻页 + `ChartWorkspace.tsx:79` 主图左缘联动。**同行「多图表无 Compare」仍成立**（`TopBar.tsx:192`） |

## 2. 批次划分

### 四期-A · 审计勘正 + 口径机械承载（1–1.5 人日，零功能变更）

**进度（2026-10-15）**：A2、A1、A3 **全部已交付** ⇒ **四期-A 批次收口**（交付记录见本节末三段）。

| 项 | 现状 | 动作 | 验收 |
|---|---|---|---|
| A1 两份 AUDIT 过期行标注 **（已交付 2026-10-15）** | 取证时的现状（交付后已过时，原文照登）：§1.1 的 15 行（含 §1.3 的 tooltip 底色行表述错位） | 在**审计文档就地加标注**（「2026-10-15 复核：已交付，出处 `路径:行号`」），不改写原文。**实际交付面 17 行**：UI 表 15 行（= §1.1 的 14 行 + §1.3 引用的 tooltip 底色行）+ FEATURE 表 2 行，另各加 1 条表抬头说明 | 标注行每行都有当场重取的出处；未核实行在抬头写明「本轮未复核」；`format:check` 绿（docs 排除 Prettier，实测） |
| A2 gzip 口径脚本化 **（已交付 2026-10-15）** | 取证时的现状（交付后已过时，原文照登）：`package.json:6-21` 无体积类命令、`.github/workflows/deploy.yml` 只跑 verify + build——**该口径没有任何机械承载**（README:137 已自认：触线不会让任何命令变红） | 交付：`scripts/check-bundle.mjs`（阈值常量 `APP_GZIP_LIMIT_KB = 160` 只在脚本内，注释不复述以免两处漂移）+ `npm run check:bundle`；并串进 `verify` 末尾 ⇒ CI 的 verify 步骤即承载该口径，超阈值直接终止部署 | 门禁多一条红线；提阈值=改一个常量，与 `chunkSizeWarningLimit` 同一「提阈值而非关闭」哲学 |
| A3 oxlint 抑制半径机制 **（已交付 2026-10-15）** | 取证时的现状（交付后已过时，原文照登）：OPEN 行（2026-10-12）：机制未证实，只登记了观测事实 | 用**副本配置**（`.oxlintrc.probe.json` + `-c`，禁改活配置）做受控实验，把「未证实」变成「已证实/已否证」，只出结论不改代码 | 该 OPEN 行关闭（附实验数据），或改为「已知不可控 → 永久禁用该写法」——**两者都成立**：机制已定位（见下记录），同时落一条口径「`react-hooks/exhaustive-deps` 禁块式写法」 |

**A2 交付记录（2026-10-15，零功能代码、零像素变更）**

- 承载物：`scripts/check-bundle.mjs`（只用 node builtins：`fs`/`path`/`zlib`/`process`，**零新依赖**）+ `package.json` 的 `check:bundle`，`verify` 链尾追加 `npm run build && npm run check:bundle`。`.oxlintrc.json` 把 `scripts/**/*.mjs` 并入既有 node-env override（该 override 原列 `*.config.*` / vite / playwright 三形）。
- 应用块判定：**未命中第三方分组名的 js 块**（`VENDOR_GROUPS` = react / radix / lucide / zustand / vendor / rolldown-runtime，与 `vite.config.ts` 的 `codeSplitting.groups` 同步）。口径刻意取 **fail-strict**：将来新增 vendor 组而忘记同步此处，后果是把 vendor 块当应用块 ⇒ 误红，而不是反过来漏计应用增长。
- 尺子照登（防后续比对误读）：脚本用 zlib 默认档（level 6），Vite/Rolldown 用 Rust 压缩器。同一 dist 实测：应用块 Vite **148.49 kB** ／ 脚本 **147.61 kB**（差 884 B ≈ 0.6%，同一阈值下脚本略松）；react 块 Vite 68.27 ／ 脚本 67.53，radix 34.43 ／ 34.13。 zlib 各档扫一遍（level 3/4/5/6/9 + memLevel + Huffman-only）无一档能复现 Vite 报数，故**不做伪校准**、只登记差异。单位取字节/1000（与 Vite 同，非 KiB）。
- 四条探针（一律走脚本**副本** `/tmp/cb-probe.mjs`，活脚本从头到尾未改；跑完即删）：① 副本阈值 140 ⇒ `exit 1` 并打印超出 7.61 kB；② 副本把 `if (over)` 写成 `if (false)` ⇒ `exit 0` 且「裕度 −7.61 kB」——这条证明**变红由判定行承载而非打印语句**，且负裕度会当场自曝；③ 副本 `VENDOR_GROUPS` 误含 `index` ⇒ `exit 2`「未识别到应用块」；④ 在无 `dist` 的工作目录跑活脚本 ⇒ `exit 2`「先运行 npm run build」。探针前先 `grep -n` 证明改动落地，再解读退出码。
- 未做两件事及理由：**不删** `deploy.yml` 里那条独立的 `npm run build` 步骤（verify 内已含构建，故该步骤冗余但无害，约 0.7 s；删属部署管线改动，需单独确认）；**不给脚本加单测**——它不在 `src/`、不被 vitest 覆盖，其承重由上述四条探针证明，加测试等于用同一份逻辑自证。
- 沿革澄清：本脚本**不是** 2026-10-08 退役的 `check:size`（文件规模红线，AST 逻辑单元口径）复活——那条红线现由 oxlint 函数级规则承载（`max-statements 60` / `max-params 10`），本脚本只承载 gzip 体积口径这一件事。

**A1 交付记录（2026-10-15，纯文档、零代码、零像素变更）**

- 交付物：`docs/AUDIT-TV-UI-GAP.md`（§1 主表 39 行中 **15 行**加「2026-10-15 复核」标注 + 1 条表抬头说明）、`docs/AUDIT-TV-FEATURE-GAP.md`（**2 行** + 1 条表抬头说明）。标注一律追加在**「差距描述」列末尾**的 `〔…〕` 内，原单元格一字不改（与 OPEN-DECISIONS 同一纪律）。两表其余行**未在本轮核实**，抬头已写明「未标注=未复核，仍以原表为准」。
- 取证方法：每条标注的 `路径:行号` 在**写入当场**用 Read / `grep -n` / `sed -n` 重取，不沿用 09-28 版行号；三处「零命中」论断（`9999`、`设为默认|setAsDefault`、`锁定垂直|lockVertical|verticalLock`）与两处计数（原生 `<select>` **7 处**、图表右键 **12 项**）本轮各重跑一次 grep 取数。
- **本轮抓出并就地订正的四处自身错误**（A1 的价值不只在勘正审计表，也在勘正本规划首版）：
  1. §1.1/§1.3 原以 `AUDIT-TV-UI-GAP.md` 的**物理行号**（`:24`…）标识审计行，而 A1 一加标注行号即整体位移 ⇒ 全部改为**行标签**（「UI 区域」列名），并声明原行号属 09-28 快照。
  2. 首版把图表右键菜单记为「12 项，**差 2 项**属 TV 独有子菜单」，逐项清点后实为 **12/14、仍缺 4 项**（粘贴 / Trade / Watchlist 子菜单+Create new list… / 按时间锁定垂直光标）；同处项位行号偏移一位（`:133/:147/:164` 应为 `:132/:146/:163`）。
  3. 首版 §1.1 结论计数「15 行抽验、13 行整行已交付、2 行小尾巴」漏计「图表右键·警报模型」一行，且把两条余项折进「已交付」⇒ 订正为 **15 行主差距全部已交付，11 行整行闭合、4 行只剩余项**；该订正已按「追加不改写」写回 OPEN-DECISIONS 的 D7 行 Resolution 末与 README 文档索引行。
  4. **一条被证伪的自己写的论断**：首版标注称 `drawCrosshair.ts`「已不存在」，实读 `find src -name drawCrosshair.ts` 命中 1 个——该文件**仍在**，只是已退化为再导出壳（`export { drawCrosshair } from './crosshairOverlay'` + `drawLegend` / `legendTypes`），失效的是它承载的实现行号而非文件本身。已按实读改写。⇒ 这条正是仓内纪律「被引用的证据本身必须先证明存在」的一次现场兑现。
- 一次违反「不回写历史」的自纠：编辑 Volume Profile 行时误删原单元格的「）」，当场按原文补回后再追加标注。
- 「原文不改写」用**脚本机械验**而非目测（一次/node 比对，跑完即弃）：取 `git diff` 的删除行与新增行，从新增行剥掉 `〔…〕` 标注段后逐行做**全等比对** ⇒ `AUDIT-TV-UI-GAP.md` 15/15、`AUDIT-TV-FEATURE-GAP.md` 2/2 全部命中（unmatched=0）。OPEN-DECISIONS 的 D7 行另按**前缀验**：剥去末格竖线后的原文 1164 字符是新文 1418 字符的严格前缀，插入点唯一（Resolution 单元格末）⇒ 确为追加而非改写。
- 验收读数：`npm run format:check` 绿（`docs/**` 与 `*.md` 由 `.prettierignore` 排除，本批天然不影响门禁）；`git diff --stat` 为 `docs/AUDIT-TV-UI-GAP.md`、`docs/AUDIT-TV-FEATURE-GAP.md`、`docs/PLAN-PHASE4.md`、`docs/decisions/OPEN-DECISIONS.md`、`README.md` 五处，**`src/` 与 `tests/` 零改动**，故不重跑 build / E2E（无代码面变更，27 面黄金截图无从改变）。
- 未做两件事及理由：**不重排 §1.1 之外的审计行**（其余 24 行 UI + FEATURE 全表未在本轮核实，标注它们等于用未取证结论污染基线——这是「反空洞占位」的另一面）；**不改写 09-28 原文**（含其中已被证伪的观测，如「5 档图标尺寸混用」）——历史观测由标注覆盖，不由删除覆盖。

**A3 交付记录（2026-10-15，零代码、零配置变更；`src/` 与 `.oxlintrc.json` 全程未动）**

- 根因一句话：oxlint 1.87 里 React Compiler 那组诊断的**输出名是 `react(refs)` / `react(purity)` / `react(set-state-in-effect)`**，而本仓配置按 `react-hooks/*` 启用（`.oxlintrc.json:7-9`）——指令匹配表因此把「react-hooks 命名空间里的编译器规则名」和「非编译器规则名（`exhaustive-deps` / `rules-of-hooks`）」分成两套语义，2026-10-12 那两条互相矛盾的观测正是这两套。
- 三条语义（基线双组件件 8 条：refs/purity/set-state/exhaustive 各 2；全部读数为当场跑出的 `Found N warnings`）：**① 点名编译器规则=ESLint 一致**——行式 8→7（`react-hooks/refs`、`react/refs`、`oxlint-disable-next-line` 三形同效）、块式按位置取范围（写文件首 8→6 只吃该规则；写文件末尾 8→8 一条不吃）。**② 点名 `exhaustive-deps`/`rules-of-hooks`=附带吞掉编译器那组，半径随形式突变**——行式吞**所在组件/hook 分析单元**内全部编译器诊断（指向单元内无诊断的行也生效：单组件件 2→1；双组件件压 Child 的 useEffect 行 ⇒ Child 三条同灭、Parent 四条全留 8→4），**块式关整文件编译器分析与位置无关且 `eslint-enable` 配对不恢复**（写文件末尾仍 8→2；`rules-of-hooks` 同效；多名列 `exhaustive-deps, no-debugger` 同效；点名 `use-memo` 无此副作用 8→8）。**③ 裸指令**——行式只吃那一行全部规则 8→6，块式吃掉全文件 8→0；点名非 react-hooks 规则（`no-debugger`、`react/jsx-key`）一律 8→8。
- **原登记里被推翻的那半句**：`useChartSeries.ts`「指令移到文件末尾（函数体之外）诊断仍全部消失」不成立。用 `git show e7b0cb8^:src/features/market/useChartSeries.ts`（306 行原件、含 :223 指令）跑三态：原样 **0** ／ 删指令 **8**（refs×6 + set-state×1 + exhaustive×1）／**指令移至文件末尾仍 8** ⇒ 半径是 hook 单元（该文件单一导出 hook，「任意位置」只要还在函数体内就命中整个单元）。两条观测由此合流，无需再猜「React Compiler 路径切换」。
- 由此落三条口径（已入 README 台账机制段）：**(a) `react-hooks/exhaustive-deps` 只准 `eslint-disable-next-line` 形，禁块式**（块式=静默停整文件三条编译器规则，门禁读数只表现为「少一条 exhaustive-deps」）；**(b) `--report-unused-disable-directives` 不能当「这条能不能删」的依据**——合成 hook 件里它把一条正吞掉 3 条编译器诊断的指令报成 `Unused eslint-disable directive (no problems were reported)`，它只核对被点名规则自身有无诊断；**(c) 现行 2 条指令连带半径为零**：`Chart.tsx:108` 与 `ChartWorkspace.tsx:175` 各以**生产件副本删行**复跑 ⇒ 分别只显形 1 条同名诊断（exhaustive-deps 一条 / `react(purity)` 一条），还原后各自 0 条，单元内无编译器诊断可被吞。
- 实验规模与两处自纠：**47 份探针件、46 份有效读数**（多出的 1 份是首轮正文写重、后被重做件替代的那份——它的 parse error 读数不入结论），覆盖 指令名 × 形式（行式 / 块式 / 块式+enable 配对 / 多名列）× 位置（目标行上方 / 单元内无诊断行 / 两组件之间 / 文件首 / 文件末）× 文件形（`.tsx` 双组件 / `.ts` 单 hook / 生产件副本 / 历史原件）。**自纠 1**：首轮生成器把两份探针件正文写重，输出是 3 条 parse error 而非诊断结论——该两份作废并修正重跑后才有上面的 `react/refs` 行式与中部块式读数（**先证明探针件本身有效，再解读读数**）。**自纠 2**：探针件放在仓内时**活配置会把它们一并 lint**，`npm run lint` 一度 390→438 文件、197 警告 + 3 错误；`rm -rf .probe .oxlintrc.probe.json` 后复跑回到 **390 文件 0 错 0 警告**。后续同类实验应放仓外目录，或先清探针再跑门禁。

### 四期-B · 多图表真实化（**8–11 人日，估**；**2026-10-15 D7 裁决本轮不排**，整批封存待未来重排；重排开工前须裁 D8）

| 项 | 动作 | 人日 | 风险与护栏 |
|---|---|---|---|
| B1 单元格真实数据链路 | `useChartSeries` 下沉为 per-cell（cell 持 `symbol/timeframe/chartType` 已在 `layoutStore`）；`generateSeededMockBars` 保留为**降级路径**而非默认；E2E 侧必须走已有的确定化口子 | 2.5–3.5 | 最大风险是网络依赖进 E2E。护栏：新增面全部走 mock/seed 注入，禁 `test.skip`；黄金面结构性免疫（§1.2 实查），故 27 面零 diff 仍须成立 |
| B2 入口随布局形态 | 周期 / 类型 / 回放 / 撤销重做 / 重载在多格布局下要么进单元格标题栏，要么改为「聚焦单元格驱动顶栏」（**形态待裁 D8**） | 2–3 | 与 B1 同批交付才有意义；`ChartCell.tsx:109-133` 三个原生 select 顺带收敛（§1.3 的「原生控件」行） |
| B3 偏好广播到全部 renderer | 下发链从「`ChartSettingsDialog` 单点写主图」改为 renderer 注册表广播（注册表已存在——`eachChartRenderer`，`useTvShortcuts.ts:134` 在用） | 1.5–2 | 顺带关闭 `PLAN-PHASE3.md:158` ③ 与 `:188` ④ 两条登记；须证明「新增一格时被同帧播种」而非只改已有格 |
| B4 右轨 / 警报按聚焦格 | 数据窗口与对象树（`RightSide.tsx:97,99`）改读聚焦单元格 renderer；`useAlertWatcher`（`App.tsx:71`）扩为按可见品种集合采样 | 2–2.5 | 警报扩围会改触发语义（一格品种也能触发主图警报），属**用户可见语义变更**，须先裁 |
| B5（可选）偏好进布局快照 | `layoutSnapshot.ts:232` 起 `captureSnapshot` 仍不含任何显示偏好（三期 B0 登记 ② 原样保留） | 0.5–1 | **随 B 批一并封存**（D7 未排 B ⇒ B5 无意义） |

### 四期-C · 复刻精度长尾（4–6 人日，可逐条拆、逐条独立验收）

按 §1.3 表逐项做，顺序建议：**C1** 刻度密度 + 轴宽自适应（1.5，动 `drawAxes.ts:29,93` / `chartPanes.ts:6`）→ **C2** 价格轴「+」入口（1，引擎 additive）→ **C3** 画线「设为默认」+ flyout 高亮 + 多边形顶点增（1，`ObjectTree.tsx:227` 现仅计数标签）→ **C4** `IconButton` 两态 + 原生 select 7 处收敛 + 阴影残留 1 处（1）→ **C5** 主题层次三微项（`--elevated` / `infoLabelBg` 浅色分化 / 字重收敛，1）。〔**2026-10-16 进度**：C1 已拆为 C1a（刻度密度）**已交付** + C1b（轴宽单向自适应）**成本/收益量化后待重裁**——本行原估 1.5 人日只覆盖 C1a（实际 0.5 量级达成），C1b 单独估 3–4 人日；读数与依据见下方「C1 交付记录」。〔**2026-10-16 进度 2**：**C2 价格轴「+」入口已交付**（估 1 人日达成，几何纯函数单一来源 + 悬停绘制 + additive 回调，27 面零 diff 未重产，读数见下方「C2 交付记录」）；余 **C3 → C4 → C5**，再走 **E2**。〕
**硬约束**：C1 与 C5 会动像素——黄金面 ⑩（轴特写）、②（浅色默认视图）、㉗（测量浮层）直接覆盖这三处，改前必须先确认「新基线单独评审」流程（`visual-regression.spec.ts:222-226` 的反作弊门禁注释）。

#### C1 交付记录（2026-10-16）

**C1a 刻度密度随轴高自适应——已交付。**

- **改动面**：`drawAxes.ts:29`（网格枝）与 `:93`（标签枝）的 `priceScale.ticks(6)` → `ticks()`；`src/engine/scale/PriceScale.ts:20-26` 新增 `PRICE_TICK_PITCH = 120` / `MIN_PRICE_TICKS = 3` / `priceTickBudget(height)`；`:137` `ticks(targetCount?)` 省略时取 `priceTickBudget(this.height)`。**零新 API、零 store→engine 管道**：`pane.height` 由 `ChartState.ts:149` 按 `heightRatio` 派生、`:152` 逐面板 `setSize(pane.height)` 喂进价格轴，本批只是把已有的高度读出来。**additive 判定已证**：改动前全仓 `ticks()` 零参调用点为 0（本轮复跑 `git grep -n "\.ticks()" HEAD -- src` = 无命中），故「缺省语义改变」的既有影响面为空集。
- **标定过程中的一次自纠（必须留档，因为它否掉了规划原句）**：规划 §1.3 写的「固定 6 条」不是渲染事实——目标 6 条经 nice-step 向下取整后，主图实渲 **9 条、间距 89px**（由离线解码黄金面 ⑩ 逐墨带实测）。初版把 PITCH 定为 88 想「复现 9 条」，实测会让 nice-step 把目标 9 再放大到 ~14 条 ⇒ 几乎每面都动。终版取 **120**，让 `budget(776) = 6`，即主面板恒等于改动前那条显式约束——**像素中性由构造保证，再由 26/27 面零 diff 实测确认**。下限从初版 2 改为 3 同样由实测决定：2 时 ⑥ 副图只剩 2 条、读不出步长；3 时 4 条、间距 ~47px。
- **变异复证（7 项，2026-10-16 本轮复跑；每项先由脚本打印落地行号证明改动确实进了源码，再读失败落点；跑完 `md5sum -c` 证明两文件逐字节还原；BASE 未变异 = 37 通过 / 0 失败）**：

  | 变异 | 落地行号 | 红在哪条（用例全名） | 捕获数 |
  |---|---|---|---|
  | M1 网格枝退回 `ticks(6)` | `drawAxes.ts:29` | 密度面 2 条 + `render-primitives` 的 `drawGrid：横线用价格刻度…` | 3 |
  | M2 标签枝退回 `ticks(6)` | `drawAxes.ts:93` | 密度面 2 条 + `drawPriceAxis：轴底色/轴线/右对齐刻度文本位置…` + `drawPriceAxis compact…` | 4 |
  | M3 缺省退回字面量 6 | `PriceScale.ts:137` | `缺省与显式传预算等价`、`同一价格域下矮面板条数少于高面板…`、`194px 副图：网格 5 条、标签 4 条…` | 3 |
  | M4 去掉下限 `Math.max` | `PriceScale.ts:25` | `矮面板由下限 3 托住…`、`间距常量为单一来源…` | 2 |
  | M5 `PRICE_TICK_PITCH` 120→100 | `:20` | `默认主图高度（黄金基线 776px）预算 = 改动前写死的 6…`、`矮面板由下限 3 托住…` | 2 |
  | M6 `round`→`floor` | `:25` | `默认主图高度…预算 = 6`、`间距常量为单一来源…` | 2 |
  | M7 `MIN_PRICE_TICKS` 3→1 | `:21` | `矮面板由下限 3 托住…` | 1 |

  M5/M6 只被**预算数值用例**抓到、抓不到画布面——这正是 776px 那条「等于改动前的 6」必须写成字面量断言的理由；而「间距常量为单一来源」那条恒等式用例对 M5 免疫（它按常量本身推导），两条口径分工明确，不重复也不漏。
- **爆炸半径与逐面重基线读数（用户 2026-10-16 授权「增量重产 + 逐面评审后回读数」）**：27 面里**只有 ⑥ `ma-macd` 位移**——副图（194px）价格轴标签 **9 条 → 4 条**。两套度量各自复证：Playwright 自身读数 **15,038 px（1.4686%，reporter 印 ratio 0.02）**，容差 `MAX_DIFF_PIXEL_RATIO = 0.01` ⇒ 这条**不能靠容差吞掉，必须重产基线**；本轮把改动前基线临时放回、复跑该面取到上面这条 reporter 原文（`error-context.md` 内 `15038 pixels (ratio 0.02 …) are different.`），再用同一张 PNG 做离线逐通道复核 = **20,227 px 有差异 / 19,982 px 超 0.02 单通道阈值，全部落在 y 589–746 带内（= 副图区，主图区 0 位移）**；两套数值不同是度量不同（Playwright 走 YIQ 色差，离线走逐通道 max），**结论一致**。其余 **26 面零 diff、未重产**（`UPDATE_SNAPSHOTS=1 … --grep` 定向增量采集，遵守 `visual-regression.spec.ts:222-226` 的反作弊门禁：基线变更单独评审）；复证跑完后基线已按 `md5sum` 还原为采集后版本（`fa7e1066…`）。主图侧标签仍是 9 条（`⑩ axis-price-closeup` 未重产即通过，即为该构造性中性的直接证明）。
- **本口径明确不保证的事**（不是遗漏，是范围）：nice-step 向下取整会让实渲条数**多于**预算，故极矮面板（< ~120px）仍可能挤——这是改动前就有的性质，本批只做「随高度变稀」这一件事；已在 `PriceScale.ts:17-18` 头注写明。
- **验收读数（2026-10-16 交付复跑，含 E1b 那次用例改动之后）**：`npm run verify` 全绿（typecheck 0 错 / oxlint **392 文件 0 错 0 警告**，+1 = 本批新单测文件 / format:check 绿 / 单测 **94 文件 1517 例**，+8 全在 `price-tick-density.test.ts` / build 应用块 **518.19 kB**，Vite 报 gzip 148.52 kB、`check:bundle` 脚本口径 **147.63 kB / 上限 160 ⇒ 裕度 12.37 kB**）；整串 `npx playwright test --retries=0` **73 passed**、**27 面黄金截图零 diff**（⑥ 已按新基线通过，其余 26 面对旧基线通过）〔**2026-10-16 同日勘正**：该「73 passed」是当轮抽样读数——同批的 E1b 用例改动并未治好 `replay-drawing.spec.ts` 那条对照，同日另一轮整串跑出 72 passed / 1 failed，根因见 §2-E 的 E1d 勘正条〕。同批 README 基线段（现 :86）与 `docs/SPEC-TV-ALIGNMENT.md` §12 同步；本批另**勘正 README 一处口径**——「外网依赖已切断」实际只覆盖期货分类那条用例，符号搜索两条仍依赖东财联想端点，已登记为 OPEN 行待裁（见下）。
- **新增测试**：`tests/unit/price-tick-density.test.ts`（8 例 / 4 组，预算数值 + 恒等式 + 缺省≡显式 + 显式与高度无关 + 矮面板变稀 + 画布级网格/标签条数与「两枝同源：网格线 = 全长、标签 = 越界剔除后的子集」）。`render-primitives.test.ts` 里 3 处原先从 `ticks(6)` 派生期望的用例改为**同源取样**（`sampleTick`），不写死新字面量——按既有口径「统一修改所有受影响的测试」，而不是给它们换新数字。

**C1b 轴宽单向自适应——裁法已定（单向只增不减），实施成本与可达收益经量化后待重裁。** 读数全部来自离线解码真实浏览器像素（node 内置 `zlib` 解 IDAT + 逐行反滤波，不依赖仓内 `measureTextWidth` 估算器，也不用开浏览器）：

- **溢出阈值的真实几何**：轴条宽 64、文字右基线在轴条左缘起算 58px、左缘 0–1 是 1px 分隔线。⑩ 面 9 条标签的墨宽实测 **8 字符 = 46px**（⇒ 5.75px/字符 @11px 字体），故 **≥10 字符抵到分隔线、≥11 字符越出轴条压到 K 线**。
- **本仓可达配置逐条排查**：轴标签走 `PriceScale.toLabel`（`:57-61`），非百分比态就是 `price.toFixed(decimals)`（**无千分位**）。decimals 来源链 = `App.tsx:67 decimalsFor(lastPrice, instrument.decimals ?? 2)` → `Chart.tsx:91` → `legend.decimals` → `ChartController.ts:212` → `PaneRenderer.ts:154`。静态品种表里最大是 forex 4 位、hk 3 位（`types/instrument.ts:54,:61`），币安非 USDT 交易对给 6 位（`data/sources/binance.ts:89`）、gate 非 USDT/USD 给 6 位（`data/sources/gate.ts:182`）⇒ 要凑到 11 字符，需要 **2 位小数下价格 ≥10⁷**、或 **6 位小数下价格 ≥10⁴**（而 6 位小数的交易对通常是 <100 的比价）、或 percent 模式 ≥1000%（`+1000.00%` = 10 字符，仅抵线）。指标副图走 `formatCompact`（`drawAxes.ts:96`）更短。**结论：正常行情路径打不到那根线。**
- **唯一被证可达的溢出**：自选落盘校验只要求 `typeof i.decimals === 'number' && Number.isFinite(i.decimals)`（`src/store/watchlistPersist.ts:39-41`），**没有上限**——手工把 localStorage 里的 decimals 写成 20，标签即 24 字符、墨宽 ~138px，溢出约 80px。这条的真因是**入口精度未钳**，用一行钳位（`decimalsFor` 的 fallback 侧或校验器）可治，与轴宽无关。
- **实施成本（否掉原估 1 人日的三条证据）**：① `AXIS_WIDTH` 现有 8 个消费点、跨 5 文件（`chartPanes.ts:22,27`、`drawAxes.ts:58,63,77`、`PaneRenderer.ts:198,199`、`ChartState.ts:25` 再导出），且 `chartAreaWidth`/`chartAreaOffsetX` 两个纯函数签名要加宽度参数——`ChartController.ts:93,:916`、`RenderPipeline.ts:91`、`crosshairOverlay.ts:26`、`InputController`/`HoverController` 命中区全链路一起改；② **闭环**：轴宽 → 图表区宽 → 可见 bar 数 → 价格域 → `ticks()` 标签 → 轴宽。要不成环只能「用上一帧的域测本帧宽」，即每帧一帧滞后，zoom 过程中宽度会在阈值上反复进出 ⇒ 肉眼可见的抖动，需要额外加迟滞并把它钉成用例；③ 现无宽标签测试面：`visual-harness.ts:78,86` 两处 `decimals: 2` 硬编码，得先给 harness 加开关才能产出可比对的新黄金面。合计估 **3–4 人日 + 一条新反馈环**，换来的是「正常行情下不触发、异常输入下治标」的分支。
- **待重裁的三选一**（已登记为 OPEN-DECISIONS 新行）：(a) 按裁法实施单向只增（3–4 人日，含闭环与防抖）；(b) 改做**入口 decimals 钳位**（0.25 人日，直接消灭唯一可达的溢出根因，轴宽维持 64）；(c) 本行登记为「裁法已定、成本与收益已量化、不做」并写入对齐口径。

#### C1b 裁决回写 + C1b' 交付记录（2026-10-16，用户改判取 (b)）

**裁决**：用户取 **(b) 入口 `decimals` 钳位**——轴宽维持 `AXIS_WIDTH = 64` 不动，上一行已裁的「单向只增不减」按本节成本读数**登记为不实施**（不是撤销裁法记录，是按量化后的成本/收益改判实施对象）。改判走的是 OPEN-DECISIONS 的追加 + 就地关闭链，原裁法行原文保留。

- **实施（本批 `src/` 仅 1 文件）**：`src/data/format.ts` 的 `decimalsFor` 是 `instrument.decimals` 在全仓的**唯一收口**（顶栏 `TopBar.tsx:119`、自选行 `WatchlistRow.tsx:55`、右键菜单 `ChartContextMenu.tsx:78/:129/:264`、轴标签 `App.tsx:67` 全走它），故只在此加两道钳位：上限新导出常量 `MAX_PRICE_DECIMALS = 8`（`:45`）、下限 0（`:54`）。**上限取 8 的理由带读数**：合法来源最高 6（`binance.ts:89`、`gate.ts:182`）+ 2 位余量；变异 M3 把上限压到 4 会让**合法的币安 6 位对一起变红**（`expected 4 to be 6`），说明再往下降级会伤真实品种。
- **下限是取证之外的新发现（本批多治一条）**：`Number.prototype.toFixed` 只在 [0,100] 合法，而落盘校验不拦负数 ⇒ 手工写 `decimals: -5` 会让轴标签**每帧抛 RangeError**。新单测里留了一条不钳的对照 `expect(() => scale.toLabel(100, -5)).toThrow(RangeError)`，把这条从「推测」钉成「实测」。
- **变异读数（四条，每条先证落地：改后 md5 ≠ 基线 `1898030bdd…` + grep 命中 mutated 行；跑完从备份恢复并复核 md5 回基线）**：**M1** 整条钳位去掉（`fb = fallback`）⇒ 3 例红，其中端到端那条给出 `expected '50000000000000000000' to have a length of 8 but got 20`——即上一节「20 位小数 ⇒ 24 字符 ⇒ 溢出 ~80px」的实形；**M2** 只去下限 ⇒ 「下限 0」例红 `expected -5 to be +0`；**M3** 上限 8→4 ⇒ 3 例红（含上述合法 6 位被误伤）；**M4** `actual` 侧 4→8 ⇒ 2 例红 `expected 8 to be 6` / `expected 8 to be 4`，即既有「取报价实际位数」语义被改，**本批未动它**。
- **新增测试**：`tests/unit/price-decimals-cap.test.ts` 5 例 / 上限（含早退分支 `decimalsFor(0,20)`、`decimalsFor(NaN,20)` 同受钳）+ 下限（含 RangeError 对照）+ 合法来源逐条不变（6/3/1/2/0）+ `actual` 4 位上限不变 + 端到端标签小数位恰为 8（附不钳时 20 位的对照）。
- **残留边界（如实登记，不称「已根治」）**：钳位治「小数位被污染」，治不了「价格本身位数长」——价 ≥10⁷ 配合法小数位仍会顶到 64px 轴条。该边界已写入 `docs/SPEC-TV-ALIGNMENT.md` §12 与 README「已知状态」；若日后要治它，须重开本节的轴宽自适应并付 3–4 人日 + 防抖设计，且要先解决「无宽标签黄金面」这一测试面前置。
- **验收读数（2026-10-16 C1b' + E1c + E1d 同批复跑）**：`npm run verify` 全绿（typecheck 0 / oxlint **393 文件 0 错 0 警告**，+1 = 本批新单测文件 / format:check 绿 / 单测 **95 文件 1522 例**，+5 全在 `price-decimals-cap.test.ts` / build 应用块 **518.22 kB**，Vite gzip 148.52 kB、`check:bundle` 口径 **147.64 kB / 上限 160 ⇒ 裕度 12.36 kB**）；整串 `PORT=5173 npx playwright test --retries=0` **73 passed（exit 0）**、**27 面黄金零 diff**——钳位在 harness 的 `decimals: 2` 档位上是恒等变换（`tests/e2e/harness/visual-harness.ts:78,86` 两处硬编码），E1c/E1d 纯测试侧、零 `src/` 像素影响。


#### C2 交付记录（2026-10-16）

**C2 价格轴「+」跟随光标建警报入口——已交付。**（`AUDIT-TV-UI-GAP:37` 那行的「+」一半；齿轮一半未做，见下方「本批明确不做」）

- **改动面**：引擎侧几何单一来源 = 纯函数 `chartPanes.ts:60`（`priceScalePlusRect`，配套 `:33` `AxisHitRect`、`:41` `PRICE_SCALE_PLUS_SIZE = 18`、`:56` `hitAxisRect`）→ `ChartState.ts:114` 的 `priceScalePlusRect()` getter（读 `:105` 新字段 `priceScaleHoverY`）。**三处消费同一矩形**：绘制 `RenderPipeline.ts:236-237` → `drawAxes.ts:229`、命中 `InputController.ts:161-169`、光标 `HoverController.ts:96` → `cursor.ts:41`。React 侧走既有两条链：引擎→React 用 additive `ChartController.ts:545` `setPriceScaleAlertCallback`（注册点 `Chart.tsx:186`，卸载 `:245`），开合态入 `uiStore.priceScaleAlert`（`:42`/`:75-76`），对话框**复用三期-B4 那只** `ChartAlertDialog`（把 `ChartContextMenu.tsx:253` 从文件内私有提升为导出，`ChartDialogs.tsx:129-131` 挂载）。
- **为什么用纯函数就地派生、不用 `autoBtn` 的「绘制回写」先例**：`autoBtn` 必须回写是因为它的宽依赖 `measureText`；「+」尺寸固定，回写会引入一帧滞后 ⇒ 同一帧里「画在哪」与「点哪算命中」可能不同框。就地派生让绘制/命中/光标**必然同帧同几何**，这条判据写在 `ChartState.ts:110-113` 注释里。
- **契约扩展的两侧不对称是有意的**：`InputHost` 两条新成员取**必选**（`InputController.ts:52`、`:80`）——tsc 当场抓到测试替身缺成员（`TS2739`），按既有口径「统一修改所有受影响的测试」补 fixture，而不是把契约降级成可选把断链藏起来；`HoverHost.priceScalePlusRect?()` 取**可选**（`HoverController.ts:47`），因为它是光标降级路径，缺省即改动前的 `ns-resize`，不构成行为回归。
- **像素中性的两条证明**：① **结构性**——黄金面来自 `visual-harness.html`（单格 100vw/100vh，harness 模块不模拟指针），且 `visual-regression.spec.ts` 的 pointer 动作只有 5 处（`:192` 600,400 / `:200` 300,250 / `:201` 620,360 / `:203` 420,180 / `:386` 1185,400），全部 x ≤ 1185 < `chartW = 1280 − 64 = 1216` ⇒ 没有一面把光标停在轴条上；② **实测**——整串 27 面零 diff、未重产。代价照登：**TV 的常驻「+」态本批不做**，因为常驻会让 27 面全部重基线（属用户裁决项，已登记 OPEN-DECISIONS **D12**）。
- **两条与 TV 不同的口径**（不是遗漏，是范围）：**只在悬停价格轴时绘制**（上一条）；**只在主价格面板内绘制**——副图刻度是**指标值**，而对话框只出 `source: { type: 'price' }`（`ChartContextMenu.tsx:284`），按价格建会写错源；副图一侧要等非价格 `AlertSource` 通道打通。二者均已写入 `SPEC-TV-ALIGNMENT` §12 同日期行。
- **变异读数（5 项。落地证据两处并列：源码内临时 `// PROBE-*` 注释经 `grep` 打印 + 该次运行的失败用例名。还原证据按文件分列，不写成统一口径——`chartPanes.ts`（M4/M5）与 `InputController.ts`（M2/M3）各自先证 md5 偏离基线、跑完复核回到 `ff90e23b…` / `047b63d3…`；`RenderPipeline.ts`（M1）与 `HoverController.ts`（光标那条）只以「删注释后复跑该项转绿 + 文件内不再含 PROBE 字样」为还原证据，本轮未记这两文件的逐字节 md5）**：

  | 变异 | 落地行号 | 红在哪条（用例全名） | 读数 |
  |---|---|---|---|
  | M1 撤掉绘制调用（改 `void drawPriceScalePlus`） | `RenderPipeline.ts:237` | E2E ①「价格轴「+」只在悬停主图轴条时出现，离开即消失」 | E2E 1 failed / 3 passed |
  | M2 删「+」命中分支（`if (false && …)`） | `InputController.ts:163` | 单测「价格轴「+」：轴内移动 → 框随光标；在框上按下 → 回调拿到框心价格」＋ E2E ③「点击「+」打开警报对话框…」 | 单测 1 failed / 43 passed、E2E 1 failed / 3 passed ⇒ 引擎侧与 React 接线侧各被一半捕获 |
  | M3 预填价改取光标 y（`yToPrice(y - main.y)`） | `InputController.ts:166` | 同 M2 那条单测（其 `yToPrice(591) !== yToPrice(595)` 前置断言就是为这条而写） | 单测 1 failed / 43 passed |
  | M4 去掉与「自动」按钮的互斥让位 | `chartPanes.ts:76` | 单测「与「自动」按钮竖直相交时让位」＋ E2E ④「手动价格域后「+」给「自动」按钮让位」 | 各 1 failed（单独跑，红点唯一） |
  | M5 去掉主价格面板边界 | `chartPanes.ts:70` | 单测「三条 null 分支：不在轴上 / 无价格轴 / 光标在副图面板」＋ E2E ②「副图刻度区不出现「+」」 | 各 1 failed |

  M4/M5 先合并跑过一轮（单测恰好红那两条不同用例、E2E 2 failed / 2 passed），再**各自单独复跑取唯一红点**，避免「两条变异互相掩盖」这种读数；E2E ② 因此改成**扫整条主图轴**而不只读光标那一行——M5 态下框会被钳到主图底部，只读光标行必然漏判（这一条由 M5 单独复跑实测确认，非推断）。
- **本批自造的一条回归，由既有契约用例当场抓出（未改测试，改实现）**：`setPriceScaleHoverY` 原先每次 pointermove 都调 `invalidate`，即使值没变（图表区内是 `null → null`）——`data-window-broadcast.test.ts:126`「鼠标移动经 HoverController → invalidate → 面板拿到吸附态」按次数断言，直接打红 `expected 2 to be 1`。改为**值变化才重绘**（`ChartController.ts:150` 守卫），按下/离开两条不经过 `HoverController.update` 的路径仍显式重绘，否则「+」要滞留到下一次移动才消失。这条回归的根因是把「状态写入」与「重绘请求」绑成一个口，而 pointermove 是每帧口；三期-C2 那条「invalidate 是唯一挂点」的用例正是为了抓这类重复挂点而存在。
- **本批明确不做**：① TV 常驻「+」（需重产 27 面 ⇒ D12 待裁）；② 副图刻度一侧的「+」（需非价格 `AlertSource`）；③ `AUDIT-TV-UI-GAP:37` 同一行的**价格坐标设置齿轮**（全仓零命中，本轮未排期）。
- **验收读数（2026-10-16 交付复跑）**：`npm run verify` 全绿（typecheck 0 错 / oxlint **394 文件 0 错 0 警告**，+1 = 本批新 E2E 文件 / format:check 绿 / 单测 **95 文件 1531 例**，本批 +9 全在 `tests/unit/gestures.test.ts`（该文件 35 → 44 例；两处独立读数同判：`git show HEAD:tests/unit/gestures.test.ts | grep -cE "^\s*(it|test)\("` = 35，整串 1522 → 1531 = +9。本行与 `SPEC-TV-ALIGNMENT` 同日期行的**初稿写「+8 / 36 → 44」是未核实的沿用，已就地勘正**）/ build 应用块 **520.17 kB**，Vite 报 gzip 149.18 kB、`check:bundle` 脚本口径 **148.24 kB / 上限 160 ⇒ 裕度 11.76 kB**）；整串 `npx playwright test --retries=0` **77 passed（exit 0，3.3 m）**、**27 面黄金截图零 diff 未重产**。新增 `tests/e2e/price-scale-alert.spec.ts` 4 例（默认零像素 + 副图整条轴零像素 + 点击出对话框/价格随 y 单调下降/创建后 `tradingpa.alerts` 里 `source.type === 'price'` + 手动态让位），像素读数沿用四期-E1d 的夹带采样法并**逐条配对照读数**（先证明采样位在非悬停态是干净的，再读正例）。

### 四期-D · 内容长尾（**目标口径待裁 D9，不排人日**）



实读计数：内置指标 **64** 个 id（`src/indicators/builtin/*.ts` 合计）、Pine 函数表 **44** 个唯一名（`ta-overlap` 19 + `ta-momentum` 16 + `ta-math` 10，去重后 44）。审计表原记「63 / 100+」「32 / 100+」，两处分子分母都已过期。三期 §3 第 3 条已写死「400+ 内置指标全量不做」，所以**继续补必须有新目标口径**（补到「TV 常用集」还是就此冻结），否则长尾没有收口判据。

### 四期-E · 回放 / 交易语义小项（1–1.5 人日）

| 项 | 现状 | 动作 |
|---|---|---|
| E1 回放中画线 | `AUDIT-TV-FEATURE-GAP:128` 原记「回放中画线未验证（理论上引擎未禁用，需 E2E 验证）」——同行前半「倍速表扩到 TV 同档」已随三期-E1 交付（`replayStore.ts:59` `[1,2,4,8]`），该行仅剩画线这一半。本轮核实：`InputController.ts:299-307` 回放态右键被**下单浮窗**占用、`:301-302` 命中画线时不弹；E2E 侧 `grep 回放` 只有 4 例（`smoke.spec.ts:121,161`、`interactions.spec.ts:290`、`settings.spec.ts:266`），**无一覆盖画线** | 补 E2E 用例把「回放中能不能画、画在游标左还是右、未来 bar 上画线会怎样」钉成被测事实，再决定要不要限制〔**2026-10-15 已交付**：`tests/e2e/replay-drawing.spec.ts` 6 例 / 44 断言 + 8 项变异 + tripwire 量化，十条现状与两处探针自纠见本节下方「E1 交付记录」；顺带修掉磁吸「弱/强」档的 store→引擎断链。**「要不要限制」已升级为待裁行 D11**，本行取证关闭；**D11 已于 2026-10-16 裁为 (a) 不限制、口径入册**（回写见下方「D11 裁决回写」）〕 |
| E2 手续费 / 滑点 | `grep fee\|commission\|slip` 在 `src/features/trading/*.ts` **0 命中**——`paperEngine` 至今无此概念。三期 B2 的裁决理由是「加了只能是假开关」（`PLAN-PHASE3.md:158` ①），该理由针对的是「只做显隐开关」；**真模型不是假开关**，故边界需重裁（D10） | **已裁做**（2026-10-15 D10 = 真模型）：`tradeSettingsStore` 加费率/滑点两字段（走既有 `tradingpa.tradeSettings.v1` 落盘键，additive）+ `paperEngine` 成交与盈亏计算真的接入 + `SummaryReport` 标注含费口径。**开工前先核两点**（本行登记时未取证）：`paperEngine` 的盈亏是否存在多处独立重算（若有，先单一来源化再接费）、滑点作用于成交价还是成交量的口径差异。估 1–1.5 人日，排在 C 之后 |

**E1 交付记录（2026-10-15；`src/` 改动只有一处 = 取证中抓出的断链修复，其余为新增用例与文档）**

- 交付物：`tests/e2e/replay-drawing.spec.ts`（**新，361 行 / 6 用例 / 44 处 `expect`**）+ 补一条 store→引擎 下发链（`src/hooks/useChartCommands.ts:34` 订阅 + `:76-78` effect）。取值一律走 `ChartController` 公开面（`replayIndex` / `lastBarTime` / `magnetMode` / `listDrawings()` / `setReplayIndex()` / `removeDrawing()` / `dataWindowSnapshot` / `screenshot()`，DEV 句柄 `window.__chartRenderer` 见 `Chart.tsx:97`）；未来 bar 的 OHLC **只能先把游标推过去再从数据窗口读回**，落笔前不偷看序列内部——这条约束是用例形态的主要成本。
- 文件头注写明「**只描述现状，不主张应当如此**」：本文件同时是 D11 若取「加钳制」时的 tripwire（实测见下方变异项 H）。
- **十条现状，逐条带承重**：
  1. **回放态画线不限左右**——游标之左之右都能落笔（用例 1，`:190`）。机制：`drawing/coords.ts:41-43` 的 `pixelToPoint` 只把 index 钳到**序列长度**，全仓无第二处把画线锚点钳到 `replayIndex`。
  2. **游标之右的锚点落在未揭示 bar 上**（用例 1）。断言用 `revealForward()` 逐根揭示后的「time ≤ 锚点的最后一根」查表，并先证明表格覆盖到锚点——不这么写会把表格末行当成命中。
  3. **磁吸关时锚点时刻是插值**，不正落在任何一根 bar 上（用例 1 第三断言；机制 `coords.ts:45-52`）。这条与第 2 条方向相反，必须分开钉：只钉一条会允许另一条悄悄改判。
  4. **锚点是时间制**：把游标推到锚点那根，线的 `time` 与 `price` 逐字不动（用例 1 末段）。
  5. **越过序列末的点击不拒绝、不落空**，锚点钳到最后一根 bar 的时间（用例 5，`:321`；机制 `coords.ts:43` 的 `Math.min(series.length - 1, roundIdx)`）。
  6. **强磁铁在游标之右画线 = 把线吸附到用户此刻看不到的那根未来 bar 的 OHLC 之一**（用例 2，`:228`，未来价读数泄露）。同用例带磁吸关对照：同区域落笔既不正落在 bar 上、价也不命中 OHLC ⇒ 相等关系来自磁吸而非巧合。弱档 50px 阈值不在本文件重复，仍由 `tests/unit/drawing-polygon-edit.test.ts:190-202` 承载。
  7. **未来区真的被绘制**（用例 6，`:332`）：游标之右的水平线在 x=700 列渲染出笔画色实色行（本仓默认线色 `#ef5350`），`removeDrawing()` 后该列归零为对照。机制：`drawing/drawDrawings.ts:193-196` 只按图表矩形裁剪，与回放边界无关。**渲染证明刻意由水平线承担**——斜线逐列被抗锯齿混成中间色，「同色行数」会归零（第一轮就因此误判过「趋势线没画出来」），故趋势线只钉落点数据（同用例末段：两端都在游标之右也能落成、`points=2`）。
  8. **回放中右键命中画线：画线菜单与下单浮窗都不出现**（用例 3，`:271`）。机制：`renderer/InputController.ts:299-308` 回放态先判 `trade.hitAt`（`:301`）再判 `drawing.hitAt`（`:302`），命中即 `return`，两条出口都不弹。同用例带两个对照：同帧空白处右键出下单浮窗（`[data-testid="chart-order-menu"]` + 文案「点击价」，证明检测子能看见浮窗而非空转）、退出回放后同像素出画线菜单（含「锁定」）。
  9. **先选工具再点回放，第一次点击被「选择K线」消费**（用例 4，`:306`）：`InputController.ts:160-163` 的选线分支在 `:164-167` 工具分支**之前** return ⇒ 该笔不落成画线，工具仍激活、第二次点击才画。
  10. **回放中下单浮窗的时间取游标那根 bar，不取点击处那一根**（`InputController.ts:305-306` `barAt(replayIndex)` ⇒ 在游标之右右键，订单时刻仍是游标 bar）。**这条只登记机制行号，未由用例钉住**：要断言它得真下一笔单再读成交时刻，超出本批「画线」取证范围；已并入 D11 的裁决材料〔D11 已裁 (a)，本条随裁决**入册为已知语义**，仍无用例承重——这是裁决记录，不是断言；未来若要做成断言须另开用例〕。
- **顺带修掉的断链（本批唯一的 `src/` 改动）**：磁吸「弱/强」档此前是**只写不读的 UI**——`drawingStore.magnetMode`（`:7/:19/:29/:36`）由右键菜单 `DrawingToolbarMenus.tsx:56` 写入、`DrawingToolbarBottomControls.tsx:47` 的按钮 title 读它，而 `ChartController.setMagnetMode`（`:676-678`）**全仓调用点为 0**，引擎恒停在 `DrawingLayer.ts:17` 的默认 `'weak'`。⇒ 用户选「强磁铁（始终吸附）」后行为不变。修复即补 `useChartCommands.ts` 那条 effect（与相邻 `setMagnet` 同一形状，引擎侧零改动、公开 API 未动）。**发现方式不是目测**：新用例 2 加了一条「先证明档位落地再解读吸附」的引擎侧断言，首跑即报 `Expected: "strong" / Received: "weak"`——这条失败就是断链的读数，修复后同处转绿。用例 2 现同时钉 UI 侧（`title=磁吸（强磁铁）`）与引擎侧（`magnetMode==='strong'`）两端，任一端再断都红。
- **变异取证（8 项，全部先改后跑、跑完还原，还原以 `git status --porcelain` 证明工作区只剩本批两处目标改动）**——下列断言行号按**现行文件**（Prettier 定稿后）标注，跑探针时的 reporter 读数与之逐条对得上：A `coords.ts:43` 去掉末根钳制 ⇒ 用例 5 失败于 `:329`，读数是墙钟（`Received: 1792066879075` vs `Expected: 1792052040000`）；B `coords.ts:45` 关掉磁吸关插值 ⇒ 用例 1 的第三条断言失败（`:216`）；C `coords.ts:54` 关掉吸附 ⇒ 用例 2 的 `inOhlc` 失败（`:251`）；D 关掉选线分支 ⇒ 用例 4 失败于 `:313`；D3 选线分支不再 `return` ⇒ 用例 4 失败于 `:314`（`Received length: 1`，正是「同一次点击既设游标又落笔」这一被否掉的形态）；E 把 `InputController.ts:299` 的特判反写 ⇒ 用例 3 失败于 `:284`（画线菜单复现）；F `drawDrawings.ts:195` 裁到 `x<600` ⇒ 用例 6 失败于 `:347`（该列 hits=0）；G `ChartController.setReplayIndex` 里让首锚跟随游标 ⇒ 用例 1 的「锚点不动」失败于 `:223`。**H = D11 的 tripwire 量化**：在 `InputController.ts:164-167` 加「回放态拒绝在游标之右落笔」的钳制 ⇒ **6 条里 4 条失败**（1/2/5/6），未失败的 3/4 正是「游标之左 + 右键 + 选线顺序」两条与未来区无关的用例。每项都逐条读过失败信息落在**哪一条断言**上，不接受「跑红了」作为证据。
- **两处自纠（探针无效读数，均已在当轮改掉）**：① 探针 v1–v4 用 `[title="市价买入/做多"]` 判定下单浮窗，该选择器同时命中回放工具条 `ReplayBar` 自己的快捷下单按钮 ⇒ 得出过「回放中右键画线会弹下单浮窗」的**假结论**（与现状 8 相反）。改用 `[data-testid="chart-order-menu"]`（`ChartOrderMenu.tsx:43`）后当场翻转，且补了「同帧空白处必须数到 1」的对照断言防选择器空转。② 磁吸探针曾点 `y=-170`（画布外，自动缩放不含未来价）——「没吸附」属读数无效而非现象；改选一根 OHLC 落在可见带内的未来 bar 后才取得现状 6。另：早期那次「强磁铁吸附成功」的读数其实发生在**断链未修**时，真实生效的是弱磁铁的 50px 内吸附——本条随上面的断链一并勘正，现状 6 只在修复后才成立。
- **验收读数**：`npm run verify` 绿（typecheck 0 / oxlint **391 文件 0 错 0 警告**，+1 = 本批新用例 / format:check 绿 / 单测 **93 文件 1509 例**（本批零新增单测：断链那条链路的守卫由 E2E 承载，仓内无 `renderHook` 依赖可测 hook）/ build 应用块 **518.12 kB**，Vite 报 gzip 148.50 kB、`check:bundle` 脚本口径 **147.62 kB / 上限 160 ⇒ 裕度 12.38 kB**）；整串 `PORT=5176 npx playwright test --retries=0` **73 passed**（67 → 73，+6 即本文件）、**27 面黄金截图零 diff**（本批对像素中性：`src/` 唯一改动是下发链，未动任何绘制路径）。E2E 计数口径变更已同步 README 基线段。
- **未做三件事及理由**：**不加钳制、不改磁吸语义**（现状 1/2/3/6 是否期望行为属产品裁决 ⇒ 登记为 **D11**，本轮只把事实钉住；`coords.ts` 无 `replayIndex` 可达口，真要钳得先加引擎侧 additive 面，这本身就是排期依据）；**不新增黄金面**（D6 收敛取向，「回放 + 未来区画线」这一形态已由用例 6 的转写式像素断言覆盖，加面即加永久复核税）；**不给 `useChartCommands` 补单测**（无 hook 测试宿主，为一条 effect 引入 `@testing-library` 属为测试加依赖，且 E2E 双端断言已覆盖同一链路）。
- **E1 用例自纠（2026-10-16，四期-C1a 交付复跑时发现，独立提交 `test(phase4-E1b)`）**〔**⚠ 本条的根因判读已被同日 E1d 推翻，见下两条；原文按 append-only 保留，不改写**〕：`replay-drawing.spec.ts:350-351`（修复前）那条「移除后该列不该留有线色」的对照用**固定 `waitForTimeout(120)` + 直接断言**，机器忙时等不到 `removeDrawing` → invalidate → rAF 那一帧，读数 `Received: 1`——整条水平线在该列的唯一交点还在，即「线还在」而非「画了一半」。这不是应用缺陷：断言等的是**渲染完成**，用的却是**时长**这一代理量。改为 `expect.poll(() => columnHits(...), { timeout: 5_000 }).toBe(0)`（现 `:352-355`），等的是同一条不变量成立，断言强度不降。**承重复证**：no-op 探针把 `c.removeDrawing(d)` 打成 `void d;`（脚本打印落地行号 102 证明变异进了源码）⇒ poll 满 5s 超时且 `Received: 1`，还原以 md5 一致证明。**复现与回归读数**：单跑该文件 6 passed；`replay-drawing + watchlist` 配对跑在修复前 1 红、修复后 14/14 绿；`expect` 记数 44 处不变（`expect(` 换成 `await expect` + `.poll`，token 数守恒），文件 361 → **365 行**。同轮另发现 `watchlist.spec.ts:85/:104` 吃外网联想源，与本批无关、**未擅自改**，已作为 OPEN 行登记（`docs/decisions/OPEN-DECISIONS.md` 2026-10-16 那条 + README「已知状态与待办」）。
- **E1b 判读勘正 + E1d 交付（2026-10-16 同日，四期-E1d）**：上一条把根因记为「固定 sleep 等不到那一帧」，并把 `Received: 1` 解读为「线还在」——**两条都不成立**，因为改成 poll 之后整串复跑该用例**仍在同处报同读数**（72 passed / 1 failed）。根因是**像素采样没夹带**：默认画线色与主题跌色**同值** `#ef5350`（`src/engine/palette.ts:31` + `theme.ts:57`），而**最新价虚线横贯整个主图**（`src/engine/renderer/drawAxes.ts:184-195`，按涨跌取 `theme.up/down` 后 `setLineDash([2,2])`），命中哪一列取决于虚线相位与价签行 y ⇒ 间歇红。三条读数来自临时探针 `zz-probe-residual.spec.ts`（当场读数、跑完即删）：① **画线之前**列 700 就已有 1 行同色（一次 y=116、另一次 y=113，随行情漂移）；② park 鼠标前后差值 0 ⇒ 与十字光标无关；③ 探针直接打印 `画线色 = #ef5350 与默认红同色 = true`。**因此 (b) 那条「应用侧漏绘」的怀疑不成立**——引擎的绘制与移除都正常，缺的是采样口径。**交付**：`columnHits`（计数）改为 `columnRows(page, color, x, band?)`（返回行号，带按 CSS y 夹带并按 `img.height/clientHeight` 换算，DPR 无关），该条对照改为「带 [318,322] 内画线后非空、移除后归零」。**三条变异探针（每条先证 md5 偏离基线 `67076d62…` 再解读、跑完恢复并复核一致）**：M-A `removeDrawing` 打成 `void d;` ⇒ 对照仍红 `Expected: 0 / Received: 1`，**断言强度未因夹带而降**；M-B 带退化为全列 `[0,2000]` ⇒ **原红在同处同读数复现**，这是「带承重」的直接证明、同时反证 sleep/poll 从来不是主因；M-C 带移到无线行 `[400,404]` ⇒ 正向断言红 `Expected: > 0 / Received: 0`。**顺带修正一条更旧的说法**：该用例的**正向**断言（全列 `>0`）此前在**没有线**时也能靠常驻虚线通过，即「未来空白区真的被绘制」的渲染证明原本不成立；夹带后才真正钉住落笔行有线色。**回归读数**：`--repeat-each=4` 该文件 **24 passed**；整串 **73 passed（exit 0）**、27 面零 diff；零 `src/` 改动、无新文件（lint 计数与 C1b' 同态 393）。详见 `docs/decisions/OPEN-DECISIONS.md` 2026-10-16「四期-E1b 交付记录**勘正**」行。
- **E1c 交付（2026-10-16，用户裁决「现在打桩」；承上一条 OPEN 行就地关闭）**：`tests/e2e/watchlist.spec.ts` 新增 `SUGGEST_ROWS` + `stubStockSuggest(page)`（与 `:127` 期货分类那条同款 `page.route` 形态：按 URL 的 `input` 查表、响应体包上 URL 里的 JSONP 回调名），并在 `:109 符号搜索切换图表品种`、`:129 搜索弹窗加号模式只加入列表` 两条首行调用；行形状只给消费端 `stockInstrument`（`src/data/sources/eastmoney.ts:117-146`）真正读取的 `{Code, Name, MktNum, Classify, SecurityTypeName}`。**桩的承重证明刻意不靠「撤桩即红」**：撤桩（正则删两处调用，md5 `e2cc7e2e…` ≠ 基线）⇒ **2 passed（17.5s）**，真实端点当下可达，故「断网必红」不能由撤桩自证；改跑两条正向探针——**P3a** 桩内 Code 换位（601318→601319、002594→002595）⇒ **2 failed** 于 `option /601318/`、`/002594/`；**P4** 调用点不动、把桩体 `fulfill` 换成 `route.abort()` ⇒ **2 failed** 同两处，独立复现「端点不可达 ⇒ 零候选 ⇒ 无兜底」。P2 与 P4 合读即本条真实收益：**今天的绿不变，断网时的红被消除**。另有一条「键换位使命中变空」的探针**未落地**（perl 模式漏了 `[{`，md5 与基线一致 ⇒ 当场弃读），其要考察的 `input` 查表由 P3a 顺带覆盖。代价照登：「真实联想命中质量」这一维度被永久移出测试面；残留外网前提=切换后的 K 线与批量报价仍走真实源。README 基线行的「外网依赖已切断」已按本次交付改写。
- **D11 裁决回写（2026-10-16，用户取 (a) 不限制、口径入册）**：三项与「未来」相关的现状**全部维持不改**，零代码、零像素、零新基线——`coords.ts` 因此**不需要**开 `replayIndex` 可达口（本批唯一的引擎侧排期依据随之取消）。两条已知语义按用户要求写入 `docs/SPEC-TV-ALIGNMENT.md` 的已知偏差表：① **回放中游标之右可落笔、线锚点可落在未揭示 bar 上，且强磁吸会把线吸附到用户此刻看不到的 OHLC** ⇒ 存在**未来价泄漏**，用户可能在未见价格上完成锚定，这是被接受的语义而非缺陷；② **回放中右键下单浮窗的时刻取当前游标那根 bar，不取点击处那一根**（`InputController.ts:305-306` `barAt(replayIndex)`）。取证一侧的对应关系不动：`tests/e2e/replay-drawing.spec.ts` 6 例仍是这三条现状的被测承重（裁决 (a) 不改变任何断言，只把「是否期望」从待裁变为已裁），变异 H 的「4/6 失败」读数保留为「若日后改判为限制，这是行为改判而非文案改动」的档案。


## 3. 结转「明确不做」（不得无故重提）

三期 §3 的 7 条与「能力边界转正」5 条**全部原样结转**（完整文本见 `docs/PLAN-PHASE3.md` §3）：完整回测引擎、16 格布局、400+ 指标全量、警报服务端投递、符号搜索描述/交易所前缀全量、MTF（D4）、图表设置「事件」页。D1=档 0 且重评入口已关闭这一前提对本期同样成立——**凡前提含「服务端 / 付费源 / 运维」的候选项，本期默认不做**，aggTrades 那行 OPEN 的解锁条件（本网络能直连）不变。

本期新增建议不做（取证后判定，仍需裁确认）：**滚轮手感微调**（`PanZoomGesture.ts:176-178` 固定 `factor = 1.1 / 0.9`）——主观项、无仓内可验证判据，改它无法用黄金面或单测证明「更好」。

## 4. 决策点（D7 / D10 / D11 已裁并落档，D8 / D9 / D12 仍 OPEN）

| ID | 问题 | 选项 | 取证给出的建议 | 若不裁的后果 |
|---|---|---|---|---|
| **D7** | 四期取向 | (a) **多图表真实化**（B 批，8–11 人日）；(b) **精度长尾收口**（C+E 批，5–7.5 人日）；(c) **只做 A 批勘正后冻结** | **(b) 先行、(a) 视裁决**：B 批收益要等 B1–B4 全做完才可见，而 A 批之后「还有哪些没做」才第一次有可信清单；(b) 每批独立可验收 | **RESOLVED**（2026-10-15）= 取 **(b)**，排期 A → E1 → C；B 批本轮不排 |
| **D8** | 多格布局下的入口形态 | (a) 每格标题栏自带控件；(b) 顶栏改为「聚焦单元格驱动」；(c) 维持现状（多格=只读概览） | **(b)**：`eachChartRenderer` 与 `syncBus` 已有广播/防环底座，(a) 等于把顶栏复制 N 份且继续用原生 select | B2 无法开工；**D7 未排 B 批 ⇒ 触发条件未成立，继续 OPEN** |
| **D9** | 指标 / Pine 函数长尾目标 | (a) 冻结在 64 / 44；(b) 补到「TV 常用集」（需先定义该集合，建议 ≤15 个指标 + ≤10 个函数）；(c) 无目标持续补 | **(b) 且集合须写进本文档**：没有收口判据的长尾永远排不完，三期 §3 第 3 条正是为躲这件事才写死 | D 批整体不排（**仍 OPEN**） |
| **D10** | 手续费 / 滑点真模型 | (a) 做（费率+滑点两参数入 `tradeSettingsStore`，`paperEngine` 成交与盈亏接入）；(b) 维持不做 | **(a) 若复盘定位仍成立**：三期 B2 否掉的是「假开关」，不是「真算」；模拟交易的盈亏数字系统性偏乐观是**口径问题**而非功能问题 | **RESOLVED**（2026-10-15）= 取 **(a) 做真模型**，列为四期-E2（估 1–1.5 人日） |
| **D11** | 回放态「画在未来」是否要限制（E1 取证后新增） | (a) **不限制**，十条现状入册为已知语义；(b) **落笔钳到游标**（游标之右不给画，`InputController.ts:164-167` 前置判定）；(c) **只堵价读数**——保留落笔、但磁吸不得吸附未揭示 bar 的 OHLC（`coords.ts:54-60` 判 `index > replayIndex`），并另裁现状 10 的「浮窗时间取游标 bar」 | **取证给出的关键读数**：加钳制会让现有 6 条用例里的 **4 条**失败（变异 H），即这不是文案改动而是行为改判；三条「泄露」中只有第 6 条（强磁铁读出未来 OHLC）能让用户在未见价格上做出锚定，第 1/2/3 条属「回放中能不能画」的能力面。TV 自身允许回放中在游标之右画线（对齐表原记「回放中可继续画线/挂单」），故**本仓默认语义与 TV 一致** | 用户裁决（三选一；(b)(c) 需同时定引擎侧 additive 的 `replayIndex` 可达口，`coords.ts` 现拿不到该值） | 定形并写回 §2-E 与本行；若取 (b)/(c) 则改用例 + 新增钳制用例（估 0.5 人日，属四期-E 追加项） | **RESOLVED**（2026-10-16）= 取 **(a) 不限制，口径入册**：三条现状（游标之右可落笔 / 锚点可落未揭示 bar / 强磁吸读未展示 OHLC）维持不动，两条已知语义已写入 `docs/SPEC-TV-ALIGNMENT.md`；`coords.ts` 的 `replayIndex` 可达口**不新建**，0.5 人日追加项取消 |
| **D12** | 价格轴「+」是否要改为 TV 的**常驻**态（四期-C2 交付后新增） | (a) **维持悬停态**（当前已交付语义：光标进主价格面板的轴条才出框，离开即消失）；(b) **改常驻**（轴条上恒定挂一个「+」，位置跟最新价或固定底部，需另定「与自动按钮共存」规则） | **取证给出的读数**：(b) 不是改几行绘制，而是要把 27 面黄金截图**全部重产**——常驻框在默认视图即有像素，三期-C2 立的「默认视图零新增像素」结构证明（`visual-regression.spec.ts` 五处 pointer 坐标全在 x < 1216 的图表区内）随之失效；且常驻后「+」与「自动」按钮同处 64px 轴条居中，`chartPanes.ts:60` 的让位分支从「罕见」变「每帧必判」，命中优先级需重新定形。(a) 的代价是可见性弱于 TV（用户不知该入口存在），但对齐表原记的「跟随光标」本身就是 TV 的一种形态 | **仍 OPEN**：C2 已按 (a) 交付并可验收，(b) 属独立改判 ⇒ 不裁不阻塞 C3–C5；若裁 (b) 需重基线流程 + 该面评审记录（估 0.5–1 人日，属四期-C 追加项） |

## 5. 排期与依赖

| 批次 | 人日（估） | 依赖 | 出口判据 |
|---|---|---|---|
| 四期-A | 1–1.5 | 无 | **三项全部达成（2026-10-15，批次收口）**：15 行过期结论带出处标注（A1：UI 15 行 + FEATURE 2 行 = 17 行，未核实行在抬头写明「本轮未复核」）；`npm run check:bundle` 进 `verify`（A2）；OPEN 机制行关闭并附 46 变体实验数据 + 一条禁写法口径（A3） |
| 四期-E1 | 0.5–1 | 无 | **已达成（2026-10-15）**：`tests/e2e/replay-drawing.spec.ts` 6 例 / 44 断言 + 8 项变异 + 1 项 tripwire 量化；E2E **67 → 73 例** `--retries=0` 全绿、27 面黄金零 diff；十条现状与两处探针自纠见 §2-E 的 E1 交付记录。**后继 = D11：已于 2026-10-16 裁为 (a) 不限制、口径入册（RESOLVED）**；用例侧同日复跑自纠一条对照（见上「E1 用例自纠」）——**该自纠的判读同日又被 E1d 推翻并重新交付**：根因是像素采样未夹带（默认画线色与主题跌色同值 + 最新价虚线常驻），非 sleep；同批另交付 **E1c**（符号搜索两条用例改走 `stubStockSuggest` 固定桩，用户裁决「现在打桩」）与 **E1d**（`columnRows(..., band)` 夹带口径）。三条探针（M-A/M-B/M-C）+ 桩探针（P2/P3a/P4）读数齐见 §2-E 后两条与 `docs/decisions/OPEN-DECISIONS.md` 2026-10-16 的勘正行。当前用例侧口径：**整串 73 passed（exit 0）+ `--repeat-each=4` 该文件 24 passed**|
| 四期-C | 4–6 | 无（C1/C5 需黄金面重基线流程） | §1.3 表逐条处置或明确不做；像素项有新基线评审记录。**进度（2026-10-16）**：C1a 刻度密度已交付——7 项变异复证（每项带落地行号 + 失败用例全名）、爆炸半径实测 1/27 面（⑥ 副图标签 9→4，Playwright 15,038 px / ratio 0.02 超 0.01 容差 ⇒ 增量重基线，其余 26 面零 diff 未重产）、新增 `tests/unit/price-tick-density.test.ts` 8 例；C1b 轴宽单向自适应**已量化待重裁**（3–4 人日 + 一条闭环，唯一可达溢出路径是 `watchlistPersist.ts:39-41` 无上限的 decimals）——**同日重裁取 (b) 并已交付 C1b'**：入口 `decimalsFor` 钳位（上限 `MAX_PRICE_DECIMALS = 8` / 下限 0，`src/data/format.ts:45,54`），轴宽维持 64、自适应登记为不实施，4 条变异 + 5 例新单测见 §2-C 的 C1b' 交付记录，残留边界入 `SPEC-TV-ALIGNMENT` §12；**同日 C2 价格轴「+」入口已交付**（几何单一来源纯函数 `chartPanes.ts:60` 供绘制/命中/光标三处、additive `setPriceScaleAlertCallback` 复用三期-B4 对话框、5 项变异 + 9 例单测 + 4 例 E2E、27 面零 diff 未重产，见「C2 交付记录」；TV 常驻态登记为待裁 **D12**）；余 **C3–C5** 待做 |
| 四期-E2 | 1–1.5 | **已裁（D10 = 做）** | 盈亏数字含费口径入册；设置项与计算接入有变异测试支撑 |
| 四期-B | 8–11 | **D7 已裁「本轮不排」⇒ 整批封存**；未来重排时须先裁 D8 | （封存）六条证据逐条消除；`PLAN-PHASE3.md:158`③ 与 `:188`④⑤ 登记就地关闭 |
| 四期-D | 待 D9 | **D9（仍 OPEN）** | 集合定义 + 计数达标，或写死「冻结在 64/44」 |

排期（**2026-10-15 D7 裁决后**）：**A → E1 → C → E2**（估 6.5–10 人日）。A 必须先做：它决定后续每一批的排期依据是否可信。B 批不在本期路径上，其六条证据见 §1.2，重排时无需重新取证。

## 6. 门禁口径（延续三期 + 本期新增）

基线（2026-10-15 三期-EF 交付复跑，README:81）：typecheck 0 错 / oxlint 389 文件 **0 错 0 警告** / format:check 绿 / 单测 **93 文件 1509 例** / 全量 `npm run verify` 绿；E2E **67 例** `--retries=0` 全绿 + **27 面黄金截图零 diff**；build 应用块 **518.04 kB / gzip 148.49 kB**（560 档余 41.96 kB、gzip 160 档余 11.51 kB）。

本期新增两条口径：**① `npm run check:bundle` 承载 gzip 上限 160 kB**（A2，**已交付 2026-10-15**——脚本 + `verify` 链尾；交付复跑：typecheck 0 / oxlint **390 文件** 0 错 0 警告 / format:check 绿 / 单测 93 文件 1509 例 / build 应用块 518.04 kB（Vite 报 gzip 148.49 kB、脚本 zlib 口径 147.61 kB、裕度 12.39 kB）/ E2E **67 passed** `--retries=0` + 27 面黄金零 diff（本批零 `src/` 改动，像素中性）；承重由四条副本探针证明，见 §2-A 的 A2 交付记录）；**② 多图表新增 E2E 面必须离线确定化**（B1 硬约束，禁 `test.skip`、禁真实网络——随 B 批封存，本期不生效）。

**E1 交付后基线改数（2026-10-15，见 §2-E 的 E1 交付记录）**：E2E **67 → 73 例**（新增 `replay-drawing.spec.ts` 6 例）、oxlint **390 → 391 文件**（+1 = 该用例文件）；单测维持 **93 文件 1509 例**（本批零新增单测）；build 应用块 **518.12 kB / 脚本口径 gzip 147.62 kB**（裕度 12.38 kB）、27 面黄金截图零 diff 仍成立 ⇒ 本批的 `src/` 改动（磁吸档下发链）对像素中性。README 基线段同批同步。

其余纪律不变：`git add <显式路径>`、一批 1–2 提交且提交信息带批次号、`docs/` 与 `*.md` 不进 Prettier、OPEN-DECISIONS 只追加 + 就地关闭、引擎公开 API 只做 additive、`src/engine/**` 不 import React/zustand、每条「已交付 / 行为中性」论断须有删除探针或变异测试支撑，且**先证明探针落地再解读结果**。
