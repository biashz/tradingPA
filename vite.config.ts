import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 基路径：Actions 环境由 GITHUB_REPOSITORY 推导（owner/repo → /repo/），
  // 本地开发与普通构建保持 '/'。无 react-router，单页应用无 SPA 回退问题。
  base: (() => {
    const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
    return process.env.GITHUB_ACTIONS && repo ? `/${repo}/` : '/';
  })(),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: false,
    // 新浪 K 线已改为 script 标签 JSONP 直连（2026-10-08），不再需要 dev server 代理
  },
  build: {
    /**
     * 体积预算（2026-10-14 用户裁决：提阈值并登记预算，非关闭）。
     * 判据沿革：原 500 kB 是 Vite 默认值，B1 起被应用块逐批推高——B1 500.61 / B2 503.85 /
     * B3 505.87 / B4 506.49 kB。四次越线是同一未裁决项在滚，而非四次新问题。
     * 取 560 = 现值 + 约 54 kB 余量，覆盖三期-C（数据窗口表格 + 画线剪贴板，估 5–7 人日）
     * 的量级；越过 560 仍会警告，与本仓 oxlint「存量函数放宽至 120、>120 仍拦」同一哲学。
     * 体积预算的另一半（gzip 口径，2026-10-15 用户裁决：150 → **160**，同为提阈值而非关闭）：
     * **该口径自 2026-10-15 四期-A2 起有机械承载**——`npm run check:bundle`（`scripts/check-bundle.mjs`，
     * 已串进 `npm run verify` 末尾，故触线会让 verify 与 CI 部署变红；阈值常量在该脚本内，本注释不复述数值以免两处漂移）。
     * 沿革照登：登记这条裁决时（三期-D5）它确实没有脚本门禁，只活在注释与文档里，「触线」从不让任何命令变红——
     * 四期-A2 补的就是这个承载物。读数尺子：Vite 报 148.49 kB（Rust 压缩器），脚本 zlib level 6 报 147.61 kB，
     * 同一阈值下脚本口径比 Vite 松 0.6%（884 B，远小于 11.51 kB 裕度，尺子差异写在脚本头注）。
     * 原始体积（本阈值）只作可见性信号。
     */
    chunkSizeWarningLimit: 560,
    rollupOptions: {
      output: {
        /**
         * 代码分割（按「第三方库 / 应用代码」切分）。
         * 只切已有静态依赖图，不引入任何动态 import——切割边界不改变
         * 模块求值顺序与副作用，因此对渲染与既有黄金截图是结构中性的。
         *
         * Vite 8 起底层换为 Rolldown，`manualChunks` 虽仍接受但分组不稳定
         * （实测：函数式规则下 React 仍被并入 radix 块，react 块只剩 0.18kB 空壳），
         * 故改用 Rolldown 的 `codeSplitting.groups`（`advancedChunks` 是它的旧名，
         * 用旧名会打弃用警告）：按 test 正则分组，groups 有序——先匹配者优先，
         * 兜底的 vendor 必须放最后。
         */
        codeSplitting: {
          groups: [
            { name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'radix', test: /[\\/]node_modules[\\/]@radix-ui[\\/]/ },
            { name: 'lucide', test: /[\\/]node_modules[\\/]lucide-react[\\/]/ },
            { name: 'zustand', test: /[\\/]node_modules[\\/]zustand[\\/]/ },
            { name: 'vendor', test: /[\\/]node_modules[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    // tsx 供需要 JSX 的渲染用例（四期-C4b 起：套 Radix Provider 时必须用 JSX 传 children）
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
