import type { Bar } from '@/types/market';

export type FeedStatus = 'idle' | 'loading' | 'live' | 'reconnecting' | 'error';

/** 请求在途（四期-C4b）：正在拉历史或正在重连。顶栏「重新加载」据此转圈并拒绝重复点击。
 *  与 ChartWorkspace 空白覆盖层的判据刻意不同——那条还要含 `idle`（首批未落地）且受 bars 空态约束。 */
export function isFeedBusy(status: FeedStatus): boolean {
  return status === 'loading' || status === 'reconnecting';
}

export interface HistoryInfo {
  /** true = 前插更早的历史（懒加载）；false = 全量替换（首批） */
  prepend: boolean;
}

export interface FeedEventHandlers {
  onHistory: (bars: Bar[], info: HistoryInfo) => void;
  /** 实时 K 线（同时间戳更新/新时间戳追加） */
  onLive: (bar: Bar) => void;
  onStatus: (status: FeedStatus, detail?: string) => void;
}

export interface FeedOptions {
  symbol: string;
  /** Binance 周期字符串（1m/5m/1H/1D...） */
  interval: string;
  /** K 线缓存的键（缺省用 symbol）。上层传品种全局 id（crypto:BTCUSDT），
   *  与 registry 路径的缓存键统一，避免同份数据按两种键名各存一份。 */
  cacheKey?: string;
  handlers: FeedEventHandlers;
}
