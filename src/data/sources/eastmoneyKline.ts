import type { Bar, TimeframeId } from '@/types/market';
import { getTimeframe } from '@/types/market';
import { customIntervalMinutes } from '@/features/market/customInterval';
import type { Instrument } from '@/types/instrument';
import { aggregateBars } from '@/data/aggregate';
import { localTzOffsetMinutes } from '@/data/tz';
import { fetchJson } from './http';
import { NoHistoryError, type BarsRequest, type MarketSource } from './types';

/**
 * 东方财富 push2his：港股历史 K 线（腾讯缺口的回退源）。
 * 2026-11-02 spike 实测（curl 直连，见 docs/SPIKE-EASTMONEY-HK-MINUTE.md）：
 * - CORS 反射任意 Origin，且 cb= JSONP 同时可用，浏览器直连可行（fetch 口径）。
 * - klt=1 仅当日（end= 翻页参数实测无效）；trends2 ndays=5 补近 5 个交易日逐分钟。
 * - klt=5/15/30/60 约 23 个交易日窗口；klt=101/102/103 日/周/月全历史（2004 上市起）。
 * - kline 行格式「时间,开,收,高,低,量,额,幅」——收盘在第 3 位（与腾讯同序，非 OHLC）。
 * - trends2 行格式「时间,0,收,高,低,量,额,均价」——open 位恒 0，由前一点收盘重建。
 * - fqt=0 不复权 / 1 前复权；东财按源 IP 限流（上层 pollSchedule 已有退避，勿高频轮询）。
 * 边界（照登，非遗漏）：分钟线无更早历史可翻页（barsBefore 恒空）；周/月线 bar 时间戳
 * 为桶内最后交易日而非首日，与腾讯周/月线同口径。
 */

const KLINE_URL = 'https://push2his.eastmoney.com/api/qt/stock/kline/get';
const TRENDS_URL = 'https://push2his.eastmoney.com/api/qt/stock/trends2/get';

/** Instrument → 东财 secid。仅接港股回退：A股/美股腾讯可供给分钟线，不扩面。 */
export function secidOf(inst: Instrument): string | null {
  if (inst.market === 'hk') return `116.${inst.code}`;
  return null;
}

export type EmPlan = { kind: 'bars'; klt: number; aggregate: boolean } | { kind: 'none' };

/** 自定义周期 → 可整除的最大基础分钟周期（东财分钟线仅 1/5/15/30/60），与 tencent 同口径 */
function customMinutePlan(minutes: number): EmPlan {
  for (const n of [30, 15, 5]) {
    if (minutes % n === 0) return { kind: 'bars', klt: n, aggregate: minutes > n };
  }
  return minutes <= 30 ? { kind: 'bars', klt: 1, aggregate: minutes > 1 } : { kind: 'none' };
}

/** 周期 → 东财 klt。导出供单测：自定义周期归一化是沉默逻辑错误高发区。 */
export function planFor(tf: TimeframeId): EmPlan {
  const customMinutes = customIntervalMinutes(tf);
  if (customMinutes !== null) return customMinutePlan(customMinutes);
  switch (tf) {
    case '1m':
      return { kind: 'bars', klt: 1, aggregate: false };
    case '2m':
    case '3m':
      return { kind: 'bars', klt: 1, aggregate: true };
    case '5m':
      return { kind: 'bars', klt: 5, aggregate: false };
    case '15m':
      return { kind: 'bars', klt: 15, aggregate: false };
    case '30m':
      return { kind: 'bars', klt: 30, aggregate: false };
    case '45m':
      return { kind: 'bars', klt: 15, aggregate: true };
    case '1H':
      return { kind: 'bars', klt: 60, aggregate: false };
    case '2H':
    case '3H':
    case '4H':
    case '6H':
    case '8H':
    case '12H':
      return { kind: 'bars', klt: 60, aggregate: true };
    case '1D':
      return { kind: 'bars', klt: 101, aggregate: false };
    case '3D':
      return { kind: 'bars', klt: 101, aggregate: true };
    case '1W':
      return { kind: 'bars', klt: 102, aggregate: false };
    case '1M':
      return { kind: 'bars', klt: 103, aggregate: false };
    default:
      return { kind: 'none' };
  }
}

/** 「2026-11-02 09:31」或「2026-11-02」→ 交易所本地墙上时间（港股=北京时间），
 *  与 tencent.parseBarTime 同一口径：按浏览器本地时区构造。 */
export function parseEmTime(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?$/.exec(s);
  if (!m) return null;
  const t = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0)).getTime();
  return Number.isFinite(t) ? t : null;
}

const num = (v: string | undefined): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** kline 行：时间,开,收,高,低,量[,额,幅]——开收高低（收在第 3 位，与腾讯同序） */
export function parseKlineRow(line: string): Bar | null {
  const f = line.split(',');
  if (f.length < 6) return null;
  const time = parseEmTime(f[0]);
  if (time === null) return null;
  return {
    time,
    open: num(f[1]),
    close: num(f[2]),
    high: num(f[3]),
    low: num(f[4]),
    volume: num(f[5]),
  };
}

/** trends2 行：时间,0,收,高,低,量,额,均价——open 位恒 0，取前一点收盘重建（首点取自身收盘）。
 *  prevClose 语义是「前一个点的收盘」；前日收盘不能当 open（会落到当日 [low,high] 之外）。 */
export function parseTrendRow(line: string, prevClose: number): Bar | null {
  const f = line.split(',');
  if (f.length < 6) return null;
  const time = parseEmTime(f[0]);
  if (time === null) return null;
  const close = num(f[2]);
  return {
    time,
    open: prevClose > 0 ? prevClose : close,
    close,
    high: num(f[3]),
    low: num(f[4]),
    volume: num(f[5]),
  };
}

/** 逐点解析 trends2 行序列，open 由前一点收盘滚动重建；首点 open 取自身收盘 */
export function parseTrendRows(lines: string[]): Bar[] {
  const out: Bar[] = [];
  let prev = 0;
  for (const line of lines) {
    const bar = parseTrendRow(line, prev);
    if (!bar) continue;
    out.push(bar);
    prev = bar.close;
  }
  return out;
}

/** 当日真 OHLC（klt=1）覆盖历史重建段（trends2）的同刻 bar；按 time 升序合并去重 */
export function mergeMinuteBars(older: Bar[], today: Bar[]): Bar[] {
  const byTime = new Map<number, Bar>();
  for (const b of older) byTime.set(b.time, b);
  for (const b of today) byTime.set(b.time, b);
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

interface KlineResp {
  data?: { klines?: string[] } | null;
}

interface TrendsResp {
  data?: { trends?: string[]; preClose?: number } | null;
}

async function fetchKlineRows(secid: string, klt: number, lmt: number): Promise<Bar[]> {
  const url = `${KLINE_URL}?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56&klt=${klt}&fqt=${klt >= 101 ? 1 : 0}&end=20500101&lmt=${lmt}`;
  const resp = await fetchJson<KlineResp>(url);
  const lines = resp.data?.klines ?? [];
  return lines.map((l) => parseKlineRow(l)).filter((b): b is Bar => b !== null);
}

/** trends2 近 5 个交易日逐分钟（含当日），open 为重建值 */
async function fetchTrendBars(secid: string): Promise<Bar[]> {
  const url = `${TRENDS_URL}?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f52,f53,f54,f55,f56,f57,f58&iscr=0&ndays=5`;
  const resp = await fetchJson<TrendsResp>(url);
  return parseTrendRows(resp.data?.trends ?? []);
}

export const eastmoneyKlineSource: MarketSource = {
  name: '东方财富',
  markets: ['hk'],

  async bars({ instrument, timeframe, limit }: BarsRequest): Promise<Bar[]> {
    const secid = secidOf(instrument);
    if (!secid) throw new NoHistoryError(instrument, timeframe);
    const plan = planFor(timeframe);
    if (plan.kind === 'none') throw new NoHistoryError(instrument, timeframe);

    const tf = getTimeframe(timeframe);
    const baseSeconds = plan.klt <= 60 ? plan.klt * 60 : 86_400;
    const ratio = plan.aggregate && tf.seconds > 0 ? Math.ceil(tf.seconds / baseSeconds) : 1;
    const count = Math.min(1600, Math.max(limit, limit * ratio));

    let bars: Bar[];
    if (plan.klt === 1) {
      // 当日真 OHLC + trends2 近 5 日重建段；同刻以 klt=1 为准
      const [today, older] = await Promise.all([fetchKlineRows(secid, 1, Math.min(count, 400)), fetchTrendBars(secid)]);
      bars = mergeMinuteBars(older, today);
    } else {
      bars = await fetchKlineRows(secid, plan.klt, count);
    }
    if (bars.length === 0) throw new NoHistoryError(instrument, timeframe);

    if (!plan.aggregate) return bars.slice(-limit);
    return aggregateBars(bars, tf, localTzOffsetMinutes()).slice(-limit);
  },

  /** 分钟线窗口一次性给全（end= 翻页实测无效）、日线族更早历史由 tencent barsBefore 承担，
   *  故本源不做向左翻页。 */
  async barsBefore(): Promise<Bar[]> {
    return [];
  },
};
