# 四期开发规划（PLAN-PHASE4）

> 状态：**草案，未开工**。§4 四个决策点（D7 取向 / D8 多图表入口形态 / D9 内容长尾目标 / D10 手续费真模型）待用户裁决；裁决前不写任何功能代码。
> 取证日期：2026-10-15。前置：三期（含 2026-10-15 的 E/F 重排批次）已按 `docs/PLAN-PHASE3.md` §5「三期收口判据」全部满足，本期候选范围只能来自新的四处，逐项实读核实。
> **取证纪律（沿用三期）**：本轮**不沿用任何审计文档的行号**——每条「现状」论断由本轮重新执行 Read/Grep 得出，出处为 `路径:行号`。两份 AUDIT 表写于 2026-09-28，其间历经二期收尾、三期 A–F 与多次清偿批次，**多数 P1/P2 行已过期**（见 §1.1），这本身是本期第一个交付物。

## 0. 定位与取证来源

| 来源 | 内容 | 核实方式 |
|---|---|---|
| `docs/AUDIT-TV-UI-GAP.md` / `docs/AUDIT-TV-FEATURE-GAP.md` | 复刻差距表——但行级结论已大面积过期 | 逐行重读原差距描述 → 到代码里找该行为的当前实现处 |
| `docs/PLAN-PHASE3.md` 各批次「**登记（非遗漏）**」清单 | 交付时显式让路的边界（B0 ②、B2 ③、B3 ④⑤ 三处同一主题） | 逐条回读 + 到代码核实边界是否仍成立 |
| 源码内「待分化 / 属后续增强」注释 | 唯一的仓内 TODO 型自认（`theme.ts:72,103`） | Grep + 读消费点 |
| `docs/decisions/OPEN-DECISIONS.md` 仍 OPEN 的两行 | aggTrades 精确 delta、oxlint 指令抑制半径机制 | 全文 59 行逐行核对状态列 |

## 1. 本轮重新查阅的四个结论

### 1.1 结论一：两份审计表的 P1/P2 行大面积过期——**抽验 15 行，13 行整行已交付、2 行只剩小尾巴**

这不是坏消息，而是**排期基线失真**：如果照审计表排四期，会把 13 件已完成的事重新排一遍。逐条核实结果：

| 审计行 | 原差距（`AUDIT-TV-UI-GAP`） | 现状（本轮实读出处） | 判定 |
|---|---|---|---|
| :24 十字光标价格标签 `9999` 魔数 | 应改面板高度钳制 | `crosshairOverlay.ts:48` `maxY: paneY + paneHeight - 18` | **已交付** |
| :25 **悬停副图时价格标签用主轴刻度（P1 功能错误）** | 需按命中面板传对应 priceScale | `RenderPipeline.ts:221-232` 传 `hoveredPane.priceScale` + `hoveredPane.y` | **已交付** |
| :26 时间标签右边界无钳制 | 溢出画布 | `crosshairOverlay.ts:57` `maxX` + `:86` `Math.min(bx, bounds.maxX - w)` | **已交付** |
| :29 图例市场状态圆点 | 无开闭市圆点 | `drawLegend.ts:62-63`（圆点）+ `RenderPipeline.ts:241`（`isMarketOpen` 每帧算）+ `marketHours.ts:41-47` | **已交付**（该行的「日涨跌」另一半仍缺，见 §1.3） |
| :30 价格轴标签左对齐贴分隔线（**P1**） | TV 右对齐贴轴右缘 | `drawAxes.ts:89`、`:217` `textAlign = pos === 'left' ? 'left' : 'right'` | **已交付** |
| :36 图表右键菜单仅 5 项（**P1**） | 缺 9 项 | `ChartContextMenu.tsx:111,118,125,133,147,164,177,189,200,210,221,230` 共 12 项 | **已交付**（差 2 项属 TV 独有子菜单，见 §1.3） |
| :37 右键警报无对话框（**P1**） | 直接建两条警报 | `ChartContextMenu.tsx:251-322` 价格预填 + 条件选择的警报对话框 | **已交付** |
| :41 无快捷键面板（**P1**） | 散落无出处 | `src/features/settings/ShortcutsDialog.tsx` 存在（132 行处有用例样式） | **已交付** |
| :42 缺 Alt+A/R/L/P/W（**P1**） | 高频快捷键缺 | `useTvShortcuts.ts:123-151`：a / w / n / r / l / p / s / d / g / Enter 全覆盖 | **已交付** |
| :45 对话框无动效 | Radix 默认无动画 | `global.css:60-62` `.tv-dialog[data-state='closed']` + 对应 open 关键帧 | **已交付** |
| :50 首次加载画布全空白（**P1**） | 无任何反馈 | `ChartWorkspace.tsx:232`（`idle/loading/reconnecting` 三态覆盖层） | **已交付** |
| :52 无全局 Toast | `zIndex.toast` 预留但无组件 | `src/features/ui/Toast.tsx` + `toastModel.ts`，消费点 `ChartContextMenu.tsx:81,152,289` | **已交付** |
| :57 阴影仅一个 token（**P1**） | 需 flat/ring/raised | `tokens.ts:67-76` 四档（tooltip/popover/menu/modal）；残留硬编码仅 **1 处** `ChartOrderMenu.tsx:148`（值与 `shadow.menu` 逐字相同） | **已交付**（残留归 §2-C4 的微项） |
| :60 底栏缺预设条/齿轮/导航（**P1**） | 仅 UTC + 三个开关 | `StatusBar.tsx:34-42` `RANGES` 八档预设条、`:26-29` control_bar 导航组、`:22` 底部齿轮 | **已交付** |
| `AUDIT-TV-FEATURE-GAP`:84 Session VP 时间分段 | 无 | `volumeProfile.ts:18,55` `mode: 'range' \| 'session'` + `PaneRenderer.ts:122` 分发 | **已交付**（二期-G） |

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

三期登记表里同一条边界出现三次却三次都写「另立项」——本轮把它升级为**本期唯一的大批次**（四期-B），因为它是一次改造能顺带关闭三处登记的那种缺口。

**E2E 风险实查（决定该批次真实成本）**：`tests/e2e/harness/visual-harness.ts:194-197` 的 `setLayout(2)` 走 harness 自有 `mountCell`，**不经 React `ChartCell`** ⇒ 黄金面 ⑨ `layout-2-grid` 对 B 批次结构性免疫（与 `aggregatePath` 那批的「harness 路径结构性豁免」同一形态，见 `docs/PLAN-TECH-DEBT-CLOSEOUT.md` §3.1）。真正的成本在另一处：**单元格一旦接真实数据链路，E2E 就必须继续离线确定化**（README:81 已把「外网依赖已切断、67 例 `--retries=0` 零失败」立为基线），否则新增的多图面会立刻把基线打回 flaky。这条约束写进 B1 的验收，不许用 `test.skip` 绕。

### 1.3 结论三：其余缺口是分散的复刻精度长尾（每条都小，合计不小）

| 审计行 | 差距 | 现状出处 | 量级 |
|---|---|---|---|
| UI:29 后半 | 图例涨跌是**单根** `close-open`（`drawLegend.ts:84-96`），非日内周期的「最后一日变化值」；底栏有 `dayChangePct`（`StatusBar.tsx:12`、渲染分支 `:113-117`）而图例无 | 两处口径并存 | 0.5 |
| UI:31 | 价格轴固定宽（`AXIS_WIDTH = 64`，`chartPanes.ts:6`），长价/低价数字余量不均 | 三期-B5 只收敛了魔数，自适应未做 | 1 |
| UI:33 | 刻度密度固定 6 条（`drawAxes.ts:29,93`；`PriceScale.ts:112` `ticks(targetCount = 6)`），不随面板高度变 | 面板高度已可得（`pane.height`） | 0.5 |
| UI:35 | 价格轴无「+」快捷入口：轴区唯一命中件是「自动」按钮（`PaneRenderer.ts:192-210` 绘、`PanZoomGesture.ts:106` 命中） | 需引擎 additive 命中件 + 回调 | 1 |
| UI:40 | 画线右键缺「设为默认」——全仓 `设为默认\|setAsDefault` **0 命中** | `DrawingContextMenu.tsx` 现有设置/复制/粘贴/锁定/克隆/移除/视觉顺序 | 0.5 |
| UI:47 | flyout 展开时主按钮不高亮：`DrawingToolButton.tsx:59` 底色三元只看 `active`/`hovered`，`open` 只用于 caret（`:71,75,100`） | 一行表达式 | 0.25 |
| UI:48 | `IconButton`（`primitives.tsx:112-142`）props 仅 `active/onClick/title/children`，**无 disabled/loading** | 顶栏按钮态缺两态 | 0.5 |
| UI:59 | 原生 `<select>` 仍 **7 处**（`ChartCell.tsx:109,121,133`、`ChartContextMenu.tsx:313`、`PineEditorPanel.tsx:69,86`、`ReplayBar.tsx:198`）；checkbox 已 TV 化（`controls.tsx:137,174`） | `ToolbarSelect` 可复用 | 1 |
| UI:53 | 「两处 tooltip 底色不一致」需**重新表述而非修复**：引擎 `tooltipBg` 现只服务十字光标轴标签（唯一消费点 `crosshairOverlay.ts:88`），与 UI tooltip 是两个表面 | 审计表的同因归并错了 | 0.25（改文档） |
| UI:54 | 浅色 `--elevated:#e0e3eb` 与 `--border:#e0e3eb` 同值（`global.css:125` vs `:141`），消费点 `WatchlistRow.tsx:189` | 层次弱 | 0.25 |
| — | `theme.infoLabelBg` **两主题同值 `#2a2e39`**，代码自注「浅色主题待分化」（`theme.ts:72`、`:103`），消费点 `measureRender.ts:49`、`textRender.ts:182` | 仓内唯一 TODO 型自认 | 0.5 |
| UI:62 | 字重四档并存（400 / 500 / 600 / `<strong>`700；实测 500 仅 1 处、600 共 5 处） | 收敛为三档 | 0.5 |

### 1.4 结论四：两处「已知边界」登记已不成立，应就地勘正

| 登记处 | 原文 | 本轮反证 |
|---|---|---|
| `OPEN-DECISIONS.md` 2026-09-29 AVWAP 行 Resolution 末句 | 「已知边界：图表重挂需重新落点」 | `useChartCommands.ts:85` 下发含 `params: des.params`，`Chart.tsx:216-222` 落锚写回 store——**重建/布局切换不丢锚的链路双向都在** |
| `SPEC-PHASE1-CLOSEOUT.md:67` 已知边界「对比仅最近 500 根」 | 一次性 500 根、无翻页 | `compareModel.ts:26` `COMPARE_LIMIT` 是**每页**量，`:123-131` 已实现 `barsBefore` 向左翻页 + `ChartWorkspace.tsx:79` 主图左缘联动。**同行「多图表无 Compare」仍成立**（`TopBar.tsx:192`） |

## 2. 批次划分

### 四期-A · 审计勘正 + 口径机械承载（1–1.5 人日，零功能变更）

| 项 | 现状 | 动作 | 验收 |
|---|---|---|---|
| A1 两份 AUDIT 过期行标注 | §1.1 的 15 行（含 §1.3 的 :53 表述错位） | 在**审计文档就地加标注**（「2026-10-15 复核：已交付，出处 `路径:行号`」），不改写原文 | 表内每行都有出处；`format:check` 天然绿（docs 排除 Prettier） |
| A2 gzip 口径脚本化 | `package.json:6-21` 无体积类命令，`.github/workflows/deploy.yml` 只跑 verify + build——**该口径没有任何机械承载**（README:137 已自认：触线不会让任何命令变红） | 加 `npm run check:bundle`：读 `dist` 最大应用块 gzip，超 **160 kB** 退出非零；现值 148.49 kB 作为登记基线写进注释 | 门禁多一条红线；提阈值=改一个常量，与 `chunkSizeWarningLimit` 同一「提阈值而非关闭」哲学 |
| A3 oxlint 抑制半径机制 | OPEN 行（2026-10-12）：机制未证实，只登记了观测事实 | 用**副本配置**（`.oxlintrc.probe.json` + `-c`，禁改活配置）做受控实验，把「未证实」变成「已证实/已否证」，只出结论不改代码 | 该 OPEN 行关闭（附实验数据），或改为「已知不可控 → 永久禁用该写法」 |

### 四期-B · 多图表真实化（**8–11 人日，估**；依赖 D7 裁决，不裁则整批不排）

| 项 | 动作 | 人日 | 风险与护栏 |
|---|---|---|---|
| B1 单元格真实数据链路 | `useChartSeries` 下沉为 per-cell（cell 持 `symbol/timeframe/chartType` 已在 `layoutStore`）；`generateSeededMockBars` 保留为**降级路径**而非默认；E2E 侧必须走已有的确定化口子 | 2.5–3.5 | 最大风险是网络依赖进 E2E。护栏：新增面全部走 mock/seed 注入，禁 `test.skip`；黄金面结构性免疫（§1.2 实查），故 27 面零 diff 仍须成立 |
| B2 入口随布局形态 | 周期 / 类型 / 回放 / 撤销重做 / 重载在多格布局下要么进单元格标题栏，要么改为「聚焦单元格驱动顶栏」（**形态待裁 D8**） | 2–3 | 与 B1 同批交付才有意义；`ChartCell.tsx:109-133` 三个原生 select 顺带收敛（§1.3 的 UI:59） |
| B3 偏好广播到全部 renderer | 下发链从「`ChartSettingsDialog` 单点写主图」改为 renderer 注册表广播（注册表已存在——`eachChartRenderer`，`useTvShortcuts.ts:134` 在用） | 1.5–2 | 顺带关闭 `PLAN-PHASE3.md:158` ③ 与 `:188` ④ 两条登记；须证明「新增一格时被同帧播种」而非只改已有格 |
| B4 右轨 / 警报按聚焦格 | 数据窗口与对象树（`RightSide.tsx:97,99`）改读聚焦单元格 renderer；`useAlertWatcher`（`App.tsx:71`）扩为按可见品种集合采样 | 2–2.5 | 警报扩围会改触发语义（一格品种也能触发主图警报），属**用户可见语义变更**，须先裁 |
| B5（可选）偏好进布局快照 | `layoutSnapshot.ts:232` 起 `captureSnapshot` 仍不含任何显示偏好（三期 B0 登记 ② 原样保留） | 0.5–1 | 与 D7 挂钩：D7 若不选「多图表真实化」，B5 无意义 |

### 四期-C · 复刻精度长尾（4–6 人日，可逐条拆、逐条独立验收）

按 §1.3 表逐项做，顺序建议：**C1** 刻度密度 + 轴宽自适应（1.5，动 `drawAxes.ts:29,93` / `chartPanes.ts:6`）→ **C2** 价格轴「+」入口（1，引擎 additive）→ **C3** 画线「设为默认」+ flyout 高亮 + 多边形顶点增（1，`ObjectTree.tsx:227` 现仅计数标签）→ **C4** `IconButton` 两态 + 原生 select 7 处收敛 + 阴影残留 1 处（1）→ **C5** 主题层次三微项（`--elevated` / `infoLabelBg` 浅色分化 / 字重收敛，1）。
**硬约束**：C1 与 C5 会动像素——黄金面 ⑩（轴特写）、②（浅色默认视图）、㉗（测量浮层）直接覆盖这三处，改前必须先确认「新基线单独评审」流程（`visual-regression.spec.ts:222-226` 的反作弊门禁注释）。

### 四期-D · 内容长尾（**目标口径待裁 D9，不排人日**）

实读计数：内置指标 **64** 个 id（`src/indicators/builtin/*.ts` 合计）、Pine 函数表 **44** 个唯一名（`ta-overlap` 19 + `ta-momentum` 16 + `ta-math` 10，去重后 44）。审计表原记「63 / 100+」「32 / 100+」，两处分子分母都已过期。三期 §3 第 3 条已写死「400+ 内置指标全量不做」，所以**继续补必须有新目标口径**（补到「TV 常用集」还是就此冻结），否则长尾没有收口判据。

### 四期-E · 回放 / 交易语义小项（1–1.5 人日）

| 项 | 现状 | 动作 |
|---|---|---|
| E1 回放中画线 | `AUDIT-TV-FEATURE-GAP:128` 原记「回放中画线未验证（理论上引擎未禁用，需 E2E 验证）」——同行前半「倍速表扩到 TV 同档」已随三期-E1 交付（`replayStore.ts:59` `[1,2,4,8]`），该行仅剩画线这一半。本轮核实：`InputController.ts:299-307` 回放态右键被**下单浮窗**占用、`:301-302` 命中画线时不弹；E2E 侧 `grep 回放` 只有 4 例（`smoke.spec.ts:121,161`、`interactions.spec.ts:290`、`settings.spec.ts:266`），**无一覆盖画线** | 补 E2E 用例把「回放中能不能画、画在游标左还是右、未来 bar 上画线会怎样」钉成被测事实，再决定要不要限制 |
| E2 手续费 / 滑点 | `grep fee\|commission\|slip` 在 `src/features/trading/*.ts` **0 命中**——`paperEngine` 至今无此概念。三期 B2 的裁决理由是「加了只能是假开关」（`PLAN-PHASE3.md:158` ①），该理由针对的是「只做显隐开关」；**真模型不是假开关**，故边界需重裁（D10） | 待裁；若做则为 `tradeSettingsStore` 加费率/滑点两字段 + `paperEngine` 成交与盈亏计算接入 + 报告口径标注 |

## 3. 结转「明确不做」（不得无故重提）

三期 §3 的 7 条与「能力边界转正」5 条**全部原样结转**（完整文本见 `docs/PLAN-PHASE3.md` §3）：完整回测引擎、16 格布局、400+ 指标全量、警报服务端投递、符号搜索描述/交易所前缀全量、MTF（D4）、图表设置「事件」页。D1=档 0 且重评入口已关闭这一前提对本期同样成立——**凡前提含「服务端 / 付费源 / 运维」的候选项，本期默认不做**，aggTrades 那行 OPEN 的解锁条件（本网络能直连）不变。

本期新增建议不做（取证后判定，仍需裁确认）：**滚轮手感微调**（`PanZoomGesture.ts:176-178` 固定 `factor = 1.1 / 0.9`）——主观项、无仓内可验证判据，改它无法用黄金面或单测证明「更好」。

## 4. 决策点（全部 OPEN，待裁决）

| ID | 问题 | 选项 | 取证给出的建议 | 若不裁的后果 |
|---|---|---|---|---|
| **D7** | 四期取向 | (a) **多图表真实化**（B 批，8–11 人日）；(b) **精度长尾收口**（C+E 批，5–7.5 人日）；(c) **只做 A 批勘正后冻结** | **(b) 先行、(a) 视裁决**：B 批收益要等 B1–B4 全做完才可见，而 A 批之后「还有哪些没做」才第一次有可信清单；(b) 每批独立可验收 | B/C 都不排，项目停在「单图深、多图假」的状态 |
| **D8** | 多格布局下的入口形态 | (a) 每格标题栏自带控件；(b) 顶栏改为「聚焦单元格驱动」；(c) 维持现状（多格=只读概览） | **(b)**：`eachChartRenderer` 与 `syncBus` 已有广播/防环底座，(a) 等于把顶栏复制 N 份且继续用原生 select | B2 无法开工 |
| **D9** | 指标 / Pine 函数长尾目标 | (a) 冻结在 64 / 44；(b) 补到「TV 常用集」（需先定义该集合，建议 ≤15 个指标 + ≤10 个函数）；(c) 无目标持续补 | **(b) 且集合须写进本文档**：没有收口判据的长尾永远排不完，三期 §3 第 3 条正是为躲这件事才写死 | D 批整体不排 |
| **D10** | 手续费 / 滑点真模型 | (a) 做（费率+滑点两参数入 `tradeSettingsStore`，`paperEngine` 成交与盈亏接入）；(b) 维持不做 | **(a) 若复盘定位仍成立**：三期 B2 否掉的是「假开关」，不是「真算」；模拟交易的盈亏数字系统性偏乐观是**口径问题**而非功能问题 | E2 不排 |

## 5. 排期与依赖

| 批次 | 人日（估） | 依赖 | 出口判据 |
|---|---|---|---|
| 四期-A | 1–1.5 | 无 | 15 行过期结论全部带出处标注；`npm run check:bundle` 进 `verify`；OPEN 机制行关闭 |
| 四期-E1 | 0.5–1 | 无 | 「回放中画线」成为被测事实（E2E 例数增加、`--retries=0` 全绿） |
| 四期-C | 4–6 | 无（C1/C5 需黄金面重基线流程） | §1.3 表逐条处置或明确不做；像素项有新基线评审记录 |
| 四期-B | 8–11 | **D7 + D8** | 六条证据逐条消除；`PLAN-PHASE3.md:158`③ 与 `:188`④⑤ 登记就地关闭 |
| 四期-D | 待 D9 | **D9** | 集合定义 + 计数达标，或写死「冻结在 64/44」 |
| 四期-E2 | 待 D10（估 1–1.5） | **D10** | 盈亏数字含费口径入册 |

建议串行：**A → E1 → C →（B 待裁）**。A 必须先做：它决定后续每一批的排期依据是否可信。

## 6. 门禁口径（延续三期 + 本期新增）

基线（2026-10-15 三期-EF 交付复跑，README:81）：typecheck 0 错 / oxlint 389 文件 **0 错 0 警告** / format:check 绿 / 单测 **93 文件 1509 例** / 全量 `npm run verify` 绿；E2E **67 例** `--retries=0` 全绿 + **27 面黄金截图零 diff**；build 应用块 **518.04 kB / gzip 148.49 kB**（560 档余 41.96 kB、gzip 160 档余 11.51 kB）。

本期新增两条口径：**① `npm run check:bundle` 承载 gzip 上限 160 kB**（A2，把「只活在注释里」的口径变红得起）；**② 多图表新增 E2E 面必须离线确定化**（B1 硬约束，禁 `test.skip`、禁真实网络）。

其余纪律不变：`git add <显式路径>`、一批 1–2 提交且提交信息带批次号、`docs/` 与 `*.md` 不进 Prettier、OPEN-DECISIONS 只追加 + 就地关闭、引擎公开 API 只做 additive、`src/engine/**` 不 import React/zustand、每条「已交付 / 行为中性」论断须有删除探针或变异测试支撑，且**先证明探针落地再解读结果**。
