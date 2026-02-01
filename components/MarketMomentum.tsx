'use client';

import { Activity } from 'lucide-react';
import { SmallWidget } from '@/components/widgets/base';
import { TooltipContent } from '@/components/ui';
import { getRsiPillStyle, getRsiSignal } from '@/lib/utils';

interface MarketMomentumProps {
  avgRsi7: number | null;
  avgRsi14: number | null;
  avgRsiW7: number | null;
  avgRsiW14: number | null;
}


export function MarketMomentum({ avgRsi7, avgRsi14, avgRsiW7, avgRsiW14 }: MarketMomentumProps) {
  const dailySignal = getRsiSignal(avgRsi7, avgRsi14);
  const weeklySignal = getRsiSignal(avgRsiW7, avgRsiW14);

  const isLoading = avgRsi7 === null && avgRsi14 === null;

  return (
    <SmallWidget
      title="Market Avg RSI"
      icon={<Activity className="w-4 h-4" />}
      subtitle="Top 100 OKX Perp Tokens"
      loading={isLoading}
      className="w-full"
      tooltip={
        <TooltipContent items={[
          "OKX perp top 100 by market cap",
          "Daily: RSI7 & RSI14 (1D candles)",
          "Weekly: W-RSI7 & W-RSI14 (1W candles)",
        ]} />
      }
    >
      {/* Signal Summary - Always visible */}
      <div className="flex items-center gap-4">
        <div className="flex-1 text-center">
          <div className="text-[10px] text-gray-500 mb-1.5">Daily</div>
          <span className={`inline-block px-3 py-1 rounded-lg text-[13px] font-semibold whitespace-nowrap ${dailySignal.pillStyle}`}>
            {dailySignal.label}
          </span>
        </div>
        <div className="flex-1 text-center">
          <div className="text-[10px] text-gray-500 mb-1.5">Weekly</div>
          <span className={`inline-block px-3 py-1 rounded-lg text-[13px] font-semibold whitespace-nowrap ${weeklySignal.pillStyle}`}>
            {weeklySignal.label}
          </span>
        </div>
      </div>

      {/* Detailed RSI Values */}
      <div className="flex gap-4 text-[11px] mt-3">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">D-RSI7</span>
            <span className={`px-2 py-0.5 rounded-md font-semibold tabular-nums min-w-[42px] text-center ${getRsiPillStyle(avgRsi7)}`}>
              {avgRsi7 != null ? avgRsi7.toFixed(1) : '--'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">D-RSI14</span>
            <span className={`px-2 py-0.5 rounded-md font-semibold tabular-nums min-w-[42px] text-center ${getRsiPillStyle(avgRsi14)}`}>
              {avgRsi14 != null ? avgRsi14.toFixed(1) : '--'}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">W-RSI7</span>
            <span className={`px-2 py-0.5 rounded-md font-semibold tabular-nums min-w-[42px] text-center ${getRsiPillStyle(avgRsiW7)}`}>
              {avgRsiW7 != null ? avgRsiW7.toFixed(1) : '--'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">W-RSI14</span>
            <span className={`px-2 py-0.5 rounded-md font-semibold tabular-nums min-w-[42px] text-center ${getRsiPillStyle(avgRsiW14)}`}>
              {avgRsiW14 != null ? avgRsiW14.toFixed(1) : '--'}
            </span>
          </div>
        </div>
      </div>
    </SmallWidget>
  );
}
