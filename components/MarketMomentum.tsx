'use client';

import { Activity } from 'lucide-react';
import { SmallWidget } from '@/components/widgets/base';
import { TooltipContent } from '@/components/ui';
import { getRsiPillStyle, getRsiSignal } from '@/lib/utils';

interface MarketMomentumProps {
  avgRsi7: number | null;
  avgRsi14: number | null;
  avgRsiW7?: number | null;
  avgRsiW14?: number | null;
}


export function MarketMomentum({ avgRsi7, avgRsi14 }: MarketMomentumProps) {
  const dailySignal = getRsiSignal(avgRsi7, avgRsi14);

  const isLoading = avgRsi7 === null && avgRsi14 === null;

  return (
    <SmallWidget
      title="Today Market Avg RSI"
      icon={<Activity className="w-4 h-4" />}
      subtitle="Top 100 OKX Perp Tokens"
      loading={isLoading}
      className="w-full"
      tooltip={
        <TooltipContent items={[
          "OKX perp top 100 by market cap",
          "Avg = (D-RSI7 + D-RSI14) / 2",
          "≤20: Extreme Oversold",
          "≤25: Oversold",
          "≤30: Very Weak",
          "≤40: Weak",
          "≤60: Neutral",
          "≤70: Strong",
          "≤80: Very Strong",
          "≤85: Overbought",
          ">85: Extreme Overbought",
        ]} />
      }
    >
      {/* Responsive layout: wrap when Extreme */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Signal Pill */}
        <span className={`inline-block px-5 py-2 rounded-lg text-base font-semibold whitespace-nowrap ${dailySignal.pillStyle}`}>
          {dailySignal.label}
        </span>

        {/* Daily RSI Values - Horizontal */}
        <div className="flex items-center gap-3 text-[11px] ml-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">D-RSI7 Avg</span>
            <span className={`px-2 py-0.5 rounded-md font-semibold tabular-nums min-w-[42px] text-center ${getRsiPillStyle(avgRsi7)}`}>
              {avgRsi7 != null ? avgRsi7.toFixed(1) : '--'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">D-RSI14 Avg</span>
            <span className={`px-2 py-0.5 rounded-md font-semibold tabular-nums min-w-[42px] text-center ${getRsiPillStyle(avgRsi14)}`}>
              {avgRsi14 != null ? avgRsi14.toFixed(1) : '--'}
            </span>
          </div>
        </div>
      </div>
    </SmallWidget>
  );
}
