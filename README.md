# tradingPA

TradingView 图表平台的 1:1 复刻：React 19 + TypeScript + Vite + Zustand，图表渲染是**自研 Canvas 2D 引擎**（框架无关，不依赖任何图表库）。

- 图表类型 18 种 · 时间周期 22 档（含自定义间隔）· 内置指标 64 个 · 画线工具 45 个
- 多市场数据源：加密（Binance 多主机回退 + Gate 回退）/ A 股·港股·美股·指数（腾讯）/ 美股分钟·国内期货·外盘期货·外汇（新浪，script 标签 JSONP 直连）/ 全市场搜索（东财）
- 平台能力：多图表布局 1/2/4/6/8、跨图联动、自选股、价格警报、复盘回放、模拟交易、Pine 子集 DSL、Compare 叠加

## 快速开始

```bash
npm install
npm run dev          # http://localhost:5173
```

## GitHub Pages 部署

推送即部署：`push` 到 `main`（或 Actions 页手动 `workflow_dispatch`）触发 `.github/workflows/deploy.yml`——先跑 `npm run verify`（typecheck + lint + format:check + 单测 + build + check:bundle，红则终止部署），再 `npm run build` 并发布到 Pages。产物地址 `https://<owner>.github.io/tradingPA/`。

> 自四期-A2 起 `verify` 内已含一次 `npm run build`，故 workflow 里那条独立 `build` 步骤是**冗余但无害**的第二次构建（约 0.7 s，产物一致）。未删它：该步骤属部署管线，改动需单独确认（见 `docs/PLAN-PHASE4.md` §2-A 的 A2 交付记录）。

**一次性仓库设置**（git push 无法代做）：仓库 **Settings → Pages → Source 选 “GitHub Actions”**。

- base 路径由 `vite.config.ts` 在 Actions 环境自动推导（`GITHUB_REPOSITORY` → `/tradingPA/`），本地构建保持 `/`
- 本地按 Pages base 预演：`npm run build:pages && npm run preview`
- 单页应用无路由，无需 SPA 回退；全部 K 线数据源浏览器直连（腾讯系带 CORS，新浪系经 script 标签 JSONP，无 CORS/Referer 依赖），开发与生产一致。唯一已知缺口：港股分钟线暂无免费源（腾讯/新浪/东财均不提供），港股仅日/周/月

## 命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 开发服务器（HMR） |
| `npm run build` | `tsc -b`（app + node 双项目）+ Vite 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run typecheck` | 类型检查双项目：`tsconfig.json`（`src` + `tests/unit`，开着 `noUnusedLocals`）+ `tsconfig.node.json`（`vite.config.ts` / `playwright.config.ts` / `tests/e2e`） |
| `npm run lint` | oxlint（`.oxlintrc.json`，Rust 原生 0.3s；**0 错误 0 警告**——2026-10-08 存量 55 条警告基线全额清偿，2026-10-12 三期-H 再消除该基线未覆盖的 1 条指令遮蔽链；源码内 `eslint-disable` 注释 **2 条**，逐条理由与遮蔽范围见「lint disable 台账」；含函数级规模规则 max-statements 60 / max-params 10，7 个编排类文件放宽至 120） |
| `npm run lint:fix` | oxlint 自动修复 |
| `npm run format` / `format:check` | Prettier（代码/配置全覆盖，已全仓格式化；markdown 与 `docs/` 刻意排除，见 `.prettierignore` 的量化理由） |
| `npm test` | Vitest 单测（99 文件 / 1567 例） |
| `npm run test:e2e` | Playwright E2E（11 spec / 81 例，含 **27 面黄金截图** + 1M 根画布全管线帧时长预算；配置内 `retries: 0`，见下「已知状态」） |
| `npm run test:e2e:update` | 黄金截图重基线（**仅有意渲染变更时用**：跑完必须在同一提交里审查 `__screenshots__` 的 diff 并说明理由，禁止顺手全量更新） |
| `npm run build:pages` | 按 Pages base（`/tradingPA/`）本地预演构建（配合 `npm run preview`） |
| `npm run audit` | 依赖漏洞审计（**必须走官方 registry**：本机配置的 npmmirror 镜像不实现 `/-/npm/v1/security/*`，直接 `npm audit` 会报 NOT_IMPLEMENTED） |
| `npm run verify` | 机器无关门禁一键跑：typecheck + lint + format:check + test + build + check:bundle（批次内快速闭环用；2026-10-15 四期-A2 起含体积门禁） |
| `npm run check:bundle` | 应用块体积门禁：读 `dist/assets/*.js`，按 zlib 口径取最大应用块 gzip 与 160 kB 上限比对，超则 exit 1（`scripts/check-bundle.mjs`；需先有 dist，缺则 exit 2） |

## 目录结构

```
src/
  engine/       自研渲染引擎（框架无关，不得 import React/zustand）
    renderer/     ChartController 门面 + 状态/管线/输入/手势/坐标轴/序列渲染（41 文件，含水印绘制、数据窗口读数快照）
    drawing/      画线数据模型、几何纯函数、canvas 绘制（34 文件，math 与 render 分离；原记 26 为陈旧计数，已按 `find` 实数复核）
    profile/      Volume Profile（kline 近似，见 docs/DECISIONS）
    scale/ viewport/ crosshair/ canvas/ theme.ts countdown.ts
  indicators/   指标引擎
    core/         声明式 schema + 窗口化/脏缓存计算
    builtin/      64 个内置指标定义（按族分文件：trend-ma/trend-ichimoku/trend-supertrend、
                  momentum-macd/momentum-adx/momentum-atr、oscillators-rsi/oscillators-range/
                  oscillators-momentum、momentum-osc-smooth/momentum-osc-fisher/momentum-osc-roc…）
    pine/         Pine 子集编译器与解释器（tokenizer → parser → interpreter → taFunctions；
                  taFunctions 按族拆为 ta-shared/ta-overlap/ta-momentum/ta-math；
                  strategy.ts strategy 骨架模拟器 StratSim）
  data/         数据层
    sources/      多市场数据源路由（binance / tencent / sina / eastmoney）
    feed/         Binance REST + WS 实时通道
    aggregate.ts aggregatePath.ts liveBar.ts tz.ts cache/ BarSeries.ts
  store/        Zustand（UI/布局/指标/自选/警报/联动总线…），渲染态不进 React
  features/     平台功能（market / drawings / watchlist / layout / alerts / trading / command / replay / pine / settings / datawindow）
  ui/           设计 token 与基础组件（primitives / controls / tokens）
  components/ hooks/ types/ styles/
tests/
  unit/         Vitest（91 文件，node 环境为主，需 DOM 的文件用 `// @vitest-environment jsdom`）
  e2e/          Playwright（11 spec / 81 例）+ __screenshots__ 黄金基线
scripts/        check-bundle.mjs（应用块 gzip 门禁，零依赖 node builtins；2026-10-08 退役的
                check:size 是「文件规模红线」承载物、已由 oxlint 函数级规则接替，本脚本不是它的复活）
docs/           Spec 与差距分析（见下）
```

## 质量门禁

批次出口标准：`npm run verify`（typecheck + lint + format:check + test + build + check:bundle 一键门禁）+ `npm run test:e2e` 全绿。等价手工链：`npm run typecheck && npm run lint && npm run format:check && npm test && npm run build && npm run check:bundle && npm run test:e2e`。

> E2E 在 Windows 上必须先自己起 dev server 再跑（见下节）；`verify` 只含机器无关门禁，可随时跑。

当前实测基线（**2026-10-16 四期-C4c 交付复跑**；上一次为 2026-10-16 四期-C4b 交付复跑 + 2026-10-16 四期-C3a 交付复跑 + 2026-10-16 四期-C2 交付复跑 + 2026-10-16 四期-C1b' + E1c + E1d 交付复跑 + 同一次四期-C1a 交付复跑 + 2026-10-15 四期-E1 交付复跑 + 同日晚四期-A2 交付复跑 + 同日晚三期-EF 交付复跑 + 同日晚三期-D5 交付复跑 + 2026-10-14 三期-C2 交付复跑 + 2026-10-14 三期-C1 交付 + 同日晚三期-B4 交付 + 2026-10-12 复跑门禁口径校准 + 同日晚三期-H 交付 + 同日晚三期-B0 交付 + 同日晚三期-B1 交付 + 同日晚三期-B2 交付 + 同日晚三期-B3 交付；再前次功能基线为 2026-10-09 二期收官后 + 形态家族画线回归修复 + rAF 帧循环加固 + E2E 去 flaky）：typecheck 0 错（**TypeScript 7 原生编译器，单一依赖无别名**；双项目：app + node 配置/e2e）/ lint **0 错 0 警告**（398 文件——四期-C4c 新增 `tests/unit/toolbar-select.test.tsx` 使 397 → 398；四期-C4b 新增 `tests/unit/topbar-button-states.test.tsx` + `tests/unit/drawing-history-flags.test.ts` 使 395 → 397；四期-C3a 新增 `tests/unit/drawing-toolbar-flyout-active.test.ts` 使 394 → 395；四期-C2 新增 `tests/e2e/price-scale-alert.spec.ts` 使 393 → 394；四期-C1b' 新增 `tests/unit/price-decimals-cap.test.ts` 使 392 → 393；四期-C1a 新增 `tests/unit/price-tick-density.test.ts` 使 391 → 392；四期-E1 新增 `tests/e2e/replay-drawing.spec.ts` 使 390 → 391；四期-A2 新增 `scripts/check-bundle.mjs` 使 389 → 390；存量 55 条基线已于 2026-10-08 全额清偿：exhaustive-deps 19 / only-export-components 11 / refs 10 / set-state-in-effect 11 / purity 3 / use-memo 1；该口径曾有一处盲区——`useChartSeries.ts` 的一条 disable 连带遮蔽同文件 6 条 refs + 1 条 set-state-in-effect，即「指令锚定而非分析归零」，已于三期-H 用代码结构归零，现源码内 2 条 disable 逐条见「lint disable 台账」）/ format:check 绿 / 单测 **99 文件 1567 例全过**（99 = 四期-C4c 新增 `tests/unit/toolbar-select.test.tsx`；1567 = 四期-C4c +3 例（触发器 role / `title` 透传 / 文案派生三条）＋四期-C4b +26 例，分三处：17 例在新文件 `tests/unit/topbar-button-states.test.tsx`（`isFeedBusy` 真值表 + `IconButton` 两态的 DOM 产物 + `HistoryButtons`/`ReloadButton` 用替身钉「引擎读数 → 置灰」，含首帧播种与卸载退订）、6 例在新文件 `tests/unit/drawing-history-flags.test.ts`（纯栈形态：空栈 / 50 层截断 / `select` 不入栈）、3 例追加在 `tests/unit/drawing-interactions.test.ts`（门面委托、`notifyDrawings` 驱动刷新、**空栈按下仍广播一次**这条现状只钉不改）。该批留下两条测量口径：① **需要 JSX 的单测文件必须写成 `.tsx` 并把 `children` 写进 props**——@types/react 19 的 `createElement` 不从第三参推断必填 `children`，而 `children` 放 props 又被 oxlint `react/no-children-prop` 判反模式，故 `vite.config.ts:64-68` 的 include glob 放宽为 `tests/**/*.test.{ts,tsx}`；② **jsdom 内联样式序列化会在 `:` 后插空格**，断言只能走 `el.style.prop`，读 `getAttribute('style')` 必假红；另记一条工具教训——变异探针一律用**字面替换 + 备份还原**，前两条曾用 `perl -i -pe` 施加、模式里未转义的 `?` 被当量词当场改坏了 `primitives.tsx`；四期-C3a +7 例，全部在新文件 `tests/unit/drawing-toolbar-flyout-active.test.ts`（真值表 3 + jsdom `createRoot`/`act` 渲染产物 4，查 `[data-role="main-cell"]` 的 style 属性；沿用 `use-group-hold.test.ts` 的无依赖渲染法，`package.json` 的 testing-library 仍为 0）；四期-C2 +9 例，全部落在既有文件 `tests/unit/gestures.test.ts`（35 → 44：5 条几何纯函数 + 1 条光标降级 + 3 条按下路由）；四期-C1b' +5 例，全部在新文件 `tests/unit/price-decimals-cap.test.ts`；四期-C1a +8 例，全部在新文件 `tests/unit/price-tick-density.test.ts`；三期-E1 +6，全部落在既有文件 `tests/unit/replay-autoplay.test.ts`；三期-D5 +4，新文件 `tests/unit/legend-replay-clamp.test.ts`；三期-D3b +50，其中 42 例为新文件 `tests/unit/pine-scalar-args.test.ts`；三期-B5 +3；三期-C2 +69；其中 +4 例是新文件 `tests/unit/data-window-broadcast.test.ts`（jsdom），把两个引擎新增端口从「只有 E2E 覆盖」补到控制器级覆盖） / E2E **81 例全过**（四期-C4c **+3 例、spec 文件数不变**——`interactions.spec.ts:334` 倍速菜单、`pine.spec.ts:82` 两只动作菜单、`price-scale-alert.spec.ts:187` 警报条件菜单，三条都以 `getByRole('combobox')` toHaveCount(0) 作「原生件确实不在了」的承重读法）＋四期-C4b **+1 例、spec 文件数不变**——`tests/e2e/drawing.spec.ts` 追加「顶栏复原/重做置灰跟随引擎历史栈」，走真实引擎 → React → 原生 `disabled` 全链，并用引擎读数交叉验证 `{undoDisabled: !canUndo, redoDisabled: !canRedo}`（不是两处各说各话），收尾开对象树证明第二个消费者跟同一栈；14 项变异探针的覆盖分工照登——**首帧播种只被单测抓到、广播链两层都红**。**同批顺带修复**（本批全量跑抓出的既有脆弱断言，非本批改动引入）：`replay-drawing.spec.ts` 的「磁吸关 ⇒ 锚点不等于任何 bar.time」翻红，机制三条都与磁吸无关——`revealForward` 推游标后可视区跟着滚、落点越过序列末被 `coords.ts:43-51` 钳到同一根（此时 time 与 bar.time 精确相等，与被钳位样本同形）、水平线横贯宽度使同 y 的第二次落笔命中上一根线；改法为**复位游标 + `parkMouse`、扫 8 个 x 逐根「画—读—删」采样，只看 `frac = ((time − t0)/iv)` 的小数部分**（off-grid ≥2 且未来区 ≥1），像素几何全程不参与，`lastBarTime` 用来分离钳位样本；**同批还换掉了另一条更隐蔽的假判据**——旧 `covers`（判「揭示表格里有没有一根 ≥ 锚点」）在越过序列末时永远为真，因为 `dataWindowSnapshot.bar` 对越界下标**重复返回最后一根**（临时探针读数：游标 768、`cursorTime=1792132140000`、`lastBarTime=1792138440000`、`iv=60000` ⇒ 距末约 105 根，而推到 cursor+400 实得 400 行），而 `coords.ts` 的末端钳位分支恰恰能量出 `lastBarTime + 小数×iv`；据此改为时钟区间口径 `futureSpan`（`ceil((lastBarTime − cursorTime)/iv) + 2`，另设 ≤2000 上界守卫）+ `assertInFutureBand`（`cursorTime < time ≤ lastBarTime + iv` 双向夹）+ `rowAtOrBefore`，三条用例（右锚点 / 磁吸锚点与对照落点 / 趋势线首锚）统一走这一对，`covers` 删除。新量法的承重证明：删掉 `coords.ts:50` 的小数项 ⇒ 两条用例同点报红、`frac` 全为 0，还原后该文件 `git diff` 0/0；改后该文件 `--retries=0 --repeat-each=4` **24 passed**、整串 **78 passed**、27 面零 diff；四期-C3a **零新增用例、spec 文件数不变**——取色改动由 7 例单测覆盖，像素面结构性中性；本批留下一条测量口径：**E2E 门禁读数必须前台取**，后台跑 + 重定向会得到被截断的日志与管道尾（`tail`）的退出码而非 Playwright 的，本轮两条假红（一次自家 Playwright 并发重叠、一次 5173 开发服务器已死 ⇒ 从第 7 例起 ~450 ms 级联、`--list` 与单文件复跑即恢复正常）都由该测量 fault 产生，非代码问题；**四期-C3a 同日整串复跑另抓到一条真红**——`settings.spec.ts:216`（三期-B2）的 `止损价 === 当前价标签 × 1.02` 精确相等被证伪为**自写下起就不成立**：标签是 `price.toFixed(2)` 的已取整视图而预填用未取整价，探针实测静止价下仍差 −0.0042，加上「限价/止损价只在挂载时播种一次、标签随行情继续渲染」（`OrderDialog.tsx:15-16` vs `:98`）的时机差，红由两个随机量决定；已改为比对两个同刻播种的字段并留 1 分钱取整余量（`:283` 守卫 + `:286` 带），M1（偏移打回硬编码 1）⇒ 红于 `:286`、读数 13.174 对 0.011，M2（限价播种打空）⇒ 红于 `:283`，产品语义维持不动、口径入册见 `docs/SPEC-TV-ALIGNMENT.md` §12；四期-C2 +4、spec 文件 10 → 11，新文件 `tests/e2e/price-scale-alert.spec.ts` 把价格轴「+」的四条口径钉成被测事实：默认视图零像素 / 副图刻度区整条主图轴零像素 / 点击出对话框且预填价随光标 y 单调下降、创建后 `tradingpa.alerts` 内 `source.type === 'price'` / 手动价格域时给「自动」按钮让位；四条均配对照读数，采样口径沿用四期-E1d 的夹带法；四期-E1 +6、spec 文件 9 → 10，新文件 `tests/e2e/replay-drawing.spec.ts` 把「回放态画线」钉成被测事实；**2026-10-16 本批复跑自纠两例**：① `replay-drawing.spec.ts` 的「移除后归零」对照（E1b 时在 `:353-355`，E1d 后在 `:359-371`）曾报红，**当时（四期-E1b）把根因记为「用例侧固定 sleep（120ms）等不到那一帧」并把 `Received: 1` 读作「线还在」——该判读同日即被 E1d 推翻**：改成 `expect.poll(..., 5_000)` 之后整串复跑**仍在同处报同读数**（72 passed / 1 failed），说明等时长不是主因。真因是**像素采样未夹带**：默认画线色与主题跌色**同值** `#ef5350`（`src/engine/palette.ts:31` + `theme.ts:57`），而**最新价虚线横贯整个主图**（`src/engine/renderer/drawAxes.ts:184-195`），探针实测**画线之前**列 700 就已有 1 行同色（一次 y=116、一次 y=113，随行情漂移），park 鼠标前后差值 0 ⇒ 与十字光标无关。E1d 据此交付：`columnHits`（计数）→ `columnRows(page, color, x, band?)`（行号 + 按 CSS y 夹带、按 `img.height/clientHeight` 换算故 DPR 无关），对照改为「带 [318,322] 内画线后非空、移除后归零」。**三条变异探针（每条先证 md5 偏离基线 `67076d62…` 再解读、跑完恢复并复核一致）**：M-A `removeDrawing` 打成 `void d;` ⇒ 对照仍红 `Expected: 0 / Received: 1`（**断言强度未因夹带而降**）；M-B 带退化为全列 ⇒ 原红在同处同读数复现（**夹带承重**，同时反证 sleep/poll 从来不是主因）；M-C 带移到无线行 `[400,404]` ⇒ 正向断言红 `Expected: > 0 / Received: 0`——**顺带修正一条更旧的说法**：该用例的正向断言此前在**没有线**时也能靠常驻虚线通过，即「未来空白区真的被绘制」的渲染证明原本并不成立。回归：`--repeat-each=4` 该文件 24 passed；② `watchlist.spec.ts:85 符号搜索切换图表品种` 也报红过一次，根因是**外网联想源未打桩**（该文件只有 `:127` 期货分类那条钉了桩；`searchapi.eastmoney.com/api/suggest` 不可达时 `catch(() => [])` → 对话框零候选，无本地兜底），与本批改动无关——**本轮已按用户裁决「现在打桩」交付**：新增 `stubStockSuggest(page)` 并在那两条（现 `:109`、`:129`）首行调用，零 `src/` 改动。桩的承重证明**不靠撤桩**：撤桩后两条仍 2 passed（17.5s，真实端点此刻可达），故「断网必红」由另一条探针给出——把桩体 `fulfill` 换成 `route.abort()`（调用点不动）后两条同点报红 `getByRole('option', {name:/601318/})` / `/002594/` element(s) not found；再加一条桩内 Code 换位（601318→601319、002594→002595）同报 2 failed，证明对话框候选确实来自桩体而非真实网络。三条探针各自先证 md5 偏离基线再解读、跑完从备份恢复并复核 md5 一致。同一轮配对复现（`replay-drawing + watchlist` 同跑）在修复前 1 红、修复后 14/14 绿；三期-C2 +1、spec 文件 8 → 9；`--retries=0` 实测零失败——基线已确定化，外网依赖已切断（**2026-10-16 勘正 → 同日按裁决补齐**：该口径此前只覆盖 `:127` 期货分类那一条的供料，符号搜索两条仍吃外网联想源；现已由 `stubStockSuggest` 钉死候选供料，见上条 ②。**仍存的外网前提**：切换后的 K 线与批量报价走真实源（腾讯/新浪/东财/币安），那是整串 E2E 的共同前提、不在「打桩」这条裁决的范围内）；含 `perf-million-bars.spec.ts` 的 1M 根画布全管线帧时长预算。**2026-10-14 用户裁决**：`playwright.config.ts` 内 `retries` 由 1 归零，「不带 flag 的本地跑法」与被采纳的结果从此一致；连带 `trace` 由 `on-first-retry` 改 `retain-on-failure`，因为 `retries: 0` 下前者永不落地）/ **27 面黄金截图零 diff**（**四期-C3a 复跑同样 27 面零 diff、未重产**——且这次是**结构性**中性而非坐标论证：27 面来自 `tests/e2e/harness/visual-harness.html`，其 `<body>`（`:34-37`）只有 canvas 容器 + 一个 module script，React 工具栏与 DOM 样式根本不进 harness；四期-C2 复跑同样 27 面零 diff、未重产：「+」只在光标悬停于主价格面板的轴条时绘制，默认视图构造性零新像素——该 spec 的 5 处 pointer 动作 x 坐标全 ≤ 1185 < `chartW = 1216`，没有一面把光标停在轴条上；读数与证明见 `docs/PLAN-PHASE4.md` §2-C 的 C2 交付记录。本段下方原「C2 未新增黄金面」指**三期**-C2 数据窗口面板，勿与本期混读。B5 为像素中性的常量收敛、C2 未新增黄金面、E1 的回放工具条不在黄金面内故同为像素中性；㉒ drawings-line-family 兼作 `rayEndPix` 抽件的行为中性证明；**四期-C1a 是唯一重基线面**：刻度条数改由轴源自高推导后，仅 ⑥ `ma-macd` 的副图（MACD 面板，轴高 194px）价格轴标签 9 → 4 条、像素带锁在 y 589–746——该轴预算取下限 3、nice-step 向下取整后渲染 5 条网格、可见性过滤掉 1 条得 4 条标签（`price-tick-density.test.ts:88-92` 同值钉住）；主面板不在此带内即为不动的证明，其默认视图预算回到原先写死的 6（`axis-price-closeup` 面实测轴高 776 → `round(776/120)=6`，网格与标签各 9 条），其余 26 面逐面未动。该 diff 由用户授权「逐面评审后回读数」并按 `--grep` 增量重基线，不用全量更新；两个口径的读数照登——Playwright 的 YIQ 色差判定 15,038 px / ratio 0.02（上限 0.01），离线逐通道最大值口径 20,227 / 19,982 px，指标不同、结论一致。`15,038` 这个数曾来自压缩摘要，本轮把旧基线临时还原重跑该面复现过（error-context 原文「15038 pixels (ratio 0.02 of all image pixels) are different.」），非沿用文字）；**本轮 C1b' + E1c 复跑 27 面仍逐面零 diff**——钳位在黄金 harness 的 `decimals: 2` 档位上是恒等变换（`tests/e2e/harness/visual-harness.ts:78,86` 两处硬编码 2，`decimalsFor` 钳位只在 >8 或 <0 时改变结果），E1c 纯测试侧、零 `src/` 改动 / 构建 7 chunk、最大应用块 **520.65 kB（Vite 报数；`check:bundle` 同 dist 读 520.66 kB。gzip 149.45 kB，本 dist 逐块合计＝Vite 报数相加 262.29 kB、`check:bundle` 逐块合计 raw 872.11 / gzip 258.70 kB（其口径只累加 6 个 chunk、不含 index.html 与 css，非对整包 gzip），Vite 口径非本机 `gzip -c` 可复现——同一 dist 逐文件 `gzip -c -6` 相加为 253.38 kB、raw 855.56 kB（**该一对为上一 dist 读数，四期-C4c 未重取**）（本批这条遍历含 index.html 与 css，且用本机 `/1024` 口径 ⇒ 与 `check:bundle` 那对「只累加 6 个 chunk」的 871.80 / 258.50 kB 不同尺，只可同尺互比；上一批那一对读数为 261.36 / 258.48 kB，四期-A2 那一对为 261.29 / 251.64 kB，压缩档位不同 ⇒ 跨批次的这几个数不可互比，只有同一 dist 上的一对才有意义）；四期-A2 起该 gzip 口径由 `npm run check:bundle` 机械承载，脚本同尺读数 = 应用块 gzip 148.51 kB（zlib level 6，比 Vite 报数低 0.94 kB ≈ 0.6%）、对 160 kB 上限裕度 11.48 kB**——B0 标注的「裕度仅 1.92 kB」已在 B1 兑现，**>500 kB 警告现已触发**（B2 再 +3.24 kB、B3 再 +2.02 kB、B4 再 +0.62 kB、C1 再 +1.77 kB、C2 再 +6.68 kB、B5 再 +0.04 kB、D3 再 +2.93 kB、D5 再 +0.05 kB、三期-E1 再 +0.08 kB、四期-E1 再 +0.08 kB、四期-C1a 再 +0.07 kB、四期-C1b' 再 +0.03 kB、**四期-C2 再 +1.94 kB**（「+」的几何纯函数 + 绘制 + 命中路由 + 光标一条链，引擎侧占大头）、**四期-C3a 再 +0.18 kB**（Vite 520.16 → 520.34；`toolCellTone` 一条纯函数 + 组件两处取色改读，gzip 两口径同 +0.07 kB），仍在同一触发态；这是 Vite 的提示阈值、非本期门禁；gzip ≤150 kB 口径曾被 D3 逼到 **1.55 kB** 裕度（D3 正是那条「下一批同量级增量即触线」的批次本身），**2026-10-15 用户裁决：提阈值 150 → 160**——现 **149.25 kB**（三期-E1 再 +0.03 kB gzip、四期-E1 再 +0.01 kB、四期-C1a 再 +0.02 kB、四期-C1b' **+0 kB**——原始块 +0.03 kB 未跨过 Vite 的 0.01 kB 显示档、**四期-C2 再 +0.66 kB**、四期-C3a 再 +0.07 kB）、裕度 **10.75 kB**（Vite 报数口径；同一 dist 的 `check:bundle` 脚本口径为 148.31 kB、裕度 11.69 kB）；同批登记的承重点实查：登记时该 gzip 口径**没有脚本门禁承载**（`package.json` 无 check:size 类命令、CI 只跑 verify+build），它只活在 `vite.config.ts` 注释、本条与 OPEN-DECISIONS 里，所以「触线」从来不会让 `npm run verify` 变红，松的是口径而非配置——**该实查已由四期-A2 补齐**：2026-10-15 起 `npm run check:bundle`（`scripts/check-bundle.mjs`）承载此口径并串进 `verify`，脚本按 zlib level 6 读数、比 Vite 报数低 0.6%（详见本条下方「应用块体积预算」）。**2026-10-14 用户裁决**：`vite.config.ts` 设 `chunkSizeWarningLimit = 560`，即「提阈值而非关警告」，约 54 kB 余量按三期-C 规模预留；C2 交付后实余 **45.06 kB** → B5 **45.02 kB** → **D3 交付后实余 42.09 kB → D5 交付后实余 42.04 kB → 三期-E1 交付后实余 41.96 kB → 四期-E1 交付后实余 41.88 kB → 四期-C1a 交付后实余 41.81 kB → 四期-C1b' 交付后实余 41.78 kB → **四期-C2 交付后实余 39.84 kB**（Vite 报数口径 560 − 520.16；`check:bundle` 同 dist 读 520.17 ⇒ 39.83）→ **四期-C3a 交付后实余 39.66 kB**（Vite 560 − 520.34；`check:bundle` 同 dist 读 520.35 ⇒ 39.65）**，C 批次已收口、D 批次已交付，该预算的预留对象转为后续批次；已用副本配置实测——同一 506.49 kB 块在 500 档复现警告、在 560 档静默，故这是登记的预算而非压制。详见 `docs/PLAN-PHASE3.md` §2-B 的 B1/B4 交付记录、§2-C 的 C1/C2 交付记录与 §2-D 的 D-3 交付收口）。

**工具链统一 Vite 8 / oxc 生态（2026-10-03 迁移）**：`typescript` 为原生 7.0 单一依赖（无 JS API，官方预期形态）。原依赖 TS JS API 与 eslint/babel 的两处校验工具链统一迁到 **oxc 栈**（Vite 8 内置 Rolldown 的同源生态，Rust 原生解析）：
- **lint**：eslint 五件套 + @babel 三件套（共 8 个 devDep）→ **oxlint** 单二进制（`.oxlintrc.json`）。规则覆盖完备：react-hooks 全家族（含编译器规则 refs/purity/set-state-in-effect）+ react-refresh + TS 规则；`eslint-disable` 注释指令**基本**兼容（2026-10-03 探针验证「带指令 0 警告/去指令即报」；2026-10-12 复核补充：react-hooks 编译器规则的**抑制半径**与 ESLint 的 next-line 语义不一致，见下方台账「探针副产物」）。61 条 vs 原 68 条：oxlint 的 refs/set-state-in-effect 移植更保守（-7），无新增类别。耗时 30s → **0.3s**。
- `no-undef`/`no-unused-vars` 对 TS 关闭（tsc 把关全局与未使用代码）。
  注意 `.oxlintrc.json` 里的 `"@typescript-eslint/no-unused-vars": "off"` 是 **oxlint 的规则命名空间**，
  不是旧 `typescript-eslint` 包的幽灵依赖、也不是死键——探针实证（2026-10-12，用 `-c` 双份配置对照，不动现行配置）：
  把 core `no-unused-vars` 临时置 `error` 后，带该键的 TS 未使用变量文件 **0 错**、去掉该键即报 **1 错**。
  现行配置里 core 规则本身是 `off`，所以删掉该键**当下**不改门禁结果，但会改掉「一旦启用 core 规则时 TS 是否被拦」的口径
  ——这正是 2026-10-09 TS7 收口时判定它承重的原因，禁止「顺手清理」。

**lint disable 台账（源码内 `eslint-disable` 注释现行 2 条；2026-10-12 逐条探针复核时为 3 条，三期-H 交付后 `useChartSeries.ts` 一条归零）**

复核方法：把该行的 disable 注释删掉、其余不动，跑 `npx oxlint <该文件>` 看新增诊断——「不能删」必须有机械证据，不接受口头理由。**四期-A3（2026-10-15）改用副本复跑**（`cp` 到仓外临时目录后删行，活文件全程未动）：两条现行指令各自**只遮蔽 1 条同名诊断**、还原指令后各自文件读数回到 0——**均无编译器规则连带遮蔽**（连带半径按下一段机制计）。

| 位置 | 规则 | 删掉后新增 | 为何保留 |
|---|---|---|---|
| `src/components/Chart.tsx:108` | `react-hooks/exhaustive-deps` | 1 条（missing deps: `bars` `symbol` `interval` `decimals` `exchange` `timeframeId` `chartType` `logScale` `onRendererReady`） | 该 effect 是**引擎挂载/卸载生命周期**，依赖必须为 `[]`；补齐依赖会让 Canvas 引擎随每批行情 dispose/recreate，渲染循环与视口状态全丢——属行为变更，非 lint 修复 |
| `src/features/market/useChartSeries.ts` | ~~`react-hooks/exhaustive-deps`~~ | — | **已归零**（三期-H，2026-10-12）：该指令删除后连带显形的 6 条 `react(refs)` + 1 条 `react(set-state-in-effect)` 全部由代码结构消解，不靠指令抑制。改造后 `npx oxlint src/features/market/useChartSeries.ts` 0 错 0 警告且文件内零 disable；行为零变更经单测 + 27 面黄金截图 + E2E `--retries=0` 实证。详见 `docs/PLAN-PHASE3.md` §2-H |
| `src/features/layout/ChartWorkspace.tsx:175` | `react-hooks/purity` | 1 条（`Date.now()` 渲染期读取） | 回放 bar 缺失瞬态的墙钟占位；改 effect+state 会触发 set-state-in-effect 且首帧取旧值，从 store/末柱派生会改变该瞬态显示值——两条替代路径均已核实为行为变更（理由同见该处 L172–174 注释） |

**抑制半径机制（四期-A3 已定位，2026-10-15；替代本节原「机制未证实」段）**：oxlint 1.87 里 React Compiler 那组诊断的输出名是 **`react(refs)` / `react(purity)` / `react(set-state-in-effect)`**（不是 `react-hooks(...)`），而配置按 `react-hooks/*` 名启用。据此，指令的实际语义分三条：

- **点名编译器规则的指令 = 与 ESLint 一致**：`// eslint-disable-next-line react-hooks/refs`（或 `react/refs`、`oxlint-disable-next-line` 同形）只吃掉紧邻下一行的那一条 refs 诊断；块式 `/* eslint-disable react-hooks/refs */` 只吃掉该规则、且**按位置取范围**（写在文件末尾则前面的代码一条不吃）。实测：同一双组件文件基线 8 条（refs/purity/set-state/exhaustive 各 2），上述各变体分别剩 7／8 条。
- **点名「非编译器 react-hooks 规则」（`exhaustive-deps`、`rules-of-hooks`）的指令 = 附带吞掉编译器那组**，且半径随形式突变：**行式**只吞**所在组件/hook 这个分析单元**内的全部编译器诊断（指令指向哪一行无所谓，落在单元内即生效；本仓两条现行指令即此形，实测各自只遮蔽 1 条同名诊断、所在单元内无编译器诊断可吞 ⇒ **连带半径为零**）；**块式直接关掉整文件的编译器分析**——与位置无关（写在文件末尾、覆盖范围为空，前面 6 条编译器诊断照样消失），`/* eslint-enable */` 配对也**不恢复**。
- ⇒ **本仓口径**：`react-hooks/exhaustive-deps` 只能以 `eslint-disable-next-line` 形出现，**禁止块式 `/* eslint-disable react-hooks/exhaustive-deps */`**（它会静默停掉整个文件的 refs/purity/set-state，且门禁读数看起来只是「少了一条 exhaustive-deps」）。`--report-unused-disable-directives` **不可作为删除依据**：合成 hook 用例里它把一条正在吞 3 条编译器诊断的指令报成「Unused（no problems were reported）」——它只核对被点名规则自己有没有诊断。
- **一条被推翻的旧观测**：上一段原写「把 `useChartSeries.ts:223` 的指令移到同文件任意位置（含文件末尾）后编译器诊断仍全部消失」。A3 用 `git show e7b0cb8^:src/features/market/useChartSeries.ts`（306 行原件，含该指令）重跑三态：原样 **0** 警告、删指令 **8**（refs×6 + set-state×1 + exhaustive×1）、**指令移到文件末尾仍 8**。⇒ 「文件级半径」不成立，真实半径是**所在 hook 单元**（该文件只有一个导出 hook，指令在单元内，故当时「移到任意位置」若仍在函数体内就复现「全部消失」）；两处观测并不矛盾，是一条未复核的转述把「函数体内」写成了「文件末尾」。

复现件（本轮一次性构造、跑完即删，**未改活配置 `.oxlintrc.json`**：全部走 `cp` 出的 `.oxlintrc.probe.json` + `-c`，探针件放 `.probe/`）：**47 份探针件、46 份有效读数**（多出的 1 份是首轮正文写重、后被重做件替代的那份，其 parse error 读数不入结论）。46 份变体覆盖 指令名（`react-hooks/{refs,purity,set-state-in-effect,exhaustive-deps,use-memo,rules-of-hooks}` / `react/{refs,jsx-key}` / `no-debugger` / 裸）×形式（next-line / 块 / 块+enable 配对 / 多名列）×位置（目标行上方 / 单元内无诊断行 / 两组件之间 / 文件首 / 文件末）×文件形（`.tsx` 双组件 / `.ts` 单 hook / 生产件副本）。**一处自纠**：`v10`/`v11` 首轮生成器把正文写了两遍，输出是 3 条 parse error 而非 lint 结论——该两份结果作废并按修正后的文件重跑（`react/refs` 行式与 `exhaustive-deps` 中部块式的读数在重跑后才入上表）。附带一次越界提醒：探针件放在仓库内时**活配置会把它们一起 lint**（实测 `npm run lint` 一度变成 390→438 文件、197 警告 + 3 错误），删净后回到 390 文件 0/0；后续同类实验应放仓外目录或先 `rm` 再跑门禁。


**E2E 在 Windows 上必须先自己起 dev server 再跑**：

```bash
npm run dev &        # 或另一个终端；Playwright 配置为 reuseExistingServer
npm run test:e2e
```

让 Playwright 自管 `webServer` 时，Windows 上 `npm → vite` 孙进程无法回收会导致挂死（已登记于 `.workbuddy/memory/pitfalls.jsonl`）。

## 项目规则（施工红线）

- 图标只用 `lucide-react` 或自绘 SVG，禁字符 emoji
- 颜色一律走 CSS 变量 / 设计 token。**canvas 渲染路径与 UI 层零 hex 字面量**，可机械审计：
  默认色走 `src/engine/palette.ts`（TV 调色板数据，非硬编码）、主题色走 `src/engine/theme.ts`、
  UI 走 `--text-on-accent` / `--on-updown` / `--on-warn` 等 CSS 变量
- 渲染循环与 React 解耦：高频行情不触发 React 重渲染；跨图表联动走 `store/syncBus.ts`（sourceId 防环 + 限频）
- 函数级规模红线（oxlint 原生规则，随 lint 门禁执行）：单函数 ≤ **60 条语句**、≤ **10 个参数**
  （2026-10-08 由「单文件 ≤300 逻辑单元」自定义脚本改为函数级口径——实测全仓 3863 个函数，
  99.7% ≤30 条语句、最大 59；文件级口径对缺陷零捕获且最大文件 ChartController 三次裁决健康，
  函数级才直接度量「巨型函数」这个真实风险）。存量 7 个帧编排/分发类大函数（`RenderPipeline.draw`
  97 / `useTvShortcuts` onKey 107 / `drawLegendBlock` 88 / `drawIndicator` 80 / parser dispatch 73 /
  `parseShapeDirective` 70 / `PaneRenderer.draw` 64）经 `.oxlintrc.json` overrides 放宽至 120 并登记；
  放宽是提阈值而非关闭，>120 的新函数仍被拦
- 引擎侧框架无关：不得 import React / zustand
- 公开 API 签名冻结，重构保持调用点零改动（golden：27 面截图 + 1567 单测 + 81 E2E）；additive 扩展需带默认值与回读口（三期-B2 的 `setTradingVisible` / `tradingVisible`、三期-B3 的 `setTzOffsetMinutes` / `tzOffsetMinutes` 与 `formatTime` 末位 `TimeDisplay` 缺省对象即按此口径；三期-C1 的 `hitDrawings(..., includeLocked = false)` 末位新参、`menuHitAt` / `DrawingLayer.paste` / `exportDrawingsByIds` / `pasteDrawings` 四个新口同按此口径，且**只增不改**；三期-C2 的 `dataWindowSnapshot` 回读口 + `onDataWindowChanged` 订阅口亦为纯新增，`ChartController` 既有签名零改动；四期-C1a 是**唯一一条缺省值语义变更**而非新增口：`PriceScale.ticks(targetCount = 6)` 改为 `ticks(targetCount?)`，显式传参的调用点逐字节不变（全部纯刻度单测走这条，无需改动）；需改的是 `render-primitives.test.ts` 里 3 条「自己按 `ticks(6)` 推期望、却调用渲染函数」的用例——渲染已改读轴高预算，故换成与产物同源的 `sampleTick(priceScale, h)` helper，而非把新数字写死；两个内部调用点（`drawGrid` / `drawPriceAxis`）由传 6 改传缺省，改的是密度而非签名，代价登记为 1 面重基线）

## 已知状态与待办

- **E2E 日历用例已修（2026-10-09）**：`interactions.spec.ts` 两处「日历弹层」用例原以 `button[aria-label^="2026-"]` 的 `.first()` 取日格，当日历首行含上/下月补位或区间外日期时命中 `disabled` 格导致点击永久等待——根因是 mock 数据区间由 `Date.now()` 逐日漂移（非应用回归）。现改为 `getByRole('button', { name: /^\d{4}-\d{2}-\d{2}$/, disabled: false })`：可访问名即 ISO 日期串（该形态只有日期格具备，导航/触发按钮不带），且不再依赖年份字面量。
- **E2E 去 flaky 已收口（2026-10-09）**：`watchlist.spec.ts 期货分类可搜到合约` 此前偶发 30s 超时、重试即过，登记为「依赖外网搜索源」——实跑定位后根因是**用例缺就绪门**：`/` 是 window keydown 快捷键（`useTvShortcuts` 的 effect 挂载后才有监听），用例在 `goto('/')` 之后立即按键，按键偶发丢失 → 弹层根本没开，等待的是弹层里的「国内期货」按钮，而非搜索结果。现补上与其他用例一致的就绪断言（`/[1-9][0-9,]* 根/` 可见）再按键。同时把东财合约全集与搜索联想改为 `page.route` 固定桩：期货分类搜索的语义是「本地按合约全集过滤」，网络只负责供料，钉死供料后断言只考察应用逻辑；这还顺带修掉一个定时炸弹——原断言写死 `/rb26/`，真实合约随主力换月会消失，桩数据不会。验证：`--repeat-each=4 --retries=0` 四连过；全量 `--retries=0` **57 例全过**（黄金截图 27 面零 diff）。
- **E2E 重试口径归零（2026-10-14 用户裁决）**：`playwright.config.ts` 的 `retries` 由 1 改 **0**，`trace` 连带由 `on-first-retry` 改 `retain-on-failure`——`retries: 0` 下「首次重试」永不存在，旧值是个死键。理由不是「冷编译会挂」：冷编译已由 `webServer.url` 健康检查 + 用例显式超时兜住，而配置留 1 只会让「本地不带 flag 的跑法」与被采纳的结果不一致（基线声明的 `--retries=0` 从此是默认而非外加）。证据：副本配置对照实测（同一测试在 `retries: 5` 下报 6 条 attempt 行、`retries: 0` 下 1 条）。**勘正**：`docs/decisions/OPEN-DECISIONS.md` 当年 D6 登记的理由「会在 CI 掩盖 flaky」今天不成立——`.github/workflows/deploy.yml` 只跑 `npm run verify` + `npm run build`，**没有 E2E job**；真实动机是上面那条本地口径。历史行不改写，就地补记。
- **画布像素对照必须夹带采样（2026-10-16 四期-E1d 立为用例口径）**：E2E 里用 `screenshot()` 逐列找「与某画线同色的行」时，**不能整列取色**——默认画线色与主题跌色同值 `#ef5350`（`src/engine/palette.ts:31`、`theme.ts:57`），而最新价虚线横贯整个主图（`src/engine/renderer/drawAxes.ts:184-195`），于是「画线之前那一列就已经有同色行」，且那一行的 y 随行情漂移（实测 113↔116）。`replay-drawing.spec.ts` 的对照断言因此间歇红，本仓还曾把它误判成「固定 sleep 等不到那一帧」（判读已就地勘正，见「质量门禁」基线段 ①）。现用 `columnRows(page, color, x, band)`：`band` 是被测对象的 CSS y 上下几像素，带内非空 = 画出来了、带内归零 = 移除了；`band` 按 `img.height/clientHeight` 换算，故 DPR 无关。**推广口径**：任何「某物是否渲染」的像素断言，先证明该采样位**在被测物不存在时是干净的**，否则正向侧同样是空转断言（本条的 M-C 探针就是查这个）。
- **E2E 符号搜索两条用例已改走固定桩供料（2026-10-16 四期-E1c，用户裁决「现在打桩」；发现于同日四期-C1a 复跑）**：`watchlist.spec.ts:109 符号搜索切换图表品种`（填「平安」→ 期望 `601318`）与 `:129 搜索弹窗加号模式只加入列表`（填「比亚迪」→ 期望 `002594`）的候选集此前**只**来自 `dataRegistry.search` → `eastmoneySearch.search(...).catch(() => [])`：JSONP 端点 `searchapi.eastmoney.com/api/suggest` 一旦不可达，catch 返回空数组、对话框 `setHits([])`，**没有本地兜底列表**，用例必然等不到 `option`。同文件的 `:127 期货分类可搜到合约` 早在 2026-10-09 就用 `stubFuturesSources`（`page.route` 打桩合约全集 + 联想）钉死供料，那两条没打桩——所以本条同时勘正 README 此前「外网依赖已切断」的口径：**当时切断的只是期货分类那一条**。现补 `stubStockSuggest(page)`：同款 `page.route` 形态、按 URL 的 `input` 参数查表、响应体包上 URL 里的回调名，行形状只给消费端 `stockInstrument`（`src/data/sources/eastmoney.ts:117-146`）真正读取的 `{Code, Name, MktNum, Classify, SecurityTypeName}` 五字段，未自造。**桩的承重证明刻意不靠「撤桩即红」**：撤桩（删两处调用）后两条仍 **2 passed**（17.5s，真实端点当下可达），故「断网必红」不能由撤桩自证；改跑两条正向探针——① 调用点不动、把桩体 `fulfill` 换成 `route.abort()` ⇒ **2 failed**，失败点正是 `getByRole('option', {name:/601318/})` 与 `/002594/` 的 `toBeVisible`（`element(s) not found`），独立复现了「端点不可达 ⇒ 零候选 ⇒ 无兜底」这条缺陷机制；② 桩内 Code 换位 601318→601319、002594→002595 ⇒ 同两处 **2 failed**，证明列表里那几个候选确实来自桩体而非真实网络。两条探针各自先证 md5 偏离基线再解读、跑完从备份恢复并复核 md5 一致。**代价照登**：桩把「真实联想命中质量」这一维度永久移出测试面。**仍存的外网前提**：切换后的 K 线与批量报价仍走真实源（腾讯/新浪/东财/币安），那是整串 E2E 的共同前提，不在本条裁决范围内。
- **价格轴宽维持 64，长标签溢出改在入口钳小数位（2026-10-16 四期-C1b'，用户改判取「入口钳位」而非「轴宽单向只增不减」）**：C1b 原裁法（轴宽 `max(64, 实测最宽标签)`）实施前取证推翻了原估——要 3–4 人日、要新增防抖，且 `AXIS_WIDTH` 有 8 个消费点跨 5 文件、`轴宽 → 图表区宽 → 可见 bar 数 → 价格域 → 标签 → 轴宽` 是闭环（借上一帧的域会在阈值上反复进出 ⇒ zoom 抖动）。同时实测出溢出阈值：轴条 64px、文字自左缘 58px 起算、5.75px/字符 ⇒ **≥10 字符抵线、≥11 字符压穿**，而正常行情要凑 11 字符需「2 位小数下价 ≥10⁷」或「percent ≥10000%」，**打不到**；唯一已证可达的路径是手工写进 localStorage 的 `instrument.decimals`——落盘校验 `src/store/watchlistPersist.ts:39-40` 只要求「有限数」，无上下界。故本批改治根因：在 `instrument.decimals` 的**唯一收口** `decimalsFor`（`src/data/format.ts:53-58`，顶栏 / 自选行 / 右键菜单 / 轴标签全走它）加两道钳位——上限新导出常量 `MAX_PRICE_DECIMALS = 8`（合法来源最高 6，留 2 位余量；变异 M3 把上限压到 4 会让**合法的币安 6 位对**一起变红，故不可更低）、下限 0。下限是取证之外的新发现：`toFixed` 只在 [0,100] 合法，落盘写 -5 会让轴标签**每帧抛 RangeError**（新单测里有一条不钳的 `toThrow(RangeError)` 作对照）。新增 `tests/unit/price-decimals-cap.test.ts` 5 例，四条变异各自先证 md5 偏离再解读；其中 M1（整条钳位去掉）复现出取证实形 `expected '50000000000000000000' to have a length of 8 but got 20`。**残留边界（如实登记，非本批缺陷）**：钳位治「小数位被污染」，不治「价格本身位数长」——价 ≥10⁷ 配合法小数位仍会顶到 64px 轴条，属轴宽固定口径下的已知边界；若日后要治它，须重开 C1b 的轴宽自适应并付上述 3–4 人日与防抖设计。

- **E2E 画线右键用例落点加固（2026-10-15 三期-D4）**：`interactions.spec.ts:101` 曾登记「整串串行偶发 30s 超时」，原归因为两点落点被 clamp 到同一根 bar。本轮用临时探针经 `__chartRenderer` 实取得反证一半：**画布 bbox=(52,38,·,644)**，而画线点击用**画布相对**坐标、早先采样用 `page.mouse.move` 的**视口**坐标，两者整体差 52px；`getViewport()` 在停靠栏开（宽 870）/关（宽 1190）两态恒为 `first=705.3 sp=8.00` ⇒ x→bar 映射**左锚定、与画布宽无关**，多出的宽度全在末柱之右的空白区；末柱钳位起点 ≈ 画布 x 758（`first` 摆一栏时 765/758），旧右端 740 只留 ≈2.2 根柱的余量，现收到 700（≈7 根柱），左端 600 不动（还要避开首次粘贴的副本，副本偏移 +3 栏 ≈24px）。同一画布相对点在 12s 内 `index` 恒 787、`cursorPrice` 逐 800ms 采 8 次零漂移 ⇒ live tick 抖动末柱不改主面板价域，**y 不漂**——时间维不是成因。失败样本的真实特征是「复制」menuitem 等满 `playwright.config.ts:13` 的 30s 用例预算，属**前提未成立**而非几何命中失败，且本轮未能复现原样本。故除收窄安全带外另加两条**点名前提**的同步（点工具后 `aria-pressed=true`、两点后 `expect.poll` 读引擎 `listDrawings()` 计数 +1），二者经变异验证非空转（期望改 `before+2` ⇒ 「第二条趋势线未入库 Expected 4 / Received 3」；改 `aria-pressed=false` ⇒ 14 次轮询均解析到 `true`）。门禁：该用例 12 连跑 + 同流程探针 8 连跑均命中、行数均 5；整串 `--retries=0` 串行两轮各 **67 passed**、27 面黄金截图零 diff。OPEN-DECISIONS 该行按其自记判据（「改 bbox/clamp 落点后整串串行连跑零失败」）就地关闭，并在 Resolution 里如实登记「关闭依据是零失败而非已证机制」。
- **应用块体积预算（2026-10-14 用户裁决）**：`vite.config.ts` 设 `build.chunkSizeWarningLimit = 560`。这是**登记的预算**，不是关掉警告——仓库同口径先例是 oxlint overrides「放宽是提阈值而非关闭」。当前块 520.66 kB（四期-C4c 后），约 39.34 kB 余量——C 批次（数据窗口）已随 C2 收口、D 批次已交付，余量的预留对象转为后续批次；B1→D3 的增量轨迹为 500.61 / 503.85 / 505.87 / 506.49 / 508.26 / 514.94 / 514.98 / 517.91。不拆动态 `import()`：`src/` 目前零动态导入边界，开第一刀会让「结构中性」的交付论证失去可比基线。证据：同一 506.49 kB 块在副本配置 500 档复现警告、560 档静默。真正的体积口径是 gzip 应用块上限。D3 后它被推到 148.45 kB / 裕度 1.55 kB，即「下一批同量级增量即触线」的那一批真的来了；**2026-10-15 用户裁决：提阈值 150 → 160**（与本条同一哲学，非关闭口径）。现 148.52 kB（D5 再 +0.01 kB、E1 再 +0.03 kB gzip、四期-C1a 再 +0.02 kB）、裕度 **11.48 kB**。**承重实查（登记而非默认）**：**登记时（三期-D5）**这条 gzip 口径没有脚本门禁，`package.json` 里没有 check:size 类命令、`.github/workflows/deploy.yml` 只跑 `verify` + `build`，它由 `vite.config.ts` 注释 + 本条 + 每批门禁复跑时的读数比对承载——所以那时「触线」不会让任何命令变红，提阈值松的是口径而非配置。**2026-10-15 四期-A2 补上了机械承载**：`scripts/check-bundle.mjs` + `npm run check:bundle`，并串进 `npm run verify` 末尾（CI 的 verify 步骤即含它 ⇒ 超阈值直接终止部署）。尺子差异照登：Vite 报 148.49 kB（Rust 压缩器）、脚本按 zlib level 6 报 147.61 kB，同一 160 阈值下脚本口径比 Vite 松 884 B ≈ 0.6%。四条探针（全部走 `check-bundle.mjs` 的**副本**，活脚本未动过一次）：① 副本阈值降为 140 ⇒ exit 1、打印超出 7.61 kB；② 副本把 `if (over)` 判定改成 `if (false)` ⇒ exit 0 且「裕度 −7.61 kB」，证明变红由该判定行承载而非打印语句；③ 副本的 `VENDOR_GROUPS` 误含 `index` ⇒ exit 2「未识别到应用块」，即分组名漏同步的后果是 fail-strict（误红，不会反向漏计应用增长）；④ 在无 `dist` 的目录跑活脚本 ⇒ exit 2。逐批净增轨迹仍在本条尾，属可核约束。
- **画线剪贴板是应用内内存态（2026-10-14 三期-C1，用户裁决，非缺陷）**：右键「复制」写入 `drawingStore.clipboard`，**不写 localStorage、不碰系统剪贴板**——刷新即空，跨页签搬运走既有的「导出 / 导入画线 JSON」。两条同批口径同样按裁决而非 bug 处理：粘贴体**保留锁定态**（保真优先于「粘出来就能改」，故连粘两次得两条锁定线）；锁定对象**只在右键可命中**（`menuHitAt`），双击仍不弹画线设置（`InputController.ts:279` 保留 `hitAt`）。
- **形态家族画线已修（2026-10-09）**：谐波四工具（gartley/bat/butterfly/crab）的比率标签无条件索引 `pts[4]`，而放置中的 `__preview` 走同一渲染路径，锚点不足 5 个时抛 TypeError；异常从 `pipeline.draw()` 逃出后 `ChartController` 的 rAF 循环不再自我重挂，**整张画布永久冻结**——用户侧表现为「ABCD 分类下其他划线工具没效果」，刷新页面才恢复。现整段比率标签以 `pts.length >= HARMONIC_LABELS.length` 守卫（不足时只画已有折线与锚点字母，同时避免越界点的 price 兜底 0 算出假比率）。回归：`tests/unit/drawing-pattern-render.test.ts`（9 工具 × 1..5 锚点逐档不抛错）。
- **rAF 帧循环已加固（2026-10-09）**：`ChartController.start()` 原把 `requestAnimationFrame(loop)` 排在帧体之后，帧体（尤其 `pipeline.draw()`）一次抛错就再也不挂帧 → 整张画布永久冻结，须刷新页面。现改为「先挂下一帧再干活」，单帧异常只丢这一帧。不吞异常：错误仍上抛到 `window.onerror`（syncBus 的 console.error 口径只用于隔离外部 handler，本处是引擎自身缺陷，需要响亮暴露）。回归双跑：`tests/unit/chart-raf-loop.test.ts`（假帧队列逐帧驱动，6 例——含「连续 5 帧异常不终止」「dispose 后不再挂帧」「重复 start 不叠加」）+ `tests/e2e/drawing.spec.ts` 真浏览器注入异常用例。两者按旧顺序实测均失败（旧实现第 1 帧抛错即死），非空断言。

- **TS7 迁移缺口已收口（2026-10-09，判定为文档口径缺口而非代码缺口）**：二期各批交付记录里的「TS6 typecheck 降级等效验证」是从 2026-10-08 一次**宿主环境故障**（TS7 原生二进制拒绝加载 bcrypt.dll → panic + exit 2，当次以 `npx -p typescript@6.0.3 tsc` 等效验证）复制来的措辞，被后续批次当模板沿用。实测现状：`typescript` 单依赖 = 7.0.2（无 `npm:` 别名）、平台二进制 `@typescript/typescript-win32-x64/lib/tsc.exe` 就位、`tsc --version` = 7.0.2、`npm run typecheck` 0 错（1.96s）/ `npm run build` 内联同一条 tsc 0 错，`--verbose` 重跑 stderr 无 panic → 门禁一直跑的就是 TS7 原生，本节上条基线声明为真。TS JS API 消费者为零（lint=oxlint、转译=Vite 8/Rolldown、E2E=Playwright 自带转译；`typescript` 包的 `exports["."]` 只指向 `lib/version.cjs`）。**易误判点**：`.oxlintrc.json` 的 `"@typescript-eslint/no-unused-vars": "off"` 是 oxlint 的规则命名空间（不是旧 npm 包，也不是死键）——探针证实它确实压制 TS 文件的 core `no-unused-vars`，未使用代码改由 tsc `noUnusedLocals/noUnusedParameters` 把关，删除会让门禁口径改变。**宿主故障复现判据**：TS7 的失败形态是 panic 打 stderr 且 exit 2，不得按「有输出即放行」处理；等效替代链在 TS7 单依赖下已不存在（无 tsc6 二进制），需要临时验证时用 `npx -y -p typescript@6.0.3 tsc -b tsconfig.json tsconfig.node.json --noEmit`。详见 `docs/PLAN-PHASE2.md` 二期-G 交付记录与 OPEN-DECISIONS 登记行。
- **依赖漏洞 → 0（2026-10-08 复核）**：经依赖升级专项批次（vite 5→8、vitest 3→5、react 18→19、
  zustand 4→5、TS 5.6→6.0.3、eslint 9→10，见 git log `507be30`…`956fa1f`），`npm run audit` 报
  **found 0 vulnerabilities**。复查命令不变：`npm run audit`（必须走官方 registry）。
  2026-10-08 二次审计：传递依赖 `source-map-js`（jsdom→css-tree / vite→postcss 链）出现 1 项
  high（GHSA-68fv-2mgg-jv7q），已 `npm audit fix --registry=...` 升至 1.2.2 修复；同批清理死
  依赖 `oxc-parser`（唯一消费者 check-file-size.mjs 已退役）并更新 semver 兼容依赖
  （radix minors / lucide 1.52 / plugin-react 6.1.2 / vite 8.3.3 / oxlint 1.87 / jsdom 30.1.2），
  全量门禁 + E2E 54/54（27 面黄金截图零 diff）实证行为中性。残留 outdated 仅跨主版本
  （@types/node 26 线对 Node 26、jsdom 29 线低于已装的 30）——按 engines 锁定 22 线不动。
- Node 版本要求已固化为 `engines: node >=22.22.2`（jsdom@30 的声明要求；npm 默认只警告不强制，旧环境 22.21.1 会打 `EBADENGINE` 警告）。
- `git blame` 建议启用忽略清单：`git config blame.ignoreRevsFile .git-blame-ignore-revs`（跳过纯格式化提交）。

已收口（2026-09-30）：无 lint 门禁 → 已引入 ESLint + `.editorconfig` + `.gitattributes`；单 chunk >500 kB → 已按 vendor 分块（最大应用块 445 kB）；canvas hex 无审计口径 → 已集中到 `palette.ts`，`.ts/.tsx` 中的 hex 259 → 90 且**使用点零字面量**（剩余全为 token/调色板定义、Pine 语言常量表与注释）；P2-B 画线家族无像素安全网 → 已补 6 面覆盖 25 个工具（黄金面 21 → 27）；Prettier 未全仓应用 → 已单批格式化（162 处内容变更，`format:check` 转绿，行为中性经 27 面黄金截图零 diff 证明）。

## 文档

命名约定：`docs/` 下按**体裁**前缀命名，全大写连字符式——`SPEC-`（规格）/ `PLAN-`（规划）/
`AUDIT-`（差距与风险评估）/ `DESIGN-`（施工设计）/ `DECISION-`（决策材料），
`docs/decisions/` 存**已裁决**（`ADR-NNN-*`）与未决登记册。体裁即文件名，不再靠 `P1`/`pixel` 这类批次代号表意。

| 文件 | 内容 |
|---|---|
| [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) | 开发计划与 1:1 对照清单（§3 为功能验收基线） |
| [docs/PLAN-PHASE2.md](docs/PLAN-PHASE2.md) | 二期七批次规格与交付记录；§3 二期「明确不做」清单、§5 决策点 D1/D2/D3 裁决（D1 不引入后端） |
| [docs/PLAN-PHASE3.md](docs/PLAN-PHASE3.md) | **三期规划（2026-10-12 三个决策点全部裁决完毕）**：批次 A–H 的范围/出处/人日，§3 明确不做结转 + 能力边界转正表，§4 裁决留档（D1 档 0 关闭重评 / D4 MTF 不做 / D6 收敛）；**三期-A 已交付**（§2-A），**三期-H 已交付**（§2-H 门禁盲区清偿），**三期-B0 已交付**（§2-B：设置态单一来源 + 偏好落盘），**三期-B1 已交付**（§2-B：图表设置「模板」页 + 模板 store，事件页撤项）；**三期-B2 已交付**（§2-B：「交易」页 + `tradeSettingsStore` 六处硬编码收口）；**三期-B3 已交付**（§2-B：「一般」页显示时区 + 引擎 additive `TimeDisplay` 链，**TV 对照的页级缺口清零**）；**三期-B4 已交付**（§2-B：四项待裁决的落实批——「警报」页补提示音入口，对话框现为 **9 页**；`chunkSizeWarningLimit = 560` 预算登记；交易偏好不入模板快照；`retries` 归零）；**三期-C1 已交付**（§2-C：画线右键「复制 / 粘贴 / 锁定」+ 应用内内存剪贴板，顺带修掉锁定对象在画布上无法右键解锁的单向门）；**三期全部批次已交付并收口（§5「三期收口判据」2026-10-15 满足，含同日 E/F 重排批）** |
| [docs/PLAN-PHASE4.md](docs/PLAN-PHASE4.md) | **四期规划（2026-10-15 取证 + 同日 D7/D10 裁决，开工中）**：§1 本轮重新查阅的四个结论——两份 AUDIT 抽验 15 行主差距全部已交付、其中 11 行整行闭合 4 行只剩余项（排期基线失真，A1 已就地标注勘正）、真缺口集中在「多图表是演示态」这一主题（6 条带行号证据）、其余为分散的复刻精度长尾、两处「已知边界」登记已不成立应就地勘正；§2 批次 A（审计勘正 + gzip 口径脚本化，**A1/A2/A3 已交付**）/ B（多图表真实化，8–11 人日，**D7 裁为本期不排、整批封存**，证据留档）/ C（精度长尾 4–6 人日，**C1a 刻度密度随轴高自适应已交付 2026-10-16**：`priceTickBudget` 单一来源 + 7 项变异全击杀 + 唯一重基线面 ⑥ `ma-macd`，见 §1.3 与 §2-C 交付记录；C1b 轴宽自适应经取证后**已重裁为 OPEN**，三选一含 3–4 人日与闭环放大风险）/ D（内容长尾，待 D9）/ E（**E1 回放中画线验证已交付 2026-10-15**：`tests/e2e/replay-drawing.spec.ts` 6 例 / 44 断言把十条现状钉成被测事实，顺带修掉磁吸「弱/强」档的 store→引擎断链，十条读数与 8 项变异见 §2-E；E2 手续费/滑点真模型，**D10 裁为做**）；§3 结转三期「明确不做」7 条与能力边界 5 条；§4 D7/D10/**D11（E1 取证后新增：回放态「画在未来」要不要限制，含「强磁铁读出未来 OHLC」这条泄露）已 RESOLVED**（D11 2026-10-16 裁为「不限制、口径入册」，零代码零像素，两条已知语义写入 `SPEC-TV-ALIGNMENT`）、D8（触发条件未成立）/D9 仍 OPEN；§5 排期 **A → E1 → C → E2**（6.5–10 人日） |
| [docs/SPEC-TV-ALIGNMENT.md](docs/SPEC-TV-ALIGNMENT.md) | TV 对齐 v2.0 主规格；**§12 变更记录 = 项目决策登记表** |
| [docs/SPEC-PHASE1-FEATURE-BREADTH.md](docs/SPEC-PHASE1-FEATURE-BREADTH.md) | 一期「功能广度」批次（原 `SPEC-P1`）规格与交付记录 |
| [docs/SPEC-PHASE1-CLOSEOUT.md](docs/SPEC-PHASE1-CLOSEOUT.md) | 一期「收官」批次（原 `SPEC-P2`）规格与交付记录 |
| [docs/AUDIT-TV-FEATURE-GAP.md](docs/AUDIT-TV-FEATURE-GAP.md) | 功能维度差距分析（TV × tradingPA，P0/P1/P2 池的来源）；**〔2026-10-15 四期-A1〕** 已就地加「复核」标注 2 行（Volume Profile、回放档位），未标注行=本轮未复核 |
| [docs/AUDIT-TV-UI-GAP.md](docs/AUDIT-TV-UI-GAP.md) | UI / 交互像素维度差距分析（设置对话框深度、右键菜单广度、token 收敛等缺口的登记处）；**〔2026-10-15 四期-A1〕** §1 主表（39 行）已就地加「复核」标注 15 行并附现行 `路径:行号`，原文单元格未改写；未标注行=本轮未复核 |
| [docs/AUDIT-ARCHITECTURE-REFACTOR.md](docs/AUDIT-ARCHITECTURE-REFACTOR.md) | 技术改造点与架构风险评估（只读分析，M0-M7 收尾期） |
| [docs/DESIGN-VOLUME-PROFILE.md](docs/DESIGN-VOLUME-PROFILE.md) | Volume Profile 数据管线与集成架构设计（配套 ADR-001） |
| [docs/PLAN-TECH-DEBT-CLOSEOUT.md](docs/PLAN-TECH-DEBT-CLOSEOUT.md) | 技术债收尾施工蓝图（历史存档，2026-09-30 已全部交付） |
| [docs/decisions/OPEN-DECISIONS.md](docs/decisions/OPEN-DECISIONS.md) | 未决项登记册（只追加 + 就地关闭） |
| [docs/decisions/ADR-001-volume-profile-kline-approx.md](docs/decisions/ADR-001-volume-profile-kline-approx.md) | Volume Profile kline 近似裁决 |
| [docs/DECISION-PHASE3-BACKEND.md](docs/DECISION-PHASE3-BACKEND.md) | **三期 D1 决策材料 + 裁决结果（§4.1）**：自建后端的收益/代价对照与分档（档 0–3）；2026-10-12 用户逐条答复五问（全「否」）→ **D1 维持档 0 并关闭重评入口**，§3「反向选项」表转正为能力边界口径 |
| [.workbuddy/memory/](.workbuddy/memory/) | 工作日志与踩坑记录（`pitfalls.jsonl`，未入版本库） |
