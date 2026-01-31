'use client';

import { useMemo, useState } from 'react';
import { ProcessedTicker, FundingRateData, MarketCapData } from '@/lib/types';

interface FundingKillerProps {
  tickers: Map<string, ProcessedTicker>;
  fundingRateData: Map<string, FundingRateData>;
  marketCapData?: Map<string, MarketCapData>;
  onTokenClick?: (symbol: string) => void;
  onLongKillersClick?: (symbols: string[]) => void;
  onShortKillersClick?: (symbols: string[]) => void;
}

interface TokenWithApr {
  symbol: string;
  instId: string;
  apr: number;
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
  onLongKillersClick,
  onShortKillersClick,
}: FundingKillerProps) {
  const [showTooltip, setShowTooltip] = useState(false);

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
  }, [tickers, fundingRateData]);

  const hasLongKillers = longKillers.length > 0;
  const hasShortKillers = shortKillers.length > 0;

  return (
    <div
      className="relative flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg cursor-default"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Icon */}
      <div className="w-4 h-4 flex items-center justify-center text-[12px]">
        💀
      </div>

      {/* Main content */}
      <div className="flex items-center gap-2 text-[13px] leading-none">
        <span className="font-medium text-gray-700">Funding Killer</span>
        <span className="text-gray-500">|</span>

        {/* Long Killer */}
        <span
          className={`font-medium tabular-nums cursor-pointer ${hasLongKillers ? 'text-red-500 hover:text-red-600' : 'text-gray-400'}`}
          onClick={() => hasLongKillers && onLongKillersClick?.(longKillers.map(t => t.symbol))}
        >
          Long {longKillers.length}
        </span>

        <span className="text-gray-500">|</span>

        {/* Short Killer */}
        <span
          className={`font-medium tabular-nums cursor-pointer ${hasShortKillers ? 'text-green-500 hover:text-green-600' : 'text-gray-400'}`}
          onClick={() => hasShortKillers && onShortKillersClick?.(shortKillers.map(t => t.symbol))}
        >
          Short {shortKillers.length}
        </span>
      </div>

      {/* Hover tooltip */}
      {showTooltip && (longKillers.length > 0 || shortKillers.length > 0) && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 whitespace-nowrap">
          <div className="text-[11px] font-medium text-gray-500 mb-2">Funding APR &gt;20% or &lt;-20%</div>

          <div className="flex gap-6">
            {/* Long Killers */}
            <div>
              <div className="text-[11px] font-medium text-red-500 mb-1.5">Long Killer (APR &gt;20%)</div>
              {longKillers.length > 0 ? (
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {longKillers.slice(0, 10).map(t => (
                    <div
                      key={t.instId}
                      className="flex items-center gap-2 text-[12px] cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
                      onClick={() => onTokenClick?.(t.symbol)}
                    >
                      {t.logo && (
                        <img src={t.logo} alt={t.symbol} className="w-4 h-4 rounded-full" />
                      )}
                      <span className="text-gray-900 font-medium">{t.symbol}</span>
                      <span className="text-red-500 tabular-nums">+{t.apr.toFixed(1)}%</span>
                    </div>
                  ))}
                  {longKillers.length > 10 && (
                    <div className="text-[11px] text-gray-500 px-1">+{longKillers.length - 10} more</div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-gray-400">None</div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px bg-gray-200" />

            {/* Short Killers */}
            <div>
              <div className="text-[11px] font-medium text-green-500 mb-1.5">Short Killer (APR &lt;-20%)</div>
              {shortKillers.length > 0 ? (
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {shortKillers.slice(0, 10).map(t => (
                    <div
                      key={t.instId}
                      className="flex items-center gap-2 text-[12px] cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
                      onClick={() => onTokenClick?.(t.symbol)}
                    >
                      {t.logo && (
                        <img src={t.logo} alt={t.symbol} className="w-4 h-4 rounded-full" />
                      )}
                      <span className="text-gray-900 font-medium">{t.symbol}</span>
                      <span className="text-green-500 tabular-nums">{t.apr.toFixed(1)}%</span>
                    </div>
                  ))}
                  {shortKillers.length > 10 && (
                    <div className="text-[11px] text-gray-500 px-1">+{shortKillers.length - 10} more</div>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-gray-400">None</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
