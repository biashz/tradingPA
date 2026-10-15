# 四期开发规划（PLAN-PHASE4）

> 状态：**已裁决取向，开工中（四期-A）**。§4 四个决策点里 **D7（取向 = 先 A+E1，再走 C 长尾）与 D10（手续费/滑点 = 做真模型）已由用户于 2026-10-15 裁决**，落档见 `docs/decisions/OPEN-DECISIONS.md` 对应两行；**D8（多格入口形态）因 D7 未排 B 批而触发条件未成立、继续 OPEN**，**D9（内容长尾目标）仍待裁**——D9 裁决前不排四期-D，其余批次可按 §5 排期推进。
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

**E2E 风险实查（决定该批次真实成本）**：`tests/e2e/harness/visual-harness.ts:194-197` 的 `setLayout(2)` 走 harness 自有 `mountCell`，**不经 React `ChartCell`** ⇒ 黄金面 ⑨ `layout-2-grid` 对 B 批次结构性免疫（与 `aggregatePath` 那批的「harness 路径结构性豁免」同一形态，见 `docs/PLAN-TECH-DEBT-CLOSEOUT.md` §3.1）。真正的成本在另一处：**单元格一旦接真实数据链路，E2E 就必须继续离线确定化**（README:81 已把「外网依赖已切断、67 例 `--retries=0` 零失败」立为基线），否则新增的多图面会立刻把基线打回 flaky。这条约束写进 B1 的验收，不许用 `test.skip` 绕。

### 1.3 结论三：其余缺口是分散的复刻精度长尾（每条都小，合计不小）

| 审计行（UI 区域） | 差距 | 现状出处 | 量级 |
|---|---|---|---|
| 图例·状态点/日涨跌 后半 | 图例涨跌是**单根** `close-open`（`src/engine/renderer/drawLegend.ts:84-96`），非日内周期的「最后一日变化值」；底栏有 `dayChangePct`（`src/features/market/StatusBar.tsx:12`、渲染分支 `:113-117`）而图例无 | 两处口径并存 | 0.5 |
| 价格轴·宽度 | 价格轴固定宽（`AXIS_WIDTH = 64`，`src/engine/renderer/chartPanes.ts:6`），长价/低价数字余量不均 | 三期-B5 只收敛了魔数，自适应未做 | 1 |
| 刻度密度 | 固定 6 条（`drawAxes.ts:29`、`:93`；`src/engine/scale/PriceScale.ts:112` `ticks(targetCount = 6)`），不随面板高度变 | 面板高度已可得（`pane.height`） | 0.5 |
| 价格轴·快捷入口 | 无「+」：轴区唯一命中件是「自动」按钮（`PaneRenderer.ts:192-210` 绘、`PanZoomGesture.ts:106` 命中） | 需引擎 additive 命中件 + 回调 | 1 |
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

按 §1.3 表逐项做，顺序建议：**C1** 刻度密度 + 轴宽自适应（1.5，动 `drawAxes.ts:29,93` / `chartPanes.ts:6`）→ **C2** 价格轴「+」入口（1，引擎 additive）→ **C3** 画线「设为默认」+ flyout 高亮 + 多边形顶点增（1，`ObjectTree.tsx:227` 现仅计数标签）→ **C4** `IconButton` 两态 + 原生 select 7 处收敛 + 阴影残留 1 处（1）→ **C5** 主题层次三微项（`--elevated` / `infoLabelBg` 浅色分化 / 字重收敛，1）。
**硬约束**：C1 与 C5 会动像素——黄金面 ⑩（轴特写）、②（浅色默认视图）、㉗（测量浮层）直接覆盖这三处，改前必须先确认「新基线单独评审」流程（`visual-regression.spec.ts:222-226` 的反作弊门禁注释）。

### 四期-D · 内容长尾（**目标口径待裁 D9，不排人日**）

实读计数：内置指标 **64** 个 id（`src/indicators/builtin/*.ts` 合计）、Pine 函数表 **44** 个唯一名（`ta-overlap` 19 + `ta-momentum` 16 + `ta-math` 10，去重后 44）。审计表原记「63 / 100+」「32 / 100+」，两处分子分母都已过期。三期 §3 第 3 条已写死「400+ 内置指标全量不做」，所以**继续补必须有新目标口径**（补到「TV 常用集」还是就此冻结），否则长尾没有收口判据。

### 四期-E · 回放 / 交易语义小项（1–1.5 人日）

| 项 | 现状 | 动作 |
|---|---|---|
| E1 回放中画线 | `AUDIT-TV-FEATURE-GAP:128` 原记「回放中画线未验证（理论上引擎未禁用，需 E2E 验证）」——同行前半「倍速表扩到 TV 同档」已随三期-E1 交付（`replayStore.ts:59` `[1,2,4,8]`），该行仅剩画线这一半。本轮核实：`InputController.ts:299-307` 回放态右键被**下单浮窗**占用、`:301-302` 命中画线时不弹；E2E 侧 `grep 回放` 只有 4 例（`smoke.spec.ts:121,161`、`interactions.spec.ts:290`、`settings.spec.ts:266`），**无一覆盖画线** | 补 E2E 用例把「回放中能不能画、画在游标左还是右、未来 bar 上画线会怎样」钉成被测事实，再决定要不要限制 |
| E2 手续费 / 滑点 | `grep fee\|commission\|slip` 在 `src/features/trading/*.ts` **0 命中**——`paperEngine` 至今无此概念。三期 B2 的裁决理由是「加了只能是假开关」（`PLAN-PHASE3.md:158` ①），该理由针对的是「只做显隐开关」；**真模型不是假开关**，故边界需重裁（D10） | **已裁做**（2026-10-15 D10 = 真模型）：`tradeSettingsStore` 加费率/滑点两字段（走既有 `tradingpa.tradeSettings.v1` 落盘键，additive）+ `paperEngine` 成交与盈亏计算真的接入 + `SummaryReport` 标注含费口径。**开工前先核两点**（本行登记时未取证）：`paperEngine` 的盈亏是否存在多处独立重算（若有，先单一来源化再接费）、滑点作用于成交价还是成交量的口径差异。估 1–1.5 人日，排在 C 之后 |

## 3. 结转「明确不做」（不得无故重提）

三期 §3 的 7 条与「能力边界转正」5 条**全部原样结转**（完整文本见 `docs/PLAN-PHASE3.md` §3）：完整回测引擎、16 格布局、400+ 指标全量、警报服务端投递、符号搜索描述/交易所前缀全量、MTF（D4）、图表设置「事件」页。D1=档 0 且重评入口已关闭这一前提对本期同样成立——**凡前提含「服务端 / 付费源 / 运维」的候选项，本期默认不做**，aggTrades 那行 OPEN 的解锁条件（本网络能直连）不变。

本期新增建议不做（取证后判定，仍需裁确认）：**滚轮手感微调**（`PanZoomGesture.ts:176-178` 固定 `factor = 1.1 / 0.9`）——主观项、无仓内可验证判据，改它无法用黄金面或单测证明「更好」。

## 4. 决策点（D7 / D10 已裁并落档，D8 / D9 仍 OPEN）

| ID | 问题 | 选项 | 取证给出的建议 | 若不裁的后果 |
|---|---|---|---|---|
| **D7** | 四期取向 | (a) **多图表真实化**（B 批，8–11 人日）；(b) **精度长尾收口**（C+E 批，5–7.5 人日）；(c) **只做 A 批勘正后冻结** | **(b) 先行、(a) 视裁决**：B 批收益要等 B1–B4 全做完才可见，而 A 批之后「还有哪些没做」才第一次有可信清单；(b) 每批独立可验收 | **RESOLVED**（2026-10-15）= 取 **(b)**，排期 A → E1 → C；B 批本轮不排 |
| **D8** | 多格布局下的入口形态 | (a) 每格标题栏自带控件；(b) 顶栏改为「聚焦单元格驱动」；(c) 维持现状（多格=只读概览） | **(b)**：`eachChartRenderer` 与 `syncBus` 已有广播/防环底座，(a) 等于把顶栏复制 N 份且继续用原生 select | B2 无法开工；**D7 未排 B 批 ⇒ 触发条件未成立，继续 OPEN** |
| **D9** | 指标 / Pine 函数长尾目标 | (a) 冻结在 64 / 44；(b) 补到「TV 常用集」（需先定义该集合，建议 ≤15 个指标 + ≤10 个函数）；(c) 无目标持续补 | **(b) 且集合须写进本文档**：没有收口判据的长尾永远排不完，三期 §3 第 3 条正是为躲这件事才写死 | D 批整体不排（**仍 OPEN**） |
| **D10** | 手续费 / 滑点真模型 | (a) 做（费率+滑点两参数入 `tradeSettingsStore`，`paperEngine` 成交与盈亏接入）；(b) 维持不做 | **(a) 若复盘定位仍成立**：三期 B2 否掉的是「假开关」，不是「真算」；模拟交易的盈亏数字系统性偏乐观是**口径问题**而非功能问题 | **RESOLVED**（2026-10-15）= 取 **(a) 做真模型**，列为四期-E2（估 1–1.5 人日） |

## 5. 排期与依赖

| 批次 | 人日（估） | 依赖 | 出口判据 |
|---|---|---|---|
| 四期-A | 1–1.5 | 无 | **三项全部达成（2026-10-15，批次收口）**：15 行过期结论带出处标注（A1：UI 15 行 + FEATURE 2 行 = 17 行，未核实行在抬头写明「本轮未复核」）；`npm run check:bundle` 进 `verify`（A2）；OPEN 机制行关闭并附 46 变体实验数据 + 一条禁写法口径（A3） |
| 四期-E1 | 0.5–1 | 无 | 「回放中画线」成为被测事实（E2E 例数增加、`--retries=0` 全绿） |
| 四期-C | 4–6 | 无（C1/C5 需黄金面重基线流程） | §1.3 表逐条处置或明确不做；像素项有新基线评审记录 |
| 四期-E2 | 1–1.5 | **已裁（D10 = 做）** | 盈亏数字含费口径入册；设置项与计算接入有变异测试支撑 |
| 四期-B | 8–11 | **D7 已裁「本轮不排」⇒ 整批封存**；未来重排时须先裁 D8 | （封存）六条证据逐条消除；`PLAN-PHASE3.md:158`③ 与 `:188`④⑤ 登记就地关闭 |
| 四期-D | 待 D9 | **D9（仍 OPEN）** | 集合定义 + 计数达标，或写死「冻结在 64/44」 |

排期（**2026-10-15 D7 裁决后**）：**A → E1 → C → E2**（估 6.5–10 人日）。A 必须先做：它决定后续每一批的排期依据是否可信。B 批不在本期路径上，其六条证据见 §1.2，重排时无需重新取证。

## 6. 门禁口径（延续三期 + 本期新增）

基线（2026-10-15 三期-EF 交付复跑，README:81）：typecheck 0 错 / oxlint 389 文件 **0 错 0 警告** / format:check 绿 / 单测 **93 文件 1509 例** / 全量 `npm run verify` 绿；E2E **67 例** `--retries=0` 全绿 + **27 面黄金截图零 diff**；build 应用块 **518.04 kB / gzip 148.49 kB**（560 档余 41.96 kB、gzip 160 档余 11.51 kB）。

本期新增两条口径：**① `npm run check:bundle` 承载 gzip 上限 160 kB**（A2，**已交付 2026-10-15**——脚本 + `verify` 链尾；交付复跑：typecheck 0 / oxlint **390 文件** 0 错 0 警告 / format:check 绿 / 单测 93 文件 1509 例 / build 应用块 518.04 kB（Vite 报 gzip 148.49 kB、脚本 zlib 口径 147.61 kB、裕度 12.39 kB）/ E2E **67 passed** `--retries=0` + 27 面黄金零 diff（本批零 `src/` 改动，像素中性）；承重由四条副本探针证明，见 §2-A 的 A2 交付记录）；**② 多图表新增 E2E 面必须离线确定化**（B1 硬约束，禁 `test.skip`、禁真实网络——随 B 批封存，本期不生效）。

其余纪律不变：`git add <显式路径>`、一批 1–2 提交且提交信息带批次号、`docs/` 与 `*.md` 不进 Prettier、OPEN-DECISIONS 只追加 + 就地关闭、引擎公开 API 只做 additive、`src/engine/**` 不 import React/zustand、每条「已交付 / 行为中性」论断须有删除探针或变异测试支撑，且**先证明探针落地再解读结果**。
