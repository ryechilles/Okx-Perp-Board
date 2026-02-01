'use client';

import { useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import { SmallWidget } from '@/components/widgets/base';
import { TooltipContent, TokenAvatar } from '@/components/ui';
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
          [1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
                <div className="w-10 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
                <div className="w-12 h-5 bg-gray-200 rounded-md animate-pulse" />
              </div>
            </div>
          ))
        ) : oversoldTokens.length > 0 ? (
          oversoldTokens.map((token) => (
            <div
              key={token.instId}
              className="flex items-center justify-between py-1.5 cursor-pointer hover:bg-gray-50 rounded -mx-2 px-2"
              onClick={() => onTokenClick?.(token.symbol)}
            >
              <div className="flex items-center gap-2">
                <TokenAvatar symbol={token.symbol} logo={token.logo} />
                <span className="text-[12px] font-medium text-gray-900">{token.symbol}</span>
              </div>
              <div className="flex items-center">
                <span className="text-[11px] text-gray-500 tabular-nums w-16 text-center">{formatPrice(token.price)}</span>
                <span className={`text-[11px] font-semibold tabular-nums w-14 text-center py-0.5 rounded-md ${getRsiOversoldPillStyle(token.avgRsi)}`}>
                  {token.avgRsi.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-[11px] text-gray-400">
            No oversold tokens in Top 50
          </div>
        )}
      </div>
    </SmallWidget>
  );
}
