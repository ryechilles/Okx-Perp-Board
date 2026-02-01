'use client';

import { useMemo } from 'react';
import { SmallWidget } from '@/components/widgets/base';
import { TooltipContent } from '@/components/ui';
import { ProcessedTicker, FundingRateData, MarketCapData } from '@/lib/types';

interface FundingMarketProps {
  tickers: Map<string, ProcessedTicker>;
  fundingRateData: Map<string, FundingRateData>;
  marketCapData?: Map<string, MarketCapData>;
  onGroupClick?: (symbols: string[]) => void;
}

/**
 * FundingMarket - Shows funding rate market sentiment
 *
 * Displays count of positive vs negative funding rates
 * from top 100 coins by market cap
 */
export function FundingMarket({
  tickers,
  fundingRateData,
  marketCapData,
  onGroupClick,
}: FundingMarketProps) {
  const { positiveSymbols, negativeSymbols, neutralSymbols, total } = useMemo(() => {
    // Get tickers with market cap data, sorted by rank
    const tickersWithMcap: Array<{
      instId: string;
      symbol: string;
      rank: number;
      fundingRate: number;
    }> = [];

    tickers.forEach((ticker, instId) => {
      const mc = marketCapData?.get(ticker.baseSymbol);
      const fr = fundingRateData.get(instId);

      if (mc && mc.rank && mc.rank <= 100 && fr) {
        tickersWithMcap.push({
          instId,
          symbol: ticker.baseSymbol,
          rank: mc.rank,
          fundingRate: fr.fundingRate,
        });
      }
    });

    // Sort by rank and take top 100
    const top100 = tickersWithMcap
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 100);

    const positive: string[] = [];
    const negative: string[] = [];
    const neutral: string[] = [];

    top100.forEach((t) => {
      if (t.fundingRate > 0.0001) {
        positive.push(t.symbol);
      } else if (t.fundingRate < -0.0001) {
        negative.push(t.symbol);
      } else {
        neutral.push(t.symbol);
      }
    });

    return {
      positiveSymbols: positive,
      negativeSymbols: negative,
      neutralSymbols: neutral,
      total: top100.length,
    };
  }, [tickers, fundingRateData, marketCapData]);

  const positiveCount = positiveSymbols.length;
  const negativeCount = negativeSymbols.length;
  const neutralCount = neutralSymbols.length;

  const isLoading = tickers.size === 0;

  // Calculate percentages for the bar
  const positivePercent = total > 0 ? (positiveCount / total) * 100 : 0;
  const negativePercent = total > 0 ? (negativeCount / total) * 100 : 0;

  return (
    <SmallWidget
      title="Funding Market"
      icon={<span>📊</span>}
      subtitle="Top 100 by market cap"
      loading={isLoading}
      className="group"
      tooltip={
        <TooltipContent items={[
          <><span className="text-red-500">Positive</span>: rate &gt; 0.01% (longs pay shorts)</>,
          <><span className="text-green-500">Negative</span>: rate &lt; -0.01% (shorts pay longs)</>,
          <><span className="text-gray-500">Neutral</span>: between -0.01% ~ 0.01%</>,
        ]} />
      }
    >
      <div className="space-y-4">
        {/* Main Stats */}
        <div className="flex items-center justify-between">
          {/* Positive */}
          <div
            className={`text-center ${onGroupClick && positiveCount > 0 ? 'cursor-pointer hover:opacity-70' : ''}`}
            onClick={() => positiveCount > 0 && onGroupClick?.(positiveSymbols)}
          >
            <div className="text-[24px] font-bold text-red-500">
              {isLoading ? '--' : positiveCount}
            </div>
            <div className="text-[11px] text-gray-400">Positive</div>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-gray-200" />

          {/* Neutral */}
          <div
            className={`text-center ${onGroupClick && neutralCount > 0 ? 'cursor-pointer hover:opacity-70' : ''}`}
            onClick={() => neutralCount > 0 && onGroupClick?.(neutralSymbols)}
          >
            <div className="text-[24px] font-bold text-gray-400">
              {isLoading ? '--' : neutralCount}
            </div>
            <div className="text-[11px] text-gray-400">Neutral</div>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-gray-200" />

          {/* Negative */}
          <div
            className={`text-center ${onGroupClick && negativeCount > 0 ? 'cursor-pointer hover:opacity-70' : ''}`}
            onClick={() => negativeCount > 0 && onGroupClick?.(negativeSymbols)}
          >
            <div className="text-[24px] font-bold text-green-500">
              {isLoading ? '--' : negativeCount}
            </div>
            <div className="text-[11px] text-gray-400">Negative</div>
          </div>
        </div>

        {/* Visual Bar */}
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
          {total > 0 && (
            <>
              <div
                className="bg-red-500 transition-all duration-300"
                style={{ width: `${positivePercent}%` }}
              />
              <div
                className="bg-green-500 transition-all duration-300"
                style={{ width: `${negativePercent}%` }}
              />
            </>
          )}
        </div>

        {/* Percentage - Show on hover */}
        <div className="max-h-0 overflow-hidden opacity-0 group-hover:max-h-10 group-hover:opacity-100 transition-all duration-200">
          <div className="text-[11px] text-gray-400 text-center">
            {isLoading ? (
              'Loading...'
            ) : total === 0 ? (
              'No data available'
            ) : (
              <>
                <span className="text-red-500">{positivePercent.toFixed(0)}%</span>
                {' positive · '}
                <span className="text-green-500">{negativePercent.toFixed(0)}%</span>
                {' negative'}
              </>
            )}
          </div>
        </div>
      </div>
    </SmallWidget>
  );
}
