'use client';

import { useState } from 'react';
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
  const [showDetails, setShowDetails] = useState(false);

  const dailyMomentum = getMomentumInfo(avgRsi7, avgRsi14);
  const weeklyMomentum = getMomentumInfo(avgRsiW7, avgRsiW14);

  return (
    <div
      className="relative flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg cursor-default"
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      {/* Icon */}
      <svg
        className="w-4 h-4 text-gray-500 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>

      {/* Main content */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-medium text-gray-700 leading-none">Market Avg RSI</span>
        <div className="flex items-center gap-2 text-[13px] leading-none">
          <span className="text-gray-500">Daily:</span>
          <span className={`font-medium ${dailyMomentum.color}`}>{dailyMomentum.label}</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-500">Weekly:</span>
          <span className={`font-medium ${weeklyMomentum.color}`}>{weeklyMomentum.label}</span>
        </div>
      </div>

      {/* Hover tooltip with detailed RSI values */}
      {showDetails && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
          <div className="text-[11px] font-medium text-gray-500 mb-2">Top 100 OKX Perp Token AVG RSI</div>
          <div className="flex items-center gap-3 text-[12px]">
            {/* Daily RSI - Left */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="text-gray-900">D-RSI7:</span>
                <span className={`font-medium tabular-nums ${getRsiClass(avgRsi7)}`}>
                  {formatRsi(avgRsi7)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-900">D-RSI14:</span>
                <span className={`font-medium tabular-nums ${getRsiClass(avgRsi14)}`}>
                  {formatRsi(avgRsi14)}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="text-gray-500">|</div>

            {/* Weekly RSI - Right */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="text-gray-900">W-RSI7:</span>
                <span className={`font-medium tabular-nums ${getRsiClass(avgRsiW7)}`}>
                  {formatRsi(avgRsiW7)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-900">W-RSI14:</span>
                <span className={`font-medium tabular-nums ${getRsiClass(avgRsiW14)}`}>
                  {formatRsi(avgRsiW14)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
