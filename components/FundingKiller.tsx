'use client';

import { useMemo, useState } from 'react';
import { ProcessedTicker, FundingRateData, MarketCapData } from '@/lib/types';

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

  return (
    <div
      className="relative px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-default"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Title */}
      <div className="text-[13px] font-medium text-gray-700 mb-2">☠️ Funding Rate Killer</div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Long Killers Column */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between mb-1">
            <div
              className={`flex items-center gap-1.5 ${longKillers.length > 0 ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={() => longKillers.length > 0 && onGroupClick?.(longKillers.map(t => t.symbol))}
            >
              <span className="text-gray-500">Long Killer</span>
              <span className="text-[11px] text-gray-400">{longKillers.length}</span>
            </div>
            <span className="text-[10px] text-gray-400 ml-2">APR</span>
          </div>
          {displayLongKillers.length > 0 ? (
            displayLongKillers.map(t => (
              <div
                key={t.instId}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 -mx-1"
                onClick={() => onTokenClick?.(t.symbol)}
              >
                {t.logo ? (
                  <img src={t.logo} alt={t.symbol} className="w-4 h-4 rounded-full" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-500">{t.symbol.charAt(0)}</div>
                )}
                <span className="text-[12px] font-medium text-gray-900 w-14">{t.symbol}</span>
                <span className="text-[12px] text-red-500 tabular-nums text-right w-20">+{t.apr.toFixed(1)}%</span>
              </div>
            ))
          ) : (
            <span className="text-[12px] text-gray-400">--</span>
          )}
        </div>

        {/* Divider */}
        <div className="text-[11px] text-gray-500 self-center">|</div>

        {/* Short Killers Column */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between mb-1">
            <div
              className={`flex items-center gap-1.5 ${shortKillers.length > 0 ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={() => shortKillers.length > 0 && onGroupClick?.(shortKillers.map(t => t.symbol))}
            >
              <span className="text-gray-500">Short Killer</span>
              <span className="text-[11px] text-gray-400">{shortKillers.length}</span>
            </div>
            <span className="text-[10px] text-gray-400 ml-2">APR</span>
          </div>
          {displayShortKillers.length > 0 ? (
            displayShortKillers.map(t => (
              <div
                key={t.instId}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 -mx-1"
                onClick={() => onTokenClick?.(t.symbol)}
              >
                {t.logo ? (
                  <img src={t.logo} alt={t.symbol} className="w-4 h-4 rounded-full" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-500">{t.symbol.charAt(0)}</div>
                )}
                <span className="text-[12px] font-medium text-gray-900 w-14">{t.symbol}</span>
                <span className="text-[12px] text-green-500 tabular-nums text-right w-20">{t.apr.toFixed(1)}%</span>
              </div>
            ))
          ) : (
            <span className="text-[12px] text-gray-400">--</span>
          )}
        </div>
      </div>

      {/* Hover tooltip - only shows filter logic */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 whitespace-nowrap">
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
