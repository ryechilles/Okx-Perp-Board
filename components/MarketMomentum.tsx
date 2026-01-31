'use client';

import { Activity } from 'lucide-react';
import { SmallWidget } from '@/components/widgets/base';
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
      className="min-w-[280px] max-w-[320px]"
    >
      {/* Signal Summary */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`flex-1 rounded-lg px-3 py-2 ${dailyMomentum.bgColor}`}>
          <div className="text-[11px] text-gray-500 mb-0.5">Daily</div>
          <div className={`text-sm font-semibold ${dailyMomentum.color}`}>
            {dailyMomentum.label}
          </div>
        </div>
        <div className={`flex-1 rounded-lg px-3 py-2 ${weeklyMomentum.bgColor}`}>
          <div className="text-[11px] text-gray-500 mb-0.5">Weekly</div>
          <div className={`text-sm font-semibold ${weeklyMomentum.color}`}>
            {weeklyMomentum.label}
          </div>
        </div>
      </div>

      {/* Detailed RSI Values */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
        {/* Daily RSI */}
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

        {/* Weekly RSI */}
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
    </SmallWidget>
  );
}
