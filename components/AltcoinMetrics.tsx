'use client';

import { useMemo } from 'react';
import { ProcessedTicker, RSIData, MarketCapData } from '@/lib/types';

interface AltcoinMetricsProps {
  tickers: Map<string, ProcessedTicker>;
  rsiData: Map<string, RSIData>;
  marketCapData: Map<string, MarketCapData>;
}

interface TokenWithChange {
  symbol: string;
  instId: string;
  rank: number;
  change1h: number | null;
  change4h: number | null;
  change24h: number;
  logo?: string;
}

// Format percentage with color
function formatChange(value: number | null | undefined, showSign = true): { text: string; color: string } {
  if (value === null || value === undefined) {
    return { text: '--', color: 'text-gray-400' };
  }
  const sign = showSign && value > 0 ? '+' : '';
  const color = value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-400';
  return { text: `${sign}${value.toFixed(2)}%`, color };
}

export function AltcoinMetrics({ tickers, rsiData, marketCapData }: AltcoinMetricsProps) {
  // Get altcoins sorted by market cap (excluding BTC, rank 2-101)
  const altcoins = useMemo(() => {
    const tokens: TokenWithChange[] = [];

    tickers.forEach((ticker) => {
      const marketCap = marketCapData.get(ticker.baseSymbol);
      const rsi = rsiData.get(ticker.instId);

      // Skip BTC
      if (ticker.baseSymbol === 'BTC') return;

      // Only include tokens with market cap rank
      if (marketCap && marketCap.rank) {
        tokens.push({
          symbol: ticker.baseSymbol,
          instId: ticker.instId,
          rank: marketCap.rank,
          change1h: rsi?.change1h ?? null,
          change4h: rsi?.change4h ?? null,
          change24h: ticker.changeNum,
          logo: marketCap.logo,
        });
      }
    });

    // Sort by market cap rank
    return tokens.sort((a, b) => a.rank - b.rank);
  }, [tickers, rsiData, marketCapData]);

  // Top 100 altcoins (rank 2-101, excluding BTC)
  const top100 = useMemo(() => altcoins.slice(0, 100), [altcoins]);

  // Top gainers from top 100 (by 1h, 4h, 24h)
  const topGainers = useMemo(() => {
    const by1h = [...top100].filter(t => t.change1h !== null).sort((a, b) => (b.change1h ?? 0) - (a.change1h ?? 0)).slice(0, 5);
    const by4h = [...top100].filter(t => t.change4h !== null).sort((a, b) => (b.change4h ?? 0) - (a.change4h ?? 0)).slice(0, 5);
    const by24h = [...top100].sort((a, b) => b.change24h - a.change24h).slice(0, 5);
    return { by1h, by4h, by24h };
  }, [top100]);

  // Calculate average changes for different tiers
  const avgChanges = useMemo(() => {
    const calculateAvg = (tokens: TokenWithChange[]) => {
      const valid1h = tokens.filter(t => t.change1h !== null);
      const valid4h = tokens.filter(t => t.change4h !== null);

      return {
        avg1h: valid1h.length > 0 ? valid1h.reduce((sum, t) => sum + (t.change1h ?? 0), 0) / valid1h.length : null,
        avg4h: valid4h.length > 0 ? valid4h.reduce((sum, t) => sum + (t.change4h ?? 0), 0) / valid4h.length : null,
        avg24h: tokens.length > 0 ? tokens.reduce((sum, t) => sum + t.change24h, 0) / tokens.length : null,
      };
    };

    return {
      top10: calculateAvg(altcoins.slice(0, 10)),
      top20: calculateAvg(altcoins.slice(0, 20)),
      top50: calculateAvg(altcoins.slice(0, 50)),
    };
  }, [altcoins]);

  if (altcoins.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">山寨币指标</h3>

      {/* Average Changes Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Top 10 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-2">Top 10 平均涨幅</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">1h</span>
              <span className={formatChange(avgChanges.top10.avg1h).color}>
                {formatChange(avgChanges.top10.avg1h).text}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">4h</span>
              <span className={formatChange(avgChanges.top10.avg4h).color}>
                {formatChange(avgChanges.top10.avg4h).text}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">24h</span>
              <span className={formatChange(avgChanges.top10.avg24h).color}>
                {formatChange(avgChanges.top10.avg24h).text}
              </span>
            </div>
          </div>
        </div>

        {/* Top 20 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-2">Top 20 平均涨幅</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">1h</span>
              <span className={formatChange(avgChanges.top20.avg1h).color}>
                {formatChange(avgChanges.top20.avg1h).text}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">4h</span>
              <span className={formatChange(avgChanges.top20.avg4h).color}>
                {formatChange(avgChanges.top20.avg4h).text}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">24h</span>
              <span className={formatChange(avgChanges.top20.avg24h).color}>
                {formatChange(avgChanges.top20.avg24h).text}
              </span>
            </div>
          </div>
        </div>

        {/* Top 50 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-2">Top 50 平均涨幅</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">1h</span>
              <span className={formatChange(avgChanges.top50.avg1h).color}>
                {formatChange(avgChanges.top50.avg1h).text}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">4h</span>
              <span className={formatChange(avgChanges.top50.avg4h).color}>
                {formatChange(avgChanges.top50.avg4h).text}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">24h</span>
              <span className={formatChange(avgChanges.top50.avg24h).color}>
                {formatChange(avgChanges.top50.avg24h).text}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Gainers */}
      <div className="text-xs text-gray-500 mb-2">Top 100 涨幅榜前5</div>
      <div className="grid grid-cols-3 gap-3">
        {/* 1h Top Gainers */}
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1.5">1h</div>
          {topGainers.by1h.map((token, i) => (
            <div key={token.instId} className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400 w-3">{i + 1}</span>
                {token.logo && (
                  <img src={token.logo} alt={token.symbol} className="w-3.5 h-3.5 rounded-full" />
                )}
                <span className="text-xs text-gray-600">{token.symbol}</span>
              </div>
              <span className={`text-xs ${formatChange(token.change1h).color}`}>
                {formatChange(token.change1h).text}
              </span>
            </div>
          ))}
        </div>

        {/* 4h Top Gainers */}
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1.5">4h</div>
          {topGainers.by4h.map((token, i) => (
            <div key={token.instId} className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400 w-3">{i + 1}</span>
                {token.logo && (
                  <img src={token.logo} alt={token.symbol} className="w-3.5 h-3.5 rounded-full" />
                )}
                <span className="text-xs text-gray-600">{token.symbol}</span>
              </div>
              <span className={`text-xs ${formatChange(token.change4h).color}`}>
                {formatChange(token.change4h).text}
              </span>
            </div>
          ))}
        </div>

        {/* 24h Top Gainers */}
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-400 mb-1.5">24h</div>
          {topGainers.by24h.map((token, i) => (
            <div key={token.instId} className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400 w-3">{i + 1}</span>
                {token.logo && (
                  <img src={token.logo} alt={token.symbol} className="w-3.5 h-3.5 rounded-full" />
                )}
                <span className="text-xs text-gray-600">{token.symbol}</span>
              </div>
              <span className={`text-xs ${formatChange(token.change24h).color}`}>
                {formatChange(token.change24h).text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
