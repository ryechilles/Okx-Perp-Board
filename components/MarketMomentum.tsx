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
        ]} />
      }
    >
      {/* Signal Pill - Large, Left aligned */}
      <div className="mb-3">
        <span className={`inline-block px-5 py-2 rounded-lg text-base font-semibold whitespace-nowrap ${dailySignal.pillStyle}`}>
          {dailySignal.label}
        </span>
      </div>

      {/* Daily RSI Values - Compact spacing */}
      <div className="space-y-1 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">D-RSI7 Avg</span>
          <span className={`px-2 py-0.5 rounded-md font-semibold tabular-nums min-w-[42px] text-center ${getRsiPillStyle(avgRsi7)}`}>
            {avgRsi7 != null ? avgRsi7.toFixed(1) : '--'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">D-RSI14 Avg</span>
          <span className={`px-2 py-0.5 rounded-md font-semibold tabular-nums min-w-[42px] text-center ${getRsiPillStyle(avgRsi14)}`}>
            {avgRsi14 != null ? avgRsi14.toFixed(1) : '--'}
          </span>
        </div>
      </div>
    </SmallWidget>
  );
}
