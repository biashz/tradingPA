import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { exit, cwd, stdout, stderr } from 'node:process';

/**
 * 应用块体积门禁（四期-A2）。
 *
 * 承载的口径：最大应用块 gzip ≤ 160 kB（2026-10-15 用户裁决「提阈值 150 → 160」，
 * 与 vite.config.ts 的 chunkSizeWarningLimit = 560 同属「提阈值而非关闭」；登记见
 * docs/decisions/OPEN-DECISIONS.md 的 gzip 行）。此前该口径只活在注释与文档里，
 * 「触线」不会让任何命令变红——本脚本让它变红。
 *
 * 读数口径（务必与文档比对时同尺）：本脚本用 node zlib 默认档位（level 6）。
 * Vite/Rolldown 自己报的 gzip 是 Rust 压缩器，实测同一 dist 下比本脚本**略大**
 * （应用块：脚本 147.61 kB vs Vite 148.49 kB，差 884 B ≈ 0.6%）。因此同一数值阈值下，
 * 本脚本比 Vite 报数口径松约 0.6%——登记而非隐瞒；原始体积那一半（560 kB）仍由 Vite 自身警告承载。
 * kB = 字节 / 1000（与 Vite 报数同单位，非 KiB）。
 */
const APP_GZIP_LIMIT_KB = 160;

/**
 * 第三方分组名，需与 vite.config.ts 的 build.rollupOptions.output.codeSplitting.groups 同步。
 * 漏同步的后果是 fail-strict：一个块未被认出即计入应用块（可能误红），不会反向漏计应用增长。
 */
const VENDOR_GROUPS = ['react', 'radix', 'lucide', 'zustand', 'vendor', 'rolldown-runtime'];

const ASSETS_DIR = join(cwd(), 'dist', 'assets');
const kB = (bytes) => (bytes / 1000).toFixed(2);
const fail = (msg, code) => {
  stderr.write(`${msg}\n`);
  exit(code);
};

if (!existsSync(ASSETS_DIR)) fail('未找到 dist/assets —— 先运行 npm run build（或 npm run verify）', 2);

const chunks = readdirSync(ASSETS_DIR)
  .filter((f) => f.endsWith('.js'))
  .map((f) => {
    const code = readFileSync(join(ASSETS_DIR, f));
    return {
      file: f,
      isVendor: VENDOR_GROUPS.some((g) => f.startsWith(`${g}-`)),
      raw: code.length,
      gzip: gzipSync(code).length,
    };
  })
  .sort((a, b) => b.gzip - a.gzip);

const app = chunks.filter((c) => !c.isVendor);
if (app.length === 0) fail('dist/assets 内未识别到应用块（全部命中第三方分组名）—— 检查 VENDOR_GROUPS 是否过期', 2);

const max = app[0];
const sum = (list, key) => list.reduce((acc, c) => acc + c[key], 0);

stdout.write(`体积门禁 · 应用块 ${app.length} 个（其余 ${chunks.length - app.length} 个为第三方分组）\n`);
for (const c of chunks) {
  stdout.write(
    `  ${c.isVendor ? 'vendor' : 'app   '} ${c.file.padEnd(32)} ${kB(c.raw).padStart(9)} kB │ gzip ${kB(c.gzip).padStart(9)} kB\n`,
  );
}
stdout.write(
  `合计 raw ${kB(sum(chunks, 'raw'))} kB / gzip ${kB(sum(chunks, 'gzip'))} kB（逐块相加口径，非对整包 gzip）\n` +
    `判据：最大应用块 ${max.file} · gzip ${kB(max.gzip)} kB ／ 上限 ${APP_GZIP_LIMIT_KB} kB\n`,
);

const over = max.gzip / 1000 > APP_GZIP_LIMIT_KB;
const diffBytes = max.gzip - APP_GZIP_LIMIT_KB * 1000;
if (over) {
  fail(
    `超阈值：最大应用块 gzip ${kB(max.gzip)} kB 超出 ${APP_GZIP_LIMIT_KB} kB 共 ${kB(diffBytes)} kB。\n` +
      '按本仓口径处置：先查本批净增是否可解释（README「应用块体积预算」有逐批轨迹），再决定回退冗余还是提阈值——提阈值属用户裁决，不擅改本常量。',
    1,
  );
}
stdout.write(`通过：裕度 ${kB(-diffBytes)} kB\n`);
