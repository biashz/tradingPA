import { describe, expect, it } from 'vitest';
import type { TimeframeId } from '@/types/market';
import { makeInstrument } from '@/types/instrument';
import {
  mergeMinuteBars,
  parseEmTime,
  parseKlineRow,
  parseTrendRow,
  parseTrendRows,
  planFor,
  secidOf,
} from '@/data/sources/eastmoneyKline';

const hk = (code = '00700') => makeInstrument('hk', code, '腾讯控股', { exchange: 'HKEX' });

describe('secid 映射：仅港股（116 市场号）', () => {
  it('港股 → 116.代码', () => {
    expect(secidOf(hk())).toBe('116.00700');
  });

  it('其余市场返回 null（A股/美股分钟线腾讯可供给，不扩面）', () => {
    expect(secidOf(makeInstrument('cn-sh', '600519', '贵州茅台'))).toBeNull();
    expect(secidOf(makeInstrument('us-nasdaq', 'AAPL', '苹果'))).toBeNull();
    expect(secidOf(makeInstrument('crypto', 'BTCUSDT', 'Bitcoin'))).toBeNull();
  });
});

describe('周期计划：klt 映射 / 聚合 / 自定义', () => {
  it('原生周期直取', () => {
    expect(planFor('1m')).toEqual({ kind: 'bars', klt: 1, aggregate: false });
    expect(planFor('5m')).toEqual({ kind: 'bars', klt: 5, aggregate: false });
    expect(planFor('15m')).toEqual({ kind: 'bars', klt: 15, aggregate: false });
    expect(planFor('30m')).toEqual({ kind: 'bars', klt: 30, aggregate: false });
    expect(planFor('1H')).toEqual({ kind: 'bars', klt: 60, aggregate: false });
    expect(planFor('1D')).toEqual({ kind: 'bars', klt: 101, aggregate: false });
    expect(planFor('1W')).toEqual({ kind: 'bars', klt: 102, aggregate: false });
    expect(planFor('1M')).toEqual({ kind: 'bars', klt: 103, aggregate: false });
  });

  it('非原生周期取最大可整除基期后聚合', () => {
    expect(planFor('2m')).toEqual({ kind: 'bars', klt: 1, aggregate: true });
    expect(planFor('3m')).toEqual({ kind: 'bars', klt: 1, aggregate: true });
    expect(planFor('45m')).toEqual({ kind: 'bars', klt: 15, aggregate: true });
    expect(planFor('3H')).toEqual({ kind: 'bars', klt: 60, aggregate: true });
    expect(planFor('3D')).toEqual({ kind: 'bars', klt: 101, aggregate: true });
  });

  it('秒级东财无供给，留 Binance', () => {
    expect(planFor('1s')).toEqual({ kind: 'none' });
    expect(planFor('30s')).toEqual({ kind: 'none' });
  });

  it('自定义周期与 tencent/gate 同口径', () => {
    expect(planFor('custom:45' as TimeframeId)).toEqual({ kind: 'bars', klt: 15, aggregate: true });
    expect(planFor('custom:30' as TimeframeId)).toEqual({ kind: 'bars', klt: 30, aggregate: false });
    expect(planFor('custom:7' as TimeframeId)).toEqual({ kind: 'bars', klt: 1, aggregate: true });
    expect(planFor('custom:37' as TimeframeId)).toEqual({ kind: 'none' });
  });
});

describe('时间解析：分钟与日线两种形态', () => {
  it('按浏览器本地时区构造，与 tencent.parseBarTime 同口径', () => {
    const t = parseEmTime('2026-11-02 09:31');
    expect(t).toBe(new Date(2026, 10, 2, 9, 31).getTime());
    expect(parseEmTime('2026-11-02')).toBe(new Date(2026, 10, 2).getTime());
    expect(parseEmTime('garbage')).toBeNull();
    expect(parseEmTime('2026/11/02 09:31')).toBeNull();
  });
});

describe('kline 行解析：开,收,高,低（收在开后第 2 位，钉死）', () => {
  it('按东财顺序取 OHLC（O,C,H,L 非 O,H,L,C）', () => {
    const bar = parseKlineRow('2026-11-02 09:31,387.600,388.000,388.400,384.600,801100,310143240.000,0.99');
    expect(bar).toEqual({
      time: new Date(2026, 10, 2, 9, 31).getTime(),
      open: 387.6,
      close: 388.0,
      high: 388.4,
      low: 384.6,
      volume: 801100,
    });
  });

  it('日线行（无时分）同样解析', () => {
    const bar = parseKlineRow('2026-10-30,377.600,383.600,384.000,376.200,12345678');
    expect(bar?.time).toBe(new Date(2026, 9, 30).getTime());
    expect(bar?.close).toBe(383.6);
  });

  it('脏行防护：字段不足 / 时间非法返回 null', () => {
    expect(parseKlineRow('2026-11-02 09:31,1,2')).toBeNull();
    expect(parseKlineRow('oops,1,2,3,4,5')).toBeNull();
  });
});

describe('trends2 行解析：open 位恒 0，由前一点收盘重建', () => {
  it('重建 open = 前一点 close；首点取自身 close（前日收盘不能当 open）', () => {
    const rows = parseTrendRows([
      '2026-10-27 09:30,0.000,387.000,387.000,387.000,544100,210566700.000,387.0000',
      '2026-10-27 09:31,0.000,390.200,390.200,386.400,377000,146068020.000,387.1834',
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].open).toBe(387.0); // 首点：自身收盘
    expect(rows[1].open).toBe(387.0); // 前一点收盘
    expect(rows[1].high).toBe(390.2);
    expect(rows[1].low).toBe(386.4);
    expect(rows[1].volume).toBe(377000);
  });

  it('单行接口同样接受 prevClose 参数', () => {
    const bar = parseTrendRow('2026-10-27 09:31,0.000,390.200,390.200,386.400,377000,1.00,2.00', 388.0);
    expect(bar?.open).toBe(388.0);
  });

  it('脏行防护', () => {
    expect(parseTrendRow('x,y,z', 1)).toBeNull();
    expect(parseTrendRows(['bad'])).toEqual([]);
  });
});

describe('合并：当日真 OHLC 覆盖同刻重建 bar', () => {
  it('同刻以 today 为准，整体时间升序', () => {
    const t = (h: number, m: number) => new Date(2026, 10, 2, h, m).getTime();
    const older = [
      { time: t(9, 30), open: 387, high: 387, low: 387, close: 387, volume: 100 },
      { time: t(9, 31), open: 387, high: 390, low: 386, close: 390, volume: 200 },
    ];
    const today = [{ time: t(9, 31), open: 387.6, high: 388.4, low: 384.6, close: 388, volume: 801100 }];
    const merged = mergeMinuteBars(older, today);
    expect(merged).toHaveLength(2);
    expect(merged[1]).toEqual({ time: t(9, 31), open: 387.6, high: 388.4, low: 384.6, close: 388, volume: 801100 });
    expect(merged[0].time).toBeLessThan(merged[1].time);
  });

  it('today 里的新刻度并入，空段不报错', () => {
    const t = (h: number, m: number) => new Date(2026, 10, 2, h, m).getTime();
    const merged = mergeMinuteBars([], [{ time: t(9, 31), open: 1, high: 2, low: 0.5, close: 1.5, volume: 1 }]);
    expect(merged).toHaveLength(1);
  });
});
