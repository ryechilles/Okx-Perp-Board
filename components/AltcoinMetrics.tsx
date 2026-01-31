'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';
import { LargeWidget } from '@/components/widgets/base';
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
          onClick={(e) => {
            e.stopPropagation();
            onChange(tf);
          }}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
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

  // Get top N symbols for filtering
  const getTopNSymbols = (n: number): string[] => {
    return altcoins.slice(0, n).map(t => t.symbol);
  };

  const isLoading = altcoins.length === 0;

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          Top Gainers Widget
          ════════════════════════════════════════════════════════════════ */}
      <LargeWidget
        title="Altcoin Top Gainers"
        icon={<TrendingUp className="w-5 h-5" />}
        subtitle="Top 5 from Top 100 by market cap"
        headerActions={<TimeFrameSelector value={gainersTimeFrame} onChange={setGainersTimeFrame} />}
        loading={isLoading}
        className="min-w-[300px] max-w-[360px]"
      >
        <div className="space-y-1">
          {isLoading ? (
            // Loading skeleton
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-gray-400 w-4">{i}</span>
                  <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
                  <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))
          ) : (
            topGainers.map((token, i) => {
              const change = getChangeByTimeFrame(token, gainersTimeFrame);
              return (
                <div
                  key={token.instId}
                  className="flex items-center justify-between py-1.5 cursor-pointer hover:bg-gray-50 rounded -mx-2 px-2"
                  onClick={() => onTokenClick?.(token.symbol)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-gray-400 w-4">{i + 1}</span>
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
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                        {token.symbol.charAt(0)}
                      </div>
                    )}
                    <span className="text-[13px] font-medium text-gray-900">{token.symbol}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] text-gray-500 tabular-nums">{formatPrice(token.price)}</span>
                    <span className={`text-[13px] font-semibold tabular-nums ${formatChange(change).color}`}>
                      {formatChange(change).text}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </LargeWidget>

      {/* ════════════════════════════════════════════════════════════════
          Avg Change vs BTC Widget
          ════════════════════════════════════════════════════════════════ */}
      <LargeWidget
        title="Altcoin Avg Change vs BTC"
        icon={<BarChart2 className="w-5 h-5" />}
        subtitle="Average change comparison by tier"
        headerActions={<TimeFrameSelector value={avgTimeFrame} onChange={setAvgTimeFrame} />}
        loading={isLoading}
        className="min-w-[340px] max-w-[420px]"
      >
        {/* Avg Change Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Left column - Altcoin tiers */}
          <div className="space-y-2">
            {(['top10', 'top20', 'top50'] as const).map((tier) => {
              const label = tier === 'top10' ? 'Top 10' : tier === 'top20' ? 'Top 20' : 'Top 50';
              const avg = getAvg(tier);
              const n = tier === 'top10' ? 10 : tier === 'top20' ? 20 : 50;
              return (
                <div
                  key={tier}
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded -mx-1 px-1 py-0.5"
                  onClick={() => onTopNClick?.(getTopNSymbols(n))}
                >
                  <span className="text-[12px] text-gray-500">{label}</span>
                  <span className={`text-[13px] font-semibold tabular-nums ${formatChange(avg).color}`}>
                    {formatChange(avg).text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right column - BTC */}
          <div
            className="flex flex-col items-center justify-center bg-orange-50 rounded-lg py-2 cursor-pointer hover:bg-orange-100"
            onClick={() => onTokenClick?.('BTC')}
          >
            <img
              src="https://assets.coingecko.com/coins/images/1/small/bitcoin.png"
              alt="BTC"
              className="w-6 h-6 rounded-full mb-1"
            />
            <span className="text-[11px] text-gray-500">BTC</span>
            <span className={`text-[14px] font-bold tabular-nums ${formatChange(getBtcChange()).color}`}>
              {formatChange(getBtcChange()).text}
            </span>
          </div>
        </div>

        {/* Ratio Section */}
        <div className="border-t border-gray-100 pt-3">
          <div className="text-[11px] text-gray-400 mb-2">Altcoin / BTC Ratio</div>
          <div className="space-y-1.5">
            {(['top10', 'top20', 'top50'] as const).map((tier) => {
              const alt = getAvg(tier);
              const btc = getBtcChange();
              const ratio = (() => {
                if (isLoading || btc === 0 || btc === null || alt === null) return '--';
                if ((alt >= 0 && btc >= 0) || (alt < 0 && btc < 0)) {
                  return `${Math.abs(alt / btc).toFixed(2)}x`;
                }
                return '↕';
              })();
              const tierLabel = tier === 'top10' ? 'Top 10' : tier === 'top20' ? 'Top 20' : 'Top 50';
              const altDir = alt !== null ? (alt >= 0 ? '↑' : '↓') : '';
              const btcDir = btc !== null ? (btc >= 0 ? '↑' : '↓') : '';
              const altColor = alt !== null ? (alt >= 0 ? 'text-green-500' : 'text-red-500') : 'text-gray-400';
              const btcColor = btc !== null ? (btc >= 0 ? 'text-green-500' : 'text-red-500') : 'text-gray-400';

              return (
                <div key={tier} className="flex items-center text-[12px]">
                  <span className="text-gray-500 w-16">{tierLabel}</span>
                  <span className="font-semibold text-gray-800 w-12 tabular-nums">{ratio}</span>
                  <span className="text-gray-300 mx-2">|</span>
                  <span className={`${altColor}`}>Alt {altDir}</span>
                  <span className="text-gray-300 mx-1.5">vs</span>
                  <span className={`${btcColor}`}>BTC {btcDir}</span>
                </div>
              );
            })}
          </div>
        </div>
      </LargeWidget>
    </>
  );
}
