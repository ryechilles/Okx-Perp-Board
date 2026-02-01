'use client';

import { useMemo } from 'react';
import { SmallWidget } from '@/components/widgets/base';
import { ProcessedTicker, FundingRateData, MarketCapData } from '@/lib/types';

interface FundingMarketProps {
  tickers: Map<string, ProcessedTicker>;
  fundingRateData: Map<string, FundingRateData>;
  marketCapData?: Map<string, MarketCapData>;
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
}: FundingMarketProps) {
  const { positiveCount, negativeCount, neutralCount, total } = useMemo(() => {
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

    let positive = 0;
    let negative = 0;
    let neutral = 0;

    top100.forEach((t) => {
      if (t.fundingRate > 0.0001) {
        positive++;
      } else if (t.fundingRate < -0.0001) {
        negative++;
      } else {
        neutral++;
      }
    });

    return {
      positiveCount: positive,
      negativeCount: negative,
      neutralCount: neutral,
      total: top100.length,
    };
  }, [tickers, fundingRateData, marketCapData]);

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
    >
      <div className="space-y-4">
        {/* Main Stats */}
        <div className="flex items-center justify-between">
          {/* Positive */}
          <div className="text-center">
            <div className="text-[24px] font-bold text-red-500">
              {isLoading ? '--' : positiveCount}
            </div>
            <div className="text-[11px] text-gray-400">Positive</div>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-gray-200" />

          {/* Neutral */}
          <div className="text-center">
            <div className="text-[24px] font-bold text-gray-400">
              {isLoading ? '--' : neutralCount}
            </div>
            <div className="text-[11px] text-gray-400">Neutral</div>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-gray-200" />

          {/* Negative */}
          <div className="text-center">
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

        {/* Description */}
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
    </SmallWidget>
  );
}
