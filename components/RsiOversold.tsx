'use client';

import { useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import { SmallWidget } from '@/components/widgets/base';
import { TooltipContent, TokenRowItem, TokenRowSkeleton, TokenRowEmpty } from '@/components/ui';
import { ProcessedTicker, RSIData, MarketCapData } from '@/lib/types';
import { formatPrice, getRsiOversoldPillStyle } from '@/lib/utils';
import { calculateAvgRsi } from '@/lib/widget-utils';

interface RsiOversoldProps {
  tickers: Map<string, ProcessedTicker>;
  rsiData: Map<string, RSIData>;
  marketCapData: Map<string, MarketCapData>;
  onTokenClick?: (symbol: string) => void;
}

interface TokenWithRsi {
  symbol: string;
  instId: string;
  rank: number;
  price: number;
  avgRsi: number;
  logo?: string;
}

export function RsiOversold({ tickers, rsiData, marketCapData, onTokenClick }: RsiOversoldProps) {
  // Get oversold tokens from top 50 by market cap
  const oversoldTokens = useMemo(() => {
    const tokens: TokenWithRsi[] = [];

    tickers.forEach((ticker) => {
      if (ticker.baseSymbol === 'BTC') return;

      const marketCap = marketCapData.get(ticker.baseSymbol);
      const rsi = rsiData.get(ticker.instId);

      if (!marketCap || !marketCap.rank || marketCap.rank > 50) return;
      if (!rsi) return;

      const avgRsi = calculateAvgRsi(rsi);
      if (avgRsi === null || avgRsi >= 25) return;

      tokens.push({
        symbol: ticker.baseSymbol,
        instId: ticker.instId,
        rank: marketCap.rank,
        price: ticker.priceNum,
        avgRsi,
        logo: marketCap.logo,
      });
    });

    return tokens.sort((a, b) => a.avgRsi - b.avgRsi).slice(0, 5);
  }, [tickers, rsiData, marketCapData]);

  const isLoading = tickers.size === 0;

  return (
    <SmallWidget
      title="RSI Oversold"
      icon={<TrendingDown className="w-4 h-4" />}
      subtitle="Avg RSI < 25 in Top 50"
      loading={isLoading}
      tooltip={
        <TooltipContent items={[
          "Filters top 50 altcoins by market cap",
          "Avg RSI = (RSI7 + RSI14 + W-RSI7 + W-RSI14) / 4",
          "Shows tokens with Avg RSI < 25",
          "Lower RSI = potentially oversold",
        ]} />
      }
    >
      <div className="space-y-1">
        {isLoading ? (
          [1, 2, 3].map((i) => <TokenRowSkeleton key={i} columns={2} />)
        ) : oversoldTokens.length > 0 ? (
          oversoldTokens.map((token) => (
            <TokenRowItem
              key={token.instId}
              symbol={token.symbol}
              logo={token.logo}
              onClick={() => onTokenClick?.(token.symbol)}
              rightContent={
                <>
                  <span className="text-[11px] text-gray-500 tabular-nums">
                    {formatPrice(token.price)}
                  </span>
                  <span className={`text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-md ${getRsiOversoldPillStyle(token.avgRsi)}`}>
                    {token.avgRsi.toFixed(2)}
                  </span>
                </>
              }
            />
          ))
        ) : (
          <TokenRowEmpty message="No oversold tokens in Top 50" />
        )}
      </div>
    </SmallWidget>
  );
}
