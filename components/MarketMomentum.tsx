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
      <div className="group/momentum">
        {/* Signal Pill */}
        <div>
          <span className={`inline-block px-6 py-2.5 rounded-xl text-lg font-semibold whitespace-nowrap ${dailySignal.pillStyle}`}>
            {dailySignal.label}
          </span>
        </div>

        {/* Daily RSI Values - Show on hover with smooth transition */}
        <div className="flex items-center justify-between text-[11px] max-h-0 opacity-0 overflow-hidden transition-all duration-200 ease-out group-hover/momentum:max-h-10 group-hover/momentum:opacity-100 group-hover/momentum:mt-3">
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
