'use client';

import { useMemo } from 'react';
import { SmallWidget } from '@/components/widgets/base';
import { ProcessedTicker, FundingRateData, MarketCapData } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

interface FundingKillerProps {
  tickers: Map<string, ProcessedTicker>;
  fundingRateData: Map<string, FundingRateData>;
  marketCapData?: Map<string, MarketCapData>;
  onTokenClick?: (symbol: string) => void;
  onGroupClick?: (symbols: string[]) => void;
}

interface TokenWithApr {
  symbol: string;
  instId: string;
  apr: number;
  price: number;
  logo?: string;
}

// Calculate APR from funding rate
function calculateApr(rate: number, intervalHours: number): number {
  const periodsPerYear = (365 * 24) / intervalHours;
  return rate * periodsPerYear * 100;
}

export function FundingKiller({
  tickers,
  fundingRateData,
  marketCapData,
  onTokenClick,
  onGroupClick,
}: FundingKillerProps) {
  // Calculate killers
  const { longKillers, shortKillers } = useMemo(() => {
    const tokensWithApr: TokenWithApr[] = [];

    tickers.forEach((ticker, instId) => {
      if (ticker.baseSymbol === 'BTC' || ticker.baseSymbol === 'ETH') return;

      const fr = fundingRateData.get(instId);
      if (!fr) return;

      const apr = calculateApr(fr.fundingRate, fr.settlementInterval || 8);
      const mc = marketCapData?.get(ticker.baseSymbol);
      tokensWithApr.push({
        symbol: ticker.baseSymbol,
        instId,
        apr,
        price: ticker.priceNum,
        logo: mc?.logo,
      });
    });

    // Long killers: APR > 20% (expensive for longs)
    const longKillers = tokensWithApr
      .filter(t => t.apr > 20)
      .sort((a, b) => b.apr - a.apr);

    // Short killers: APR < -20% (expensive for shorts)
    const shortKillers = tokensWithApr
      .filter(t => t.apr < -20)
      .sort((a, b) => a.apr - b.apr);

    return { longKillers, shortKillers };
  }, [tickers, fundingRateData, marketCapData]);

  const displayLongKillers = longKillers.slice(0, 5);
  const displayShortKillers = shortKillers.slice(0, 5);
  const isLoading = tickers.size === 0;

  return (
    <SmallWidget
      title="Funding Killer"
      icon={<span>☠️</span>}
      subtitle="Funding rate APR > 20%"
      loading={isLoading}
    >
      <div className="space-y-4">
        {/* Short Killers Section (on top) */}
        <div>
          <div
            className={`flex items-center justify-between mb-3 pb-2 border-b border-gray-100 ${
              shortKillers.length > 0 ? 'cursor-pointer hover:opacity-80' : ''
            }`}
            onClick={() => shortKillers.length > 0 && onGroupClick?.(shortKillers.map(t => t.symbol))}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[12px] font-medium text-gray-700">Short Killer</span>
              <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {isLoading ? '--' : shortKillers.length}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-gray-400 w-16 text-center">Price</span>
              <span className="text-[10px] text-gray-400 w-16 text-center">APR</span>
            </div>
          </div>

          <div className="space-y-1">
            {displayShortKillers.length > 0 ? (
              displayShortKillers.map(t => (
                <div
                  key={t.instId}
                  className="flex items-center justify-between py-1.5 cursor-pointer hover:bg-gray-50 rounded -mx-2 px-2"
                  onClick={() => onTokenClick?.(t.symbol)}
                >
                  <div className="flex items-center gap-2">
                    {t.logo ? (
                      <img src={t.logo} alt={t.symbol} className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500">
                        {t.symbol.charAt(0)}
                      </div>
                    )}
                    <span className="text-[12px] font-medium text-gray-900">{t.symbol}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-gray-500 tabular-nums w-16 text-center">{formatPrice(t.price)}</span>
                    <span className="text-[12px] font-semibold text-green-500 tabular-nums w-16 text-center">
                      {t.apr.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-[11px] text-gray-400">
                No tokens with APR &lt; -20%
              </div>
            )}
          </div>
        </div>

        {/* Long Killers Section */}
        <div>
          <div
            className={`flex items-center justify-between mb-3 pb-2 border-b border-gray-100 ${
              longKillers.length > 0 ? 'cursor-pointer hover:opacity-80' : ''
            }`}
            onClick={() => longKillers.length > 0 && onGroupClick?.(longKillers.map(t => t.symbol))}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[12px] font-medium text-gray-700">Long Killer</span>
              <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {isLoading ? '--' : longKillers.length}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-gray-400 w-16 text-center">Price</span>
              <span className="text-[10px] text-gray-400 w-16 text-center">APR</span>
            </div>
          </div>

          <div className="space-y-1">
            {displayLongKillers.length > 0 ? (
              displayLongKillers.map(t => (
                <div
                  key={t.instId}
                  className="flex items-center justify-between py-1.5 cursor-pointer hover:bg-gray-50 rounded -mx-2 px-2"
                  onClick={() => onTokenClick?.(t.symbol)}
                >
                  <div className="flex items-center gap-2">
                    {t.logo ? (
                      <img src={t.logo} alt={t.symbol} className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500">
                        {t.symbol.charAt(0)}
                      </div>
                    )}
                    <span className="text-[12px] font-medium text-gray-900">{t.symbol}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-gray-500 tabular-nums w-16 text-center">{formatPrice(t.price)}</span>
                    <span className="text-[12px] font-semibold text-red-500 tabular-nums w-16 text-center">
                      +{t.apr.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-[11px] text-gray-400">
                No tokens with APR &gt; 20%
              </div>
            )}
          </div>
        </div>
      </div>
    </SmallWidget>
  );
}
