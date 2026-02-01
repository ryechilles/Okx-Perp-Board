'use client';

import { Activity } from 'lucide-react';
import { SmallWidget } from '@/components/widgets/base';
import { TooltipContent } from '@/components/ui';
import { getRsiPillStyle, getRsiSignal, RsiSignalInfo } from '@/lib/utils';

interface MarketMomentumProps {
  avgRsi7: number | null;
  avgRsi14: number | null;
  avgRsiW7: number | null;
  avgRsiW14: number | null;
}

// Extended momentum info with bgColor and textColor for this component
interface MomentumInfo extends RsiSignalInfo {
  bgColor: string;
  textColor: string;
}

// Get momentum info with background and text color for the summary boxes
function getMomentumInfo(rsi7: number | null, rsi14: number | null): MomentumInfo {
  const signalInfo = getRsiSignal(rsi7, rsi14);

  // Map signal to background color (lighter version for summary box)
  const bgColorMap: Record<string, string> = {
    'extreme-oversold': 'bg-green-100',
    'oversold': 'bg-green-50',
    'very-weak': 'bg-green-50',
    'weak': 'bg-emerald-50',
    'neutral': 'bg-gray-50',
    'strong': 'bg-orange-50',
    'very-strong': 'bg-red-50',
    'overbought': 'bg-red-100',
    'extreme-overbought': 'bg-red-100',
  };

  // Map signal to text color
  const textColorMap: Record<string, string> = {
    'extreme-oversold': 'text-green-600',
    'oversold': 'text-green-600',
    'very-weak': 'text-green-600',
    'weak': 'text-emerald-600',
    'neutral': 'text-gray-600',
    'strong': 'text-orange-600',
    'very-strong': 'text-red-600',
    'overbought': 'text-red-600',
    'extreme-overbought': 'text-red-600',
  };

  return {
    ...signalInfo,
    bgColor: bgColorMap[signalInfo.signal] || 'bg-gray-50',
    textColor: textColorMap[signalInfo.signal] || 'text-gray-600',
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
          <div className={`text-[13px] font-semibold ${dailyMomentum.textColor}`}>
            {dailyMomentum.label}
          </div>
        </div>
        <div className={`flex-1 rounded-lg px-3 py-2 ${weeklyMomentum.bgColor}`}>
          <div className="text-[10px] text-gray-500 mb-0.5">Weekly</div>
          <div className={`text-[13px] font-semibold ${weeklyMomentum.textColor}`}>
            {weeklyMomentum.label}
          </div>
        </div>
      </div>

      {/* Detailed RSI Values - same flex layout as boxes above for alignment */}
      <div className="flex gap-3 text-[11px] mt-3">
        {/* Daily RSI (left column) - px-3 matches the box above */}
        <div className="flex-1 space-y-1.5 px-3">
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
        {/* Weekly RSI (right column) - px-3 matches the box above */}
        <div className="flex-1 space-y-1.5 px-3">
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
