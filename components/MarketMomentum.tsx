'use client';

import { Activity } from 'lucide-react';
import { SmallWidget } from '@/components/widgets/base';
import { TooltipContent } from '@/components/ui';
import { getRsiClass, formatRsi, getRsiSignal, RsiSignalInfo } from '@/lib/utils';

interface MarketMomentumProps {
  avgRsi7: number | null;
  avgRsi14: number | null;
  avgRsiW7: number | null;
  avgRsiW14: number | null;
}

// Extended momentum info with bgColor for this component
interface MomentumInfo extends RsiSignalInfo {
  bgColor: string;
}

// Get momentum info with background color
function getMomentumInfo(rsi7: number | null, rsi14: number | null): MomentumInfo {
  const signalInfo = getRsiSignal(rsi7, rsi14);

  // Map signal to background color
  const bgColorMap: Record<string, string> = {
    'oversold': 'bg-green-50',
    'weak': 'bg-green-50',
    'neutral-weak': 'bg-emerald-50',
    'neutral': 'bg-gray-50',
    'neutral-strong': 'bg-orange-50',
    'strong': 'bg-red-50',
    'overbought': 'bg-red-50',
  };

  return {
    ...signalInfo,
    bgColor: bgColorMap[signalInfo.signal] || 'bg-gray-50',
  };
}

export function MarketMomentum({ avgRsi7, avgRsi14, avgRsiW7, avgRsiW14 }: MarketMomentumProps) {
  const dailyMomentum = getMomentumInfo(avgRsi7, avgRsi14);
  const weeklyMomentum = getMomentumInfo(avgRsiW7, avgRsiW14);

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
      <div className="flex items-center gap-3">
        <div className={`flex-1 rounded-lg px-3 py-2 ${dailyMomentum.bgColor}`}>
          <div className="text-[10px] text-gray-500 mb-0.5">Daily</div>
          <div className={`text-[13px] font-semibold ${dailyMomentum.color}`}>
            {dailyMomentum.label}
          </div>
        </div>
        <div className={`flex-1 rounded-lg px-3 py-2 ${weeklyMomentum.bgColor}`}>
          <div className="text-[10px] text-gray-500 mb-0.5">Weekly</div>
          <div className={`text-[13px] font-semibold ${weeklyMomentum.color}`}>
            {weeklyMomentum.label}
          </div>
        </div>
      </div>

      {/* Detailed RSI Values - same flex layout as boxes above for alignment */}
      <div className="flex gap-3 text-[11px] mt-3">
        {/* Daily RSI (left column) */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">D-RSI7</span>
            <span className={`font-medium tabular-nums ${getRsiClass(avgRsi7)}`}>
              {formatRsi(avgRsi7)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">D-RSI14</span>
            <span className={`font-medium tabular-nums ${getRsiClass(avgRsi14)}`}>
              {formatRsi(avgRsi14)}
            </span>
          </div>
        </div>
        {/* Weekly RSI (right column) */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">W-RSI7</span>
            <span className={`font-medium tabular-nums ${getRsiClass(avgRsiW7)}`}>
              {formatRsi(avgRsiW7)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">W-RSI14</span>
            <span className={`font-medium tabular-nums ${getRsiClass(avgRsiW14)}`}>
              {formatRsi(avgRsiW14)}
            </span>
          </div>
        </div>
      </div>
    </SmallWidget>
  );
}
