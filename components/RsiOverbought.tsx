'use client';

import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { SmallWidget } from '@/components/widgets/base';
import { TokenAvatar } from '@/components/ui';
import { ProcessedTicker, RSIData, MarketCapData } from '@/lib/types';
import { formatPrice, getRsiOverboughtPillStyle } from '@/lib/utils';

interface RsiOverboughtProps {
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

export function RsiOverbought({ tickers, rsiData, marketCapData, onTokenClick }: RsiOverboughtProps) {
  // Get overbought tokens from top 50 by market cap
  const overboughtTokens = useMemo(() => {
    const tokens: TokenWithRsi[] = [];

    tickers.forEach((ticker) => {
      // Skip BTC
      if (ticker.baseSymbol === 'BTC') return;

      const marketCap = marketCapData.get(ticker.baseSymbol);
      const rsi = rsiData.get(ticker.instId);

      // Only include tokens with market cap rank in top 50
      if (!marketCap || !marketCap.rank || marketCap.rank > 50) return;
      if (!rsi) return;

      // Calculate average RSI from all 4 values
      const rsiValues = [rsi.rsi7, rsi.rsi14, rsi.rsiW7, rsi.rsiW14].filter(
        (v): v is number => v !== null && v !== undefined
      );

      if (rsiValues.length === 0) return;

      const avgRsi = rsiValues.reduce((a, b) => a + b, 0) / rsiValues.length;

      // Only include if overbought (avg RSI > 75)
      if (avgRsi <= 75) return;

      tokens.push({
        symbol: ticker.baseSymbol,
        instId: ticker.instId,
        rank: marketCap.rank,
        price: ticker.priceNum,
        avgRsi,
        logo: marketCap.logo,
      });
    });

    // Sort by RSI descending (highest first) and take top 5
    return tokens.sort((a, b) => b.avgRsi - a.avgRsi).slice(0, 5);
  }, [tickers, rsiData, marketCapData]);

  const isLoading = tickers.size === 0;

  return (
    <SmallWidget
      title="RSI Overbought"
      icon={<TrendingUp className="w-4 h-4" />}
      subtitle="Avg RSI > 75 in Top 50"
      loading={isLoading}
      tooltip={
        <div className="space-y-1.5">
          <p className="font-medium">Overbought Detection</p>
          <ul className="space-y-1 text-gray-300">
            <li>• Filters top 50 altcoins by market cap</li>
            <li>• Avg RSI = (RSI7 + RSI14 + W-RSI7 + W-RSI14) / 4</li>
            <li>• Shows tokens with Avg RSI &gt; 75</li>
          </ul>
          <p className="text-gray-400 mt-2">Higher RSI = potentially overbought</p>
        </div>
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
        ) : overboughtTokens.length > 0 ? (
          overboughtTokens.map((token) => (
            <div
              key={token.instId}
              className="flex items-center justify-between py-1.5 cursor-pointer hover:bg-gray-50 rounded -mx-2 px-2"
              onClick={() => onTokenClick?.(token.symbol)}
            >
              <div className="flex items-center gap-2">
                <TokenAvatar symbol={token.symbol} logo={token.logo} />
                <span className="text-[12px] font-medium text-gray-900">{token.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-500 tabular-nums">{formatPrice(token.price)}</span>
                <span className={`text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-md ${getRsiOverboughtPillStyle(token.avgRsi)}`}>
                  {token.avgRsi.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-[11px] text-gray-400">
            No overbought tokens in Top 50
          </div>
        )}
      </div>
    </SmallWidget>
  );
}
