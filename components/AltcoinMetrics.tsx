'use client';

import { useMemo, useState } from 'react';
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
  price: number;
  change1h: number | null;
  change4h: number | null;
  change24h: number;
  logo?: string;
}

type TimeFrame = '1h' | '4h' | '24h';

// Format percentage with color
function formatChange(value: number | null | undefined): { text: string; color: string } {
  if (value === null || value === undefined) {
    return { text: '--', color: 'text-gray-400' };
  }
  const sign = value > 0 ? '+' : '';
  const color = value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-400';
  return { text: `${sign}${value.toFixed(2)}%`, color };
}

// Format price
function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toFixed(0)}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

export function AltcoinMetrics({ tickers, rsiData, marketCapData }: AltcoinMetricsProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('4h');

  // Get altcoins sorted by market cap (excluding BTC)
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
          price: ticker.priceNum,
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

  // Get change value based on selected timeframe
  const getChange = (token: TokenWithChange): number | null => {
    switch (timeFrame) {
      case '1h': return token.change1h;
      case '4h': return token.change4h;
      case '24h': return token.change24h;
    }
  };

  // Top gainers based on selected timeframe
  const topGainers = useMemo(() => {
    return [...top100]
      .filter(t => getChange(t) !== null)
      .sort((a, b) => (getChange(b) ?? 0) - (getChange(a) ?? 0))
      .slice(0, 5);
  }, [top100, timeFrame]);

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

  // Get avg for current timeframe
  const getAvg = (tier: 'top10' | 'top20' | 'top50'): number | null => {
    switch (timeFrame) {
      case '1h': return avgChanges[tier].avg1h;
      case '4h': return avgChanges[tier].avg4h;
      case '24h': return avgChanges[tier].avg24h;
    }
  };

  if (altcoins.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-4 mb-4">
      {/* Top Gainers Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 min-w-[280px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">涨幅榜 ▼</span>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['1h', '4h', '24h'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  timeFrame === tf
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {topGainers.map((token, i) => (
            <div key={token.instId} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 w-4">{i + 1}</span>
                {token.logo ? (
                  <img
                    src={token.logo}
                    alt={token.symbol}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                    {token.symbol.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900">{token.symbol}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{formatPrice(token.price)}</span>
                <span className={`text-sm font-medium ${formatChange(getChange(token)).color}`}>
                  {formatChange(getChange(token)).text}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Average Changes Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 min-w-[200px]">
        <div className="text-sm font-medium text-gray-700 mb-3">山寨平均涨幅</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Top 10</span>
            <span className={`text-sm font-medium ${formatChange(getAvg('top10')).color}`}>
              {formatChange(getAvg('top10')).text}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Top 20</span>
            <span className={`text-sm font-medium ${formatChange(getAvg('top20')).color}`}>
              {formatChange(getAvg('top20')).text}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Top 50</span>
            <span className={`text-sm font-medium ${formatChange(getAvg('top50')).color}`}>
              {formatChange(getAvg('top50')).text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
