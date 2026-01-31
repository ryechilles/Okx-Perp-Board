'use client';

import { useMemo, useState } from 'react';
import { ProcessedTicker, FundingRateData, MarketCapData } from '@/lib/types';

interface FundingKillerProps {
  tickers: Map<string, ProcessedTicker>;
  fundingRateData: Map<string, FundingRateData>;
  marketCapData?: Map<string, MarketCapData>;
  onTokenClick?: (symbol: string) => void;
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
  }, [tickers, fundingRateData, marketCapData]);

  const displayLongKillers = longKillers.slice(0, 5);
  const displayShortKillers = shortKillers.slice(0, 5);
  const hasLongKillers = longKillers.length > 0;
  const hasShortKillers = shortKillers.length > 0;

  return (
    <div
      className="relative flex items-start gap-4 px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-default"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Long Killers Section */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-red-500">Long Killer</span>
          <span className="text-[11px] text-gray-400">({longKillers.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {hasLongKillers ? (
            displayLongKillers.map(t => (
              <div
                key={t.instId}
                className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 rounded cursor-pointer hover:bg-red-100 transition-colors"
                onClick={() => onTokenClick?.(t.symbol)}
                title={`${t.symbol}: +${t.apr.toFixed(1)}% APR`}
              >
                {t.logo && (
                  <img src={t.logo} alt={t.symbol} className="w-4 h-4 rounded-full" />
                )}
                <span className="text-[12px] font-medium text-gray-900">{t.symbol}</span>
              </div>
            ))
          ) : (
            <span className="text-[12px] text-gray-400">--</span>
          )}
          {longKillers.length > 5 && (
            <span className="text-[11px] text-gray-400">+{longKillers.length - 5}</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-gray-200 self-center" />

      {/* Short Killers Section */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-green-500">Short Killer</span>
          <span className="text-[11px] text-gray-400">({shortKillers.length})</span>
        </div>
        <div className="flex items-center gap-1">
          {hasShortKillers ? (
            displayShortKillers.map(t => (
              <div
                key={t.instId}
                className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 rounded cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => onTokenClick?.(t.symbol)}
                title={`${t.symbol}: ${t.apr.toFixed(1)}% APR`}
              >
                {t.logo && (
                  <img src={t.logo} alt={t.symbol} className="w-4 h-4 rounded-full" />
                )}
                <span className="text-[12px] font-medium text-gray-900">{t.symbol}</span>
              </div>
            ))
          ) : (
            <span className="text-[12px] text-gray-400">--</span>
          )}
          {shortKillers.length > 5 && (
            <span className="text-[11px] text-gray-400">+{shortKillers.length - 5}</span>
          )}
        </div>
      </div>

      {/* Hover tooltip - only shows filter logic */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 whitespace-nowrap">
          <div className="text-[11px] font-medium text-gray-500 mb-2">Funding Killer</div>
          <div className="space-y-1 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-red-500">●</span>
              <span className="text-gray-700">Long Killer: Funding APR &gt; 20%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">●</span>
              <span className="text-gray-700">Short Killer: Funding APR &lt; -20%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
