'use client';

import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { SmallWidget } from '@/components/widgets/base';
import { TokenAvatar, TooltipContent, TimeFrameSelector } from '@/components/ui';
import { ProcessedTicker, RSIData, MarketCapData } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { TimeFrame, TokenWithChange, formatChange, getChangeByTimeFrame } from '@/lib/widget-utils';

interface AltcoinTopGainersProps {
  tickers: Map<string, ProcessedTicker>;
  rsiData: Map<string, RSIData>;
  marketCapData: Map<string, MarketCapData>;
  onTokenClick?: (symbol: string) => void;
}

export function AltcoinTopGainers({ tickers, rsiData, marketCapData, onTokenClick }: AltcoinTopGainersProps) {
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

  // Top 100 altcoins
  const top100 = useMemo(() => altcoins.slice(0, 100), [altcoins]);

  // Top gainers
  const topGainers = useMemo(() => {
    return [...top100]
      .filter(t => getChangeByTimeFrame(t, timeFrame) !== null)
      .sort((a, b) => (getChangeByTimeFrame(b, timeFrame) ?? 0) - (getChangeByTimeFrame(a, timeFrame) ?? 0))
      .slice(0, 5);
  }, [top100, timeFrame]);

  const isLoading = altcoins.length === 0;

  return (
    <SmallWidget
      title="Top Gainers"
      icon={<TrendingUp className="w-4 h-4" />}
      subtitle="Top 5 in Top 100 by Market Cap"
      headerActions={<TimeFrameSelector value={timeFrame} onChange={setTimeFrame} />}
      loading={isLoading}
      tooltip={
        <TooltipContent items={[
          "Top 5 gainers from top 100 altcoins",
          "Switch timeframe: 1h / 4h / 24h",
          "Excludes BTC",
          "Click token to filter in table",
        ]} />
      }
    >
      <div className="space-y-1">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 w-4">{i}</span>
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
            const change = getChangeByTimeFrame(token, timeFrame);
            return (
              <div
                key={token.instId}
                className="flex items-center justify-between py-1.5 cursor-pointer hover:bg-gray-50 rounded -mx-2 px-2"
                onClick={() => onTokenClick?.(token.symbol)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 w-4">{i + 1}</span>
                  <TokenAvatar symbol={token.symbol} logo={token.logo} />
                  <span className="text-[12px] font-medium text-gray-900">{token.symbol}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500 tabular-nums">{formatPrice(token.price ?? 0)}</span>
                  <span className={`text-[12px] font-semibold tabular-nums ${formatChange(change).color}`}>
                    {formatChange(change).text}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </SmallWidget>
  );
}
