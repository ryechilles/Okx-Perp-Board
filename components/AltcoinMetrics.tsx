'use client';

import { useMemo, useState } from 'react';
import { ProcessedTicker, RSIData, MarketCapData } from '@/lib/types';

interface AltcoinMetricsProps {
  tickers: Map<string, ProcessedTicker>;
  rsiData: Map<string, RSIData>;
  marketCapData: Map<string, MarketCapData>;
  onTokenClick?: (symbol: string) => void;
  onTopNClick?: (symbols: string[]) => void;
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

// Time frame selector component
function TimeFrameSelector({ value, onChange }: { value: TimeFrame; onChange: (tf: TimeFrame) => void }) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5">
      {(['1h', '4h', '24h'] as TimeFrame[]).map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-2 py-0.5 text-xs font-medium rounded-md transition-colors ${
            value === tf
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}

export function AltcoinMetrics({ tickers, rsiData, marketCapData, onTokenClick, onTopNClick }: AltcoinMetricsProps) {
  const [gainersTimeFrame, setGainersTimeFrame] = useState<TimeFrame>('4h');
  const [avgTimeFrame, setAvgTimeFrame] = useState<TimeFrame>('4h');
  const [showGainersTooltip, setShowGainersTooltip] = useState(false);
  const [showAvgTooltip, setShowAvgTooltip] = useState(false);

  // Get BTC data
  const btcData = useMemo(() => {
    let btcTicker: ProcessedTicker | undefined;
    tickers.forEach((ticker) => {
      if (ticker.baseSymbol === 'BTC') {
        btcTicker = ticker;
      }
    });
    if (!btcTicker) return null;

    const rsi = rsiData.get(btcTicker.instId);
    return {
      change1h: rsi?.change1h ?? null,
      change4h: rsi?.change4h ?? null,
      change24h: btcTicker.changeNum,
    };
  }, [tickers, rsiData]);

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

  // Get change value based on timeframe
  const getChangeByTimeFrame = (token: TokenWithChange, tf: TimeFrame): number | null => {
    switch (tf) {
      case '1h': return token.change1h;
      case '4h': return token.change4h;
      case '24h': return token.change24h;
    }
  };

  // Top gainers based on gainers timeframe
  const topGainers = useMemo(() => {
    return [...top100]
      .filter(t => getChangeByTimeFrame(t, gainersTimeFrame) !== null)
      .sort((a, b) => (getChangeByTimeFrame(b, gainersTimeFrame) ?? 0) - (getChangeByTimeFrame(a, gainersTimeFrame) ?? 0))
      .slice(0, 5);
  }, [top100, gainersTimeFrame]);

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

  // Get avg for average timeframe
  const getAvg = (tier: 'top10' | 'top20' | 'top50'): number | null => {
    switch (avgTimeFrame) {
      case '1h': return avgChanges[tier].avg1h;
      case '4h': return avgChanges[tier].avg4h;
      case '24h': return avgChanges[tier].avg24h;
    }
  };

  // Get BTC change for selected timeframe
  const getBtcChange = (): number | null => {
    if (!btcData) return null;
    switch (avgTimeFrame) {
      case '1h': return btcData.change1h;
      case '4h': return btcData.change4h;
      case '24h': return btcData.change24h;
    }
  };

  // Get summary info for altcoin vs BTC performance
  const getPerformanceSummary = (): { altStatus: string; btcStatus: string; summary: string } | null => {
    const altAvg = getAvg('top20'); // Use top20 as reference
    const btcChange = getBtcChange();

    if (altAvg === null || btcChange === null) {
      return null;
    }

    const altStatus = altAvg >= 0 ? 'Altcoin ↑' : 'Altcoin ↓';
    const btcStatus = btcChange >= 0 ? 'BTC ↑' : 'BTC ↓';
    const altBetter = altAvg > btcChange;
    const summary = altBetter ? '山寨币跑赢 BTC' : '山寨币跑输 BTC';

    return { altStatus, btcStatus, summary };
  };

  // Get top N symbols for filtering
  const getTopNSymbols = (n: number): string[] => {
    return altcoins.slice(0, n).map(t => t.symbol);
  };

  const isLoading = altcoins.length === 0;

  return (
    <div className="flex items-start gap-4 mb-4">
      {/* Top Gainers Card */}
      <div
        className="relative bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-[300px]"
        onMouseEnter={() => setShowGainersTooltip(true)}
        onMouseLeave={() => setShowGainersTooltip(false)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-gray-700">Altcoin Top Gainers</span>
          <TimeFrameSelector value={gainersTimeFrame} onChange={setGainersTimeFrame} />
        </div>

        {/* Hover tooltip */}
        {showGainersTooltip && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
            <div className="text-[11px] text-gray-600 whitespace-nowrap">
              Top 5 gainers from top 100 altcoins by market cap (excluding BTC)
            </div>
          </div>
        )}

        <div className="space-y-1">
          {isLoading ? (
            // Loading skeleton
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-gray-400 w-3">{i}</span>
                  <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
                  <div className="w-10 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="w-10 h-3 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))
          ) : (
            topGainers.map((token, i) => {
              const change = getChangeByTimeFrame(token, gainersTimeFrame);
              return (
                <div
                  key={token.instId}
                  className="flex items-center justify-between py-0.5 cursor-pointer hover:bg-gray-50 rounded -mx-1.5 px-1.5"
                  onClick={() => onTokenClick?.(token.symbol)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-gray-400 w-3">{i + 1}</span>
                    {token.logo ? (
                      <img
                        src={token.logo}
                        alt={token.symbol}
                        className="w-5 h-5 rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                        {token.symbol.charAt(0)}
                      </div>
                    )}
                    <span className="text-[13px] font-medium text-gray-900">{token.symbol}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-gray-500">{formatPrice(token.price)}</span>
                    <span className={`text-[13px] font-medium ${formatChange(change).color}`}>
                      {formatChange(change).text}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Average Changes Card */}
      <div
        className="relative px-3 py-2 bg-white border border-gray-200 rounded-lg"
        onMouseEnter={() => setShowAvgTooltip(true)}
        onMouseLeave={() => setShowAvgTooltip(false)}
      >
        {/* Title and time selector */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-gray-700">Altcoin Avg Change</span>
          <TimeFrameSelector value={avgTimeFrame} onChange={setAvgTimeFrame} />
        </div>

        {/* Avg Change rows */}
        <div className="space-y-1 text-[12px] mb-2">
          <div className="flex items-center">
            <span className="text-gray-600">Altcoin Top10:</span>
            <span
              className={`font-medium ml-2 cursor-pointer hover:opacity-80 ${formatChange(getAvg('top10')).color}`}
              onClick={() => onTopNClick?.(getTopNSymbols(10))}
            >
              {isLoading ? '--' : formatChange(getAvg('top10')).text}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600">Altcoin Top20:</span>
            <span
              className={`font-medium ml-2 cursor-pointer hover:opacity-80 ${formatChange(getAvg('top20')).color}`}
              onClick={() => onTopNClick?.(getTopNSymbols(20))}
            >
              {isLoading ? '--' : formatChange(getAvg('top20')).text}
            </span>
            <span className="text-gray-300 mx-2">|</span>
            <span className="text-gray-600">BTC:</span>
            <span
              className={`font-medium ml-2 cursor-pointer hover:opacity-80 ${formatChange(getBtcChange()).color}`}
              onClick={() => onTokenClick?.('BTC')}
            >
              {isLoading ? '--' : formatChange(getBtcChange()).text}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600">Altcoin Top50:</span>
            <span
              className={`font-medium ml-2 cursor-pointer hover:opacity-80 ${formatChange(getAvg('top50')).color}`}
              onClick={() => onTopNClick?.(getTopNSymbols(50))}
            >
              {isLoading ? '--' : formatChange(getAvg('top50')).text}
            </span>
          </div>
        </div>

        {/* Performance summary */}
        {!isLoading && getPerformanceSummary() && (
          <div className="text-[12px] text-gray-500 border-t border-gray-100 pt-2">
            <span>{getPerformanceSummary()?.altStatus}</span>
            <span className="mx-2">|</span>
            <span>{getPerformanceSummary()?.btcStatus}</span>
            <span className="mx-2">→</span>
            <span className="text-gray-700 font-medium">{getPerformanceSummary()?.summary}</span>
          </div>
        )}

        {/* Hover tooltip */}
        {showAvgTooltip && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
            <div className="text-[11px] text-gray-600 whitespace-nowrap">
              Average price change of top N altcoins by market cap (excluding BTC)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
