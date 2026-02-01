'use client';

import { useMemo } from 'react';
import { SmallWidget } from '@/components/widgets/base';
import { TooltipContent, TokenRowItem, TokenRowEmpty } from '@/components/ui';
import { ProcessedTicker, FundingRateData, MarketCapData } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { calculateFundingApr } from '@/lib/widget-utils';

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

// Section header component
function KillerSectionHeader({
  title,
  count,
  color,
  isLoading,
  onClick,
}: {
  title: string;
  count: number;
  color: 'green' | 'red';
  isLoading: boolean;
  onClick?: () => void;
}) {
  const dotColor = color === 'green' ? 'bg-green-500' : 'bg-red-500';
  const canClick = count > 0 && onClick;

  return (
    <div
      className={`flex items-center justify-between mb-3 pb-2 border-b border-gray-100 ${
        canClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      onClick={() => canClick && onClick()}
    >
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-[12px] font-medium text-gray-700">{title}</span>
        <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
          {isLoading ? '--' : count}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] text-gray-400 w-16 text-center">Price</span>
        <span className="text-[10px] text-gray-400 w-16 text-center">APR</span>
      </div>
    </div>
  );
}

export function FundingKiller({
  tickers,
  fundingRateData,
  marketCapData,
  onTokenClick,
  onGroupClick,
}: FundingKillerProps) {
  const { longKillers, shortKillers } = useMemo(() => {
    const tokensWithApr: TokenWithApr[] = [];

    tickers.forEach((ticker, instId) => {
      if (ticker.baseSymbol === 'BTC' || ticker.baseSymbol === 'ETH') return;

      const fr = fundingRateData.get(instId);
      if (!fr) return;

      const apr = calculateFundingApr(fr.fundingRate, fr.settlementInterval || 8);
      const mc = marketCapData?.get(ticker.baseSymbol);
      tokensWithApr.push({
        symbol: ticker.baseSymbol,
        instId,
        apr,
        price: ticker.priceNum,
        logo: mc?.logo,
      });
    });

    return {
      longKillers: tokensWithApr.filter(t => t.apr > 20).sort((a, b) => b.apr - a.apr),
      shortKillers: tokensWithApr.filter(t => t.apr < -20).sort((a, b) => a.apr - b.apr),
    };
  }, [tickers, fundingRateData, marketCapData]);

  const displayLongKillers = longKillers.slice(0, 5);
  const displayShortKillers = shortKillers.slice(0, 5);
  const isLoading = tickers.size === 0;

  const renderTokenRow = (token: TokenWithApr, colorClass: string, showSign: boolean) => (
    <TokenRowItem
      key={token.instId}
      symbol={token.symbol}
      logo={token.logo}
      onClick={() => onTokenClick?.(token.symbol)}
      rightContent={
        <>
          <span className="text-[11px] text-gray-500 tabular-nums w-16 text-center">
            {formatPrice(token.price)}
          </span>
          <span className={`text-[12px] font-semibold tabular-nums w-16 text-center ${colorClass}`}>
            {showSign && token.apr > 0 ? '+' : ''}{token.apr.toFixed(1)}%
          </span>
        </>
      }
    />
  );

  return (
    <SmallWidget
      title="Funding Killer"
      icon={<span>☠️</span>}
      subtitle="Funding rate APR > 20%"
      loading={isLoading}
      tooltip={
        <TooltipContent items={[
          <><span className="text-red-500">Long Killer</span>: APR &gt; 20% (expensive to hold longs)</>,
          <><span className="text-green-500">Short Killer</span>: APR &lt; -20% (expensive to hold shorts)</>,
          "APR = Funding Rate × (365 × 24 / interval)",
        ]} />
      }
    >
      <div className="space-y-4">
        {/* Short Killers Section */}
        <div>
          <KillerSectionHeader
            title="Short Killer"
            count={shortKillers.length}
            color="green"
            isLoading={isLoading}
            onClick={() => onGroupClick?.(shortKillers.map(t => t.symbol))}
          />
          <div className="space-y-1">
            {displayShortKillers.length > 0 ? (
              displayShortKillers.map(t => renderTokenRow(t, 'text-green-500', false))
            ) : (
              <TokenRowEmpty message="No tokens with APR < -20%" />
            )}
          </div>
        </div>

        {/* Long Killers Section */}
        <div>
          <KillerSectionHeader
            title="Long Killer"
            count={longKillers.length}
            color="red"
            isLoading={isLoading}
            onClick={() => onGroupClick?.(longKillers.map(t => t.symbol))}
          />
          <div className="space-y-1">
            {displayLongKillers.length > 0 ? (
              displayLongKillers.map(t => renderTokenRow(t, 'text-red-500', true))
            ) : (
              <TokenRowEmpty message="No tokens with APR > 20%" />
            )}
          </div>
        </div>
      </div>
    </SmallWidget>
  );
}
